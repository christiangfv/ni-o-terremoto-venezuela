import { z } from "zod";

export const caseStatusSchema = z.enum([
  "registrado",
  "en_resguardo",
  "requiere_atencion",
  "en_traslado",
  "reunificacion_pendiente",
  "entregado",
  "cerrado"
]);

export const riskSchema = z.enum(["bajo", "medio", "alto", "critico"]);
export const sexSchema = z.enum(["femenino", "masculino", "otro", "desconocido"]);

const optionalPrivateText = z.string().max(4000).optional().or(z.literal(""));

export const caseCreateSchema = z.object({
  organization_id: z.string().uuid(),
  first_name: z.string().min(1).max(120),
  last_name: z.string().max(120).optional().or(z.literal("")),
  approximate_age: z.coerce.number().int().min(0).max(17).nullable().optional(),
  sex: sexSchema.default("desconocido"),
  status: caseStatusSchema.default("registrado"),
  risk: riskSchema.default("medio"),
  zone_general: z.string().max(255).optional().or(z.literal("")),
  location_exact: optionalPrivateText,
  health_notes: optionalPrivateText,
  family_contact_notes: optionalPrivateText,
  internal_notes: optionalPrivateText
});

export const caseUpdateSchema = caseCreateSchema.partial().extend({ id: z.string().uuid() });

export const publicReportSchema = z.object({
  public_code: z.string().trim().max(32).optional().or(z.literal("")),
  reporter_name: z.string().max(120).optional().or(z.literal("")),
  reporter_contact: z.string().max(180).optional().or(z.literal("")),
  message: z.string().min(10).max(2000),
  zone_general: z.string().max(255).optional().or(z.literal(""))
});

export const handoverSchema = z.object({
  case_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  recipient_name: z.string().min(1).max(180),
  recipient_relationship: z.string().max(120).optional().or(z.literal("")),
  recipient_document_ref: z.string().max(180).optional().or(z.literal("")),
  notes: optionalPrivateText
});

export const transferSchema = z.object({
  case_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  from_zone: z.string().min(1).max(255),
  to_zone: z.string().min(1).max(255),
  from_location_exact: optionalPrivateText,
  to_location_exact: optionalPrivateText,
  reason: optionalPrivateText,
  responsible_person: z.string().max(180).optional().or(z.literal(""))
});

export const publicCaseCodeSchema = z.string().trim().min(4).max(32).transform((value) => value.toUpperCase());

// Roles that can be assigned to team members (everything except the default public role).
export const assignableRoleSchema = z.enum(["admin", "organizacion", "voluntario", "salud_albergue"]);

export const organizationSchema = z.object({
  name: z.string().min(1).max(160),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe estar en minúsculas con guiones"),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().max(60).optional().or(z.literal("")),
  active: z.boolean().default(true)
});

export const organizationUpdateSchema = organizationSchema.partial().extend({ id: z.string().uuid() });

export const createUserSchema = z
  .object({
    email: z.string().email(),
    full_name: z.string().min(1).max(160),
    password: z.string().min(8).max(200),
    role: assignableRoleSchema,
    organization_id: z.string().uuid().nullable().optional()
  })
  .superRefine((value, ctx) => {
    // Non-admin roles are scoped to an organization by RLS, so an org is required;
    // a member created without one could not see or act on any case. Admins are
    // cross-organization and may be created without one.
    if (value.role !== "admin" && !value.organization_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organization_id"],
        message: "Selecciona una organización para este rol"
      });
    }
  });

export const userUpdateSchema = z.object({
  id: z.string().uuid(),
  role: assignableRoleSchema.optional(),
  organization_id: z.string().uuid().nullable().optional(),
  approved: z.boolean().optional()
});

export const reportReviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["en_revision", "aprobado", "rechazado", "duplicado"]),
  moderation_notes: z.string().max(2000).optional().or(z.literal(""))
});
