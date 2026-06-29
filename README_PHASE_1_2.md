# Instrucciones — Fase 1 y Fase 2

## Estado

Fase 1 y Fase 2 fueron ejecutadas contra Supabase self-hosted.

## Archivos creados localmente

- `diagnostics/phase-1-diagnosis.md`
- `supabase/migrations/20260629170000_security_mvp_schema.sql`

## Migración aplicada

Aplicada en Supabase con usuario `supabase_admin` porque `storage.objects` pertenece a `supabase_storage_admin` y `postgres` local no puede alterar/policizar storage.

Comando usado:

```bash
docker exec -i supabase-db bash -lc 'export PGPASSWORD="$POSTGRES_PASSWORD"; psql -h 127.0.0.1 -U supabase_admin -d postgres -v ON_ERROR_STOP=1' \
  < supabase/migrations/20260629170000_security_mvp_schema.sql
```

## Verificación ejecutada

Resultados reales:

```txt
tables=9
rls=9
policies=28
buckets=case-photos-private:false:5242880, handover-evidence-private:false:5242880, public-report-uploads:false:5242880
events_after_case=1
audit_after_case=1
public_rpc={"public_code":"NTV...","display_name":"A** F.","approximate_age":9,"sex":"femenino","status":"registrado","zone_general":"Zona Norte","public_photo_path":null}
anon_direct_cases_count=0
```

Eso confirma:

- RLS activo y forzado en las 9 tablas de dominio.
- Buckets privados creados.
- Policies de tablas + storage creadas.
- Trigger de evento para caso creado funciona.
- Audit log para caso creado funciona.
- RPC pública limita datos sensibles.
- `anon` no puede leer `cases` directamente.
- `anon` sí puede insertar `public_reports` pendientes.

## Variables esperadas para Next.js

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Regla: `SUPABASE_SERVICE_ROLE_KEY` solo server-side, nunca en cliente.

## Bootstrap del primer admin

Después de que el primer usuario se registre por Supabase Auth, promoverlo manualmente desde DB o script server-side seguro:

```sql
update public.profiles
set role = 'admin', approved = true, approved_at = now()
where id = '<AUTH_USER_UUID>';
```

Luego, aprobaciones/roles deben hacerse desde UI admin o endpoint server-side auditado.

## Integración frontend pendiente

Bloqueada por acceso al repo GitHub. Fallos actuales:

- HTTPS: requiere credenciales válidas.
- SSH deploy key actual: `Repository not found`.
- Token local GitHub: 401.

Cuando exista acceso, integrar sin rehacer:

1. Copiar `supabase/migrations/20260629170000_security_mvp_schema.sql` al repo.
2. Añadir clientes Supabase browser/server.
3. Añadir Zod schemas y servicios.
4. Implementar rutas privadas con `ProtectedRoute` + `RoleGuard`.
5. Implementar vistas públicas usando solo `get_public_case_by_code`.
6. Usar signed URLs para storage privado.

## Seguridad / no negociables

- No usar datos reales ni fotos reales en QA.
- No reconocimiento facial.
- No exponer ubicación exacta, salud, familia, contactos, notas internas, entregas o traslados públicamente.
- No delete físico desde UI.
- Toda acción sensible debe generar `audit_logs` y/o `case_events`.
- Revisión legal obligatoria antes de uso real.
