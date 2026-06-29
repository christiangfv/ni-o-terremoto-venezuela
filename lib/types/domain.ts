export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "organizacion" | "voluntario" | "salud_albergue" | "publico";
export type CaseStatus = "registrado" | "en_resguardo" | "requiere_atencion" | "en_traslado" | "reunificacion_pendiente" | "entregado" | "cerrado";
export type RiskLevel = "bajo" | "medio" | "alto" | "critico";
export type SexType = "femenino" | "masculino" | "otro" | "desconocido";
export type ReportStatus = "pendiente" | "en_revision" | "aprobado" | "rechazado" | "duplicado";

export type Profile = {
  id: string;
  organization_id: string | null;
  full_name: string | null;
  role: UserRole;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  contact_phone: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Case = {
  id: string;
  organization_id: string;
  public_code: string;
  first_name: string;
  last_name: string | null;
  approximate_age: number | null;
  sex: SexType;
  status: CaseStatus;
  risk: RiskLevel;
  zone_general: string | null;
  location_exact: string | null;
  health_notes: string | null;
  family_contact_notes: string | null;
  internal_notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CaseEvent = {
  id: string;
  case_id: string;
  organization_id: string;
  type: string;
  title: string;
  details: Json;
  actor_id: string | null;
  created_at: string;
};

export type PublicCase = {
  public_code: string;
  display_name: string;
  approximate_age: number | null;
  sex: SexType;
  status: CaseStatus;
  zone_general: string | null;
  public_photo_path: string | null;
};
