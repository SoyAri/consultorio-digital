// ── Tipos compartidos a nivel de aplicación ──────────────────────────────────
// Importados por cualquier feature: consultorio, pacientes, portal, etc.

export type UserRole = 'doctor' | 'admin';
export type AppointmentStatus = 'pendiente' | 'en_curso' | 'completada' | 'cancelada';
export type ClinicStatus = 'en_tratamiento' | 'dado_de_alta' | 'inactivo';
export type PatientFormMode = 'create' | 'edit';
export type AppointmentFormMode = 'create' | 'edit';

export interface DoctorOption {
  id_usuario: string;
  full_name: string;
  specialty: string;
}

// ── Ficha completa del paciente ───────────────────────────────────────────────
// Coincide con la tabla `patients` de Supabase + historial médico extendido.
export interface PatientDetail {
  id_paciente?: string;

  // Básicos (únicos verdaderamente obligatorios en el formulario)
  full_name: string;
  birth_date: string;

  // Contacto
  phone: string;
  email: string;
  address: string;
  gender: string;

  // Datos físicos
  blood_type: string;
  weight_kg: string;
  height_cm: string;

  // Alergias
  has_allergies: boolean;
  allergies_medications: string;
  allergies_materials: string;
  allergies_other: string;

  // Antecedentes sistémicos
  has_chronic_conditions: boolean;
  chronic_conditions: string;
  takes_medications: boolean;
  current_medications: string;
  has_previous_surgeries: boolean;
  surgeries_detail: string;
  is_pregnant: 'si' | 'no' | 'na';
  smokes: boolean;
  drinks_alcohol: boolean;

  // Antecedentes dentales
  had_dental_treatment: boolean;
  last_dental_visit: string;
  dental_treatments_history: string;
  has_dental_sensitivity: boolean;
  sensitivity_triggers: string;
  has_braces_history: boolean;
  has_prosthetics: boolean;
  prosthetics_detail: string;

  // Motivo y notas
  chief_complaint: string;
  notes: string;

  // Asignación
  assigned_doctor_id: string;
  clinic_status: ClinicStatus;
}

// ── Datos de cita ─────────────────────────────────────────────────────────────
// Coincide con la tabla `appointments` de Supabase.
export interface AppointmentFormData {
  id_cita?: string;
  id_paciente: string;
  patient_name: string;
  id_doctor: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  reason: string;
  notes: string;
  status: AppointmentStatus;
}

// ── Valores vacíos por defecto ────────────────────────────────────────────────
export const EMPTY_PATIENT: PatientDetail = {
  full_name: '', birth_date: '',
  phone: '', email: '', address: '', gender: '',
  blood_type: '', weight_kg: '', height_cm: '',
  has_allergies: false, allergies_medications: '', allergies_materials: '', allergies_other: '',
  has_chronic_conditions: false, chronic_conditions: '',
  takes_medications: false, current_medications: '',
  has_previous_surgeries: false, surgeries_detail: '',
  is_pregnant: 'na', smokes: false, drinks_alcohol: false,
  had_dental_treatment: false, last_dental_visit: '', dental_treatments_history: '',
  has_dental_sensitivity: false, sensitivity_triggers: '',
  has_braces_history: false, has_prosthetics: false, prosthetics_detail: '',
  chief_complaint: '', notes: '', assigned_doctor_id: '',
  clinic_status: 'en_tratamiento',
};

export const EMPTY_APPOINTMENT: AppointmentFormData = {
  id_paciente: '', patient_name: '', id_doctor: '',
  scheduled_date: '', scheduled_time: '', duration_minutes: 30,
  reason: '', notes: '', status: 'pendiente',
};
