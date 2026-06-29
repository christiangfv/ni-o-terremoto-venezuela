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
