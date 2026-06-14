// ── Tipos compartidos del módulo Consultorio ────────────────────────────────
// Importados por consultorio.ts, patient-form-modal y appointment-form-modal
// para evitar dependencias circulares.

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

// ── Ficha completa del paciente (formulario + edición) ─────────────────────
// Coincide con la tabla `patients` de Supabase más campos extendidos de historial.
export interface PatientDetail {
  id_paciente?: string;           // Presente al editar, ausente al crear

  // Datos personales
  full_name: string;
  phone: string;
  birth_date: string;
  gender: string;
  email: string;
  address: string;

  // Datos físicos (doctor)
  blood_type: string;
  weight_kg: string;
  height_cm: string;

  // Alergias (doctor)
  has_allergies: boolean;
  allergies_medications: string;
  allergies_materials: string;
  allergies_other: string;

  // Antecedentes sistémicos (doctor)
  has_chronic_conditions: boolean;
  chronic_conditions: string;
  takes_medications: boolean;
  current_medications: string;
  has_previous_surgeries: boolean;
  surgeries_detail: string;
  is_pregnant: 'si' | 'no' | 'na';
  smokes: boolean;
  drinks_alcohol: boolean;

  // Antecedentes dentales (doctor)
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

// ── Datos de formulario de cita (crear + editar) ───────────────────────────
// Coincide con la tabla `appointments` de Supabase.
export interface AppointmentFormData {
  id_cita?: string;               // Presente al editar
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

// ── Valor vacío por defecto para PatientDetail ─────────────────────────────
export const EMPTY_PATIENT: PatientDetail = {
  full_name: '', phone: '', birth_date: '', gender: '', email: '', address: '',
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

// ── Valor vacío por defecto para AppointmentFormData ──────────────────────
export const EMPTY_APPOINTMENT: AppointmentFormData = {
  id_paciente: '', patient_name: '', id_doctor: '',
  scheduled_date: '', scheduled_time: '', duration_minutes: 30,
  reason: '', notes: '', status: 'pendiente',
};
