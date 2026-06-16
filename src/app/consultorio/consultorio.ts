import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  UserRole, AppointmentStatus, ClinicStatus,
  PatientDetail, PatientFormMode,
  AppointmentFormData, AppointmentFormMode,
  ConsultationRecord, ConsultationFormMode,
  DoctorOption,
} from './models';
import { PatientFormModal } from '../../components/patient-form-modal/patient-form-modal';
import { AppointmentFormModal } from '../../components/appointment-form-modal/appointment-form-modal';
import { ConsultationFormModal } from '../../components/consultation-form-modal/consultation-form-modal';

// ── Tipos internos del dashboard ─────────────────────────────────────────────
export interface StaffUser {
  id_usuario: string;
  full_name: string;
  role: UserRole;
  specialty?: string;
  email: string;
}

export interface Appointment {
  id_cita: string;
  id_paciente: string;
  id_doctor: string;
  patient_name: string;
  doctor_name: string;
  scheduled_at: Date;
  status: AppointmentStatus;
  reason: string;
  avatar_initials: string;
}

// Re-export para que los módulos de pacientes puedan importarlos
export type { UserRole, AppointmentStatus, ClinicStatus };

// ── Datos simulados (reemplazar con llamadas a Supabase) ─────────────────────
const MOCK_DOCTOR: StaffUser = {
  id_usuario: 'usr-001',
  full_name: 'Ricardo Mendoza',
  role: 'doctor',
  specialty: 'Ortodoncia',
  email: 'r.mendoza@consultorio.mx',
};

const MOCK_SECRETARY: StaffUser = {
  id_usuario: 'usr-002',
  full_name: 'Laura Sánchez',
  role: 'admin',
  email: 'l.sanchez@consultorio.mx',
};

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id_cita: 'cit-001', id_paciente: 'pac-001', id_doctor: 'usr-001',
    patient_name: 'Ana García López', doctor_name: 'Dr. Ricardo Mendoza',
    scheduled_at: new Date(new Date().setHours(9, 0, 0, 0)),
    status: 'completada', reason: 'Revisión de brackets', avatar_initials: 'AG',
  },
  {
    id_cita: 'cit-002', id_paciente: 'pac-002', id_doctor: 'usr-001',
    patient_name: 'Carlos Ruiz Herrera', doctor_name: 'Dr. Ricardo Mendoza',
    scheduled_at: new Date(new Date().setHours(10, 30, 0, 0)),
    status: 'en_curso', reason: 'Extracción molar', avatar_initials: 'CR',
  },
  {
    id_cita: 'cit-003', id_paciente: 'pac-003', id_doctor: 'usr-001',
    patient_name: 'María Torres Vega', doctor_name: 'Dr. Ricardo Mendoza',
    scheduled_at: new Date(new Date().setHours(12, 0, 0, 0)),
    status: 'pendiente', reason: 'Limpieza dental', avatar_initials: 'MT',
  },
  {
    id_cita: 'cit-004', id_paciente: 'pac-004', id_doctor: 'usr-003',
    patient_name: 'José Martínez Díaz', doctor_name: 'Dra. Patricia Olvera',
    scheduled_at: new Date(new Date().setHours(11, 0, 0, 0)),
    status: 'pendiente', reason: 'Consulta general', avatar_initials: 'JM',
  },
  {
    id_cita: 'cit-005', id_paciente: 'pac-005', id_doctor: 'usr-003',
    patient_name: 'Sofía Reyes Castillo', doctor_name: 'Dra. Patricia Olvera',
    scheduled_at: new Date(new Date().setHours(13, 30, 0, 0)),
    status: 'pendiente', reason: 'Revisión de empaste', avatar_initials: 'SR',
  },
];

const MOCK_DOCTORS: DoctorOption[] = [
  { id_usuario: 'usr-001', full_name: 'Dr. Ricardo Mendoza', specialty: 'Ortodoncia' },
  { id_usuario: 'usr-003', full_name: 'Dra. Patricia Olvera', specialty: 'Endodoncia' },
  { id_usuario: 'usr-004', full_name: 'Dr. Andrés Cisneros',  specialty: 'Cirugía Oral' },
];

@Component({
  selector: 'app-consultorio',
  imports: [CommonModule, RouterModule, PatientFormModal, AppointmentFormModal, ConsultationFormModal],
  templateUrl: './consultorio.html',
  styleUrl: './consultorio.css',
})
export class Consultorio {
  // ── Estado de sesión simulado ─────────────────────────────────────────────
  // TODO: Reemplazar con AuthService que lee el JWT desde memoria
  currentUser = signal<StaffUser>(MOCK_DOCTOR);

  // Signal mutable de citas — permite actualizar status sin recargar
  // TODO: inicializar desde GET /api/citas?date=today&doctor_id=...
  private appointments = signal<Appointment[]>([...MOCK_APPOINTMENTS]);

  // ── Computed ──────────────────────────────────────────────────────────────
  isDoctor = computed(() => this.currentUser().role === 'doctor');
  isAdmin  = computed(() => this.currentUser().role === 'admin');

  greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  todayAppointments = computed(() =>
    this.isDoctor()
      ? this.appointments().filter((a: Appointment) => a.id_doctor === this.currentUser().id_usuario)
      : this.appointments()
  );

  currentAppointment = computed(() =>
    this.todayAppointments().find((a: Appointment) => a.status === 'en_curso') ?? null
  );

  nextAppointment = computed(() =>
    this.todayAppointments().find((a: Appointment) => a.status === 'pendiente') ?? null
  );

  completedCount = computed(() =>
    this.todayAppointments().filter((a: Appointment) => a.status === 'completada').length
  );

  pendingCount = computed(() =>
    this.todayAppointments().filter((a: Appointment) => a.status === 'pendiente').length
  );

  todayDate = new Date();
  doctors   = MOCK_DOCTORS;

  // ── Estado de modales ─────────────────────────────────────────────────────
  sidebarOpen = false;

  showPatientModal    = false;
  patientModalMode: PatientFormMode = 'create';
  editingPatient: PatientDetail | null = null;

  showAppointmentModal    = false;
  appointmentModalMode: AppointmentFormMode = 'create';
  editingAppointment: AppointmentFormData | null = null;

  showConsultationModal   = false;
  consultationModalMode: ConsultationFormMode = 'create';
  editingConsultation: ConsultationRecord | null = null;

  // ── Apertura de modales ───────────────────────────────────────────────────
  openNewPatient(): void {
    this.editingPatient  = null;
    this.patientModalMode = 'create';
    this.showPatientModal = true;
  }

  openEditPatient(patient: PatientDetail): void {
    this.editingPatient  = patient;
    this.patientModalMode = 'edit';
    this.showPatientModal = true;
  }

  openNewAppointment(): void {
    this.editingAppointment  = null;
    this.appointmentModalMode = 'create';
    this.showAppointmentModal = true;
  }

  openEditAppointment(appointment: AppointmentFormData): void {
    this.editingAppointment  = appointment;
    this.appointmentModalMode = 'edit';
    this.showAppointmentModal = true;
  }

  openConsultationForCurrentAppointment(): void {
    this.editingConsultation   = null;
    this.consultationModalMode = 'create';
    this.showConsultationModal = true;
  }

  // ── Handlers de guardado (simulados) ─────────────────────────────────────
  onPatientSaved(data: PatientDetail): void {
    // TODO: POST /api/pacientes  o  PATCH /api/pacientes?id_paciente=eq.{id}
    console.log('[mock] Paciente guardado:', data);
    this.showPatientModal = false;
  }

  onAppointmentSaved(data: AppointmentFormData): void {
    // TODO: POST /functions/v1/create-appointment  o  PATCH /api/citas?id_cita=eq.{id}
    console.log('[mock] Cita guardada:', data);
    this.showAppointmentModal = false;
  }

  onConsultationSaved(data: ConsultationRecord): void {
    // TODO: POST /api/historiales  body: { ...data }
    // Al registrar una consulta, la cita se finaliza automáticamente
    const current = this.currentAppointment();
    if (current) this.finalizeAppointment(current.id_cita);
    console.log('[mock] Consulta guardada:', data);
    this.showConsultationModal = false;
  }

  finalizeAppointment(id_cita: string): void {
    this.appointments.update(list =>
      list.map((a: Appointment) =>
        a.id_cita === id_cita ? { ...a, status: 'completada' as AppointmentStatus } : a
      )
    );
    // TODO: PATCH /api/citas?id_cita=eq.{id_cita}  body: { status: 'completada' }
  }

  // ── Helpers de presentación ───────────────────────────────────────────────
  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  getStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      pendiente: 'Pendiente', en_curso: 'En curso',
      completada: 'Completada', cancelada: 'Cancelada',
    };
    return labels[status];
  }

  // ── Dev helper ────────────────────────────────────────────────────────────
  toggleRole(): void {
    this.currentUser.set(this.isDoctor() ? MOCK_SECRETARY : MOCK_DOCTOR);
  }
}
