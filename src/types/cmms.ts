// ============================================================================
// TIPOS E INTERFACES DEL DOMINIO CMMS / GMAO (ESQUEMA SQL EXACTO)
// ============================================================================

export type RegionType = "CABA" | "GBA" | "Interior";

export type UserRole =
  | "admin"
  | "jefe_mantenimiento"
  | "tecnico"
  | "encargado_local";

export type AssetCategoryCode = "HVAC" | "REFRIG";

export type CriticalityLevel = "baja" | "media" | "alta" | "critica";

export type AssetStatus =
  | "operativo"
  | "con_falla"
  | "en_reparacion"
  | "baja";

export type TicketPriority = "baja" | "media" | "alta" | "critica";

export type TicketStatus =
  | "abierto"
  | "asignado"
  | "en_visita"
  | "resuelto"
  | "cancelado";

export type ChecklistInputType = "check" | "number" | "photo";

export interface Zone {
  id: number;
  name: string;
  region: RegionType;
  supervisor_user_id: number | null;
  created_at: string;
}

export interface Store {
  id: number;
  code: string;
  name: string;
  zone_id: number;
  address: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  surface_sqm: number;
  phone: string;
  is_active: boolean;
  created_at?: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  company_name: string;
  is_active: boolean;
  assigned_store_ids?: number[];
}

export interface AssetCategory {
  id: number;
  code: AssetCategoryCode;
  name: string;
}

export interface AssetType {
  id: number;
  category_id: number;
  name: string;
}

export interface Asset {
  id: number;
  store_id: number;
  asset_type_id: number;
  tag_code: string;
  qr_code_uuid: string;
  brand: string;
  model: string;
  serial_number: string;
  location_in_store: string;
  criticality: CriticalityLevel;
  status: AssetStatus;
  capacity_kcal_fg: number;
  refrigerant_type: string;
  power_supply: string;
  is_inverter: boolean;
  installation_date: string;
  warranty_expiration: string;
  technical_specs: Record<string, string | number | boolean>;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceRequest {
  id: number;
  ticket_number: string;
  store_id: number;
  asset_id: number | null;
  created_by_user_id: number;
  failure_symptom: string;
  priority: TicketPriority;
  description: string;
  photo_evidence_url?: string;
  status: TicketStatus;
  assigned_technician_id: number | null;
  reported_at: string;
  attended_at: string | null;
  resolved_at: string | null;
  resolution_comment: string | null;
  closing_photo_url?: string | null;
  sync_offline_id?: string;
}

export interface MaintenancePlan {
  id: number;
  name: string;
  asset_type_id: number;
  frequency_days: number;
  is_active: boolean;
}

export interface PlanChecklistItem {
  id: number;
  plan_id: number;
  step_order: number;
  task_description: string;
  input_type: ChecklistInputType;
  unit: string | null;
}

export interface PreventiveExecution {
  id: number;
  plan_id: number;
  asset_id: number;
  technician_id: number;
  executed_at: string;
  results: Record<string, boolean | number | string>;
  observations: string;
  signature_url: string;
  sync_offline_id: string;
}

// Cola de sincronización Offline-First (PWA)
export interface OfflineQueueItem {
  sync_offline_id: string;
  entity_type: "maintenance_request" | "preventive_execution" | "ticket_status_update";
  action_label: string;
  payload: unknown;
  created_at: string;
  synced: boolean;
}

// Métricas e Indicadores Operativos (Módulo 4)
export interface OperationalKPIs {
  mttrHours: number; // Mean Time To Repair (Horas promedio de resolución)
  mtbfHours: number; // Mean Time Between Failures (Horas promedio entre fallas)
  availabilityPercent: number; // Disponibilidad técnica del parque HVAC (%)
  slaCompliancePercent: number; // % de tickets dentro de SLA según criticidad
  totalStores: number; // 528 locales
  activeHvacAssets: number;
  openTicketsCount: number;
  criticalOpenCount: number;
  preventiveCompliancePercent: number;
}
