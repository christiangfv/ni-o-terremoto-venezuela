// Bootstrap the FIRST admin user.
//
// The app uses an "admin creates accounts" model: only an approved admin can
// create/approve other users. That creates a chicken-and-egg for the very first
// admin, which this one-shot script resolves using the Supabase service-role key.
//
// It is idempotent: if the auth user already exists it is reused (and its
// password updated when one is supplied); the profile is promoted to an approved
// admin either way.
//
// Usage (from the repo root, with env vars available):
//   NEXT_PUBLIC_SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  \
//   node scripts/bootstrap-admin.mjs <email> <password> ["Nombre Completo"]
//
// or via npm:  npm run bootstrap:admin -- <email> <password> ["Nombre Completo"]
//
// Email/password/name also read from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_FULL_NAME.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.argv[3] ?? process.env.ADMIN_PASSWORD ?? "";
const fullName = process.argv[4] ?? process.env.ADMIN_FULL_NAME ?? email;

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (!url || !serviceRoleKey) {
  fail("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
}
if (!email) {
  fail("Debes indicar un email: node scripts/bootstrap-admin.mjs <email> <password>");
}

const service = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function findUserByEmail(targetEmail) {
  // listUsers is paginated; scan pages until we find the email or run out.
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(`No se pudieron listar usuarios: ${error.message}`);
    const match = data.users.find((u) => (u.email ?? "").toLowerCase() === targetEmail);
    if (match) return match;
    if (data.users.length < 200) return null; // last page reached
  }
  return null;
}

async function main() {
  let user = await findUserByEmail(email);

  if (!user) {
    if (!password || password.length < 8) {
      fail("El usuario no existe y se requiere una contraseña de al menos 8 caracteres para crearlo.");
    }
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });
    if (error || !data?.user) fail(`No se pudo crear el usuario: ${error?.message ?? "desconocido"}`);
    user = data.user;
    console.log(`• Usuario de auth creado: ${email} (${user.id})`);
  } else {
    console.log(`• Usuario de auth existente reutilizado: ${email} (${user.id})`);
    if (password && password.length >= 8) {
      const { error } = await service.auth.admin.updateUserById(user.id, { password });
      if (error) fail(`No se pudo actualizar la contraseña: ${error.message}`);
      console.log("• Contraseña actualizada.");
    }
  }

  // Promote (or create) the profile to an approved admin. The on_auth_user_created
  // trigger normally inserts a 'publico'/unapproved profile; upsert covers the
  // rare case where the row is missing. role='admin' + approved=true satisfies the
  // profiles_approved_requires_non_public_role constraint.
  const { error: profileError } = await service
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        role: "admin",
        approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

  if (profileError) fail(`No se pudo promover el perfil a admin: ${profileError.message}`);

  console.log(`\n✓ Listo. ${email} es ahora admin aprobado. Inicia sesión en /login.\n`);
}

main().catch((err) => fail(err?.message ?? String(err)));
