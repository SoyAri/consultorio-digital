import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  StaffUser, UserRole, AppointmentStatus,
  AppointmentFormData, AppointmentFormMode, DoctorOption,
} from '../models';
import { AppointmentFormModal } from '../../components/appointment-form-modal/appointment-form-modal';

export interface AgendaAppointment {
  id_cita: string;
  id_paciente: string;
  id_doctor: string;
  patient_name: string;
  doctor_name: string;
  scheduled_at: Date;
  status: AppointmentStatus;
  reason: string;
  avatar_initials: string;
  duration_min: number;
}

interface CalendarDay {
  date: Date;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: AgendaAppointment[];
}

// ── Constantes de presentación ────────────────────────────────────────────────
const WEEK_DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pendiente: 'Pendiente', en_curso: 'En curso',
  completada: 'Completada', cancelada: 'Cancelada',
};

// ── Usuarios mock ─────────────────────────────────────────────────────────────
const MOCK_DOCTOR: StaffUser = {
  id_usuario: 'usr-001', full_name: 'Ricardo Mendoza',
  role: 'doctor', specialty: 'Ortodoncia', email: 'r.mendoza@consultorio.mx',
};
const MOCK_SECRETARY: StaffUser = {
  id_usuario: 'usr-002', full_name: 'Laura Sánchez',
  role: 'admin', email: 'l.sanchez@consultorio.mx',
};
const MOCK_DOCTORS: DoctorOption[] = [
  { id_usuario: 'usr-001', full_name: 'Dr. Ricardo Mendoza',  specialty: 'Ortodoncia' },
  { id_usuario: 'usr-003', full_name: 'Dra. Patricia Olvera', specialty: 'Endodoncia' },
  { id_usuario: 'usr-004', full_name: 'Dr. Andrés Cisneros',  specialty: 'Cirugía Oral' },
];

// ── Helper ────────────────────────────────────────────────────────────────────
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth()    === b.getMonth()
      && a.getDate()     === b.getDate();
}

function d(day: number, hour: number, min = 0): Date {
  return new Date(2026, 5, day, hour, min);
}

// ── Historial de citas (mock) ─────────────────────────────────────────────────
// TODO: reemplazar con GET /api/citas?range=mes&doctor_id=...
const ALL_APPOINTMENTS: AgendaAppointment[] = [
  // ── Junio 2 ──
  { id_cita: 'ag-001', id_paciente: 'pac-003', id_doctor: 'usr-001', patient_name: 'María Torres Vega',       doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(2, 9),     status: 'completada', reason: 'Limpieza dental',         avatar_initials: 'MT', duration_min: 45 },
  { id_cita: 'ag-002', id_paciente: 'pac-005', id_doctor: 'usr-003', patient_name: 'Sofía Reyes Castillo',    doctor_name: 'Dra. Patricia Olvera',  scheduled_at: d(2, 11),    status: 'completada', reason: 'Primera consulta',        avatar_initials: 'SR', duration_min: 30 },
  // ── Junio 3 ──
  { id_cita: 'ag-003', id_paciente: 'pac-001', id_doctor: 'usr-001', patient_name: 'Ana García López',        doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(3, 9),     status: 'completada', reason: 'Colocación brackets',     avatar_initials: 'AG', duration_min: 90 },
  { id_cita: 'ag-004', id_paciente: 'pac-002', id_doctor: 'usr-001', patient_name: 'Carlos Ruiz Herrera',    doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(3, 11, 30),status: 'completada', reason: 'Evaluación inicial',      avatar_initials: 'CR', duration_min: 30 },
  { id_cita: 'ag-005', id_paciente: 'pac-004', id_doctor: 'usr-003', patient_name: 'José Martínez Díaz',     doctor_name: 'Dra. Patricia Olvera',  scheduled_at: d(3, 15),    status: 'completada', reason: 'Consulta endodoncia',     avatar_initials: 'JM', duration_min: 60 },
  // ── Junio 5 ──
  { id_cita: 'ag-006', id_paciente: 'pac-006', id_doctor: 'usr-001', patient_name: 'Roberto Hernández Luna', doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(5, 10),    status: 'completada', reason: 'Profilaxis semestral',    avatar_initials: 'RH', duration_min: 45 },
  { id_cita: 'ag-007', id_paciente: 'pac-003', id_doctor: 'usr-001', patient_name: 'María Torres Vega',       doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(5, 12),    status: 'completada', reason: 'Control post-limpieza',   avatar_initials: 'MT', duration_min: 20 },
  // ── Junio 8 ──
  { id_cita: 'ag-008', id_paciente: 'pac-001', id_doctor: 'usr-001', patient_name: 'Ana García López',        doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(8, 9),     status: 'completada', reason: '1er ajuste brackets',    avatar_initials: 'AG', duration_min: 30 },
  { id_cita: 'ag-009', id_paciente: 'pac-004', id_doctor: 'usr-003', patient_name: 'José Martínez Díaz',     doctor_name: 'Dra. Patricia Olvera',  scheduled_at: d(8, 11),    status: 'completada', reason: 'Revisión endodoncia',     avatar_initials: 'JM', duration_min: 60 },
  { id_cita: 'ag-010', id_paciente: 'pac-006', id_doctor: 'usr-001', patient_name: 'Roberto Hernández Luna', doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(8, 14),    status: 'completada', reason: 'Control glucémico-dental', avatar_initials: 'RH', duration_min: 45 },
  // ── Junio 10 ──
  { id_cita: 'ag-011', id_paciente: 'pac-001', id_doctor: 'usr-001', patient_name: 'Ana García López',        doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(10, 9),    status: 'completada', reason: '2do ajuste brackets',    avatar_initials: 'AG', duration_min: 30 },
  { id_cita: 'ag-012', id_paciente: 'pac-002', id_doctor: 'usr-001', patient_name: 'Carlos Ruiz Herrera',    doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(10, 10, 30),status:'completada', reason: 'Revisión post-extracción',avatar_initials: 'CR', duration_min: 20 },
  // ── Junio 11 ──
  { id_cita: 'ag-013', id_paciente: 'pac-005', id_doctor: 'usr-003', patient_name: 'Sofía Reyes Castillo',    doctor_name: 'Dra. Patricia Olvera',  scheduled_at: d(11, 10),   status: 'completada', reason: 'Revisión inicial',        avatar_initials: 'SR', duration_min: 30 },
  // ── Junio 12 ──
  { id_cita: 'ag-014', id_paciente: 'pac-006', id_doctor: 'usr-001', patient_name: 'Roberto Hernández Luna', doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(12, 9),    status: 'completada', reason: 'Seguimiento semestral',   avatar_initials: 'RH', duration_min: 30 },
  { id_cita: 'ag-015', id_paciente: 'pac-003', id_doctor: 'usr-001', patient_name: 'María Torres Vega',       doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(12, 11),   status: 'completada', reason: 'Alta médica programada',  avatar_initials: 'MT', duration_min: 20 },
  // ── Junio 14 (HOY) ──
  { id_cita: 'cit-001', id_paciente: 'pac-001', id_doctor: 'usr-001', patient_name: 'Ana García López',       doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: new Date(new Date().setHours(9, 0, 0, 0)),    status: 'completada', reason: 'Revisión de brackets',     avatar_initials: 'AG', duration_min: 30 },
  { id_cita: 'cit-002', id_paciente: 'pac-002', id_doctor: 'usr-001', patient_name: 'Carlos Ruiz Herrera',   doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: new Date(new Date().setHours(10, 30, 0, 0)),  status: 'en_curso',   reason: 'Extracción molar',         avatar_initials: 'CR', duration_min: 60 },
  { id_cita: 'cit-003', id_paciente: 'pac-003', id_doctor: 'usr-001', patient_name: 'María Torres Vega',      doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: new Date(new Date().setHours(12, 0, 0, 0)),   status: 'pendiente',  reason: 'Limpieza dental',          avatar_initials: 'MT', duration_min: 45 },
  { id_cita: 'cit-004', id_paciente: 'pac-004', id_doctor: 'usr-003', patient_name: 'José Martínez Díaz',    doctor_name: 'Dra. Patricia Olvera',  scheduled_at: new Date(new Date().setHours(11, 0, 0, 0)),   status: 'pendiente',  reason: 'Consulta general',         avatar_initials: 'JM', duration_min: 30 },
  { id_cita: 'cit-005', id_paciente: 'pac-005', id_doctor: 'usr-003', patient_name: 'Sofía Reyes Castillo',  doctor_name: 'Dra. Patricia Olvera',  scheduled_at: new Date(new Date().setHours(13, 30, 0, 0)),  status: 'pendiente',  reason: 'Revisión de empaste',      avatar_initials: 'SR', duration_min: 30 },
  // ── Junio 15 ──
  { id_cita: 'ag-016', id_paciente: 'pac-001', id_doctor: 'usr-001', patient_name: 'Ana García López',        doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(15, 9),    status: 'pendiente',  reason: '3er ajuste brackets',    avatar_initials: 'AG', duration_min: 30 },
  { id_cita: 'ag-017', id_paciente: 'pac-006', id_doctor: 'usr-001', patient_name: 'Roberto Hernández Luna', doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(15, 11),   status: 'pendiente',  reason: 'Control general',         avatar_initials: 'RH', duration_min: 30 },
  { id_cita: 'ag-018', id_paciente: 'pac-002', id_doctor: 'usr-001', patient_name: 'Carlos Ruiz Herrera',    doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(15, 13),   status: 'pendiente',  reason: 'Revisión final',          avatar_initials: 'CR', duration_min: 20 },
  // ── Junio 17 ──
  { id_cita: 'ag-019', id_paciente: 'pac-004', id_doctor: 'usr-003', patient_name: 'José Martínez Díaz',     doctor_name: 'Dra. Patricia Olvera',  scheduled_at: d(17, 10),   status: 'pendiente',  reason: 'Control endodoncia',      avatar_initials: 'JM', duration_min: 60 },
  { id_cita: 'ag-020', id_paciente: 'pac-003', id_doctor: 'usr-001', patient_name: 'María Torres Vega',       doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(17, 12),   status: 'pendiente',  reason: 'Control post-alta',       avatar_initials: 'MT', duration_min: 20 },
  // ── Junio 18 ──
  { id_cita: 'ag-021', id_paciente: 'pac-005', id_doctor: 'usr-003', patient_name: 'Sofía Reyes Castillo',    doctor_name: 'Dra. Patricia Olvera',  scheduled_at: d(18, 9),    status: 'pendiente',  reason: '2da consulta',            avatar_initials: 'SR', duration_min: 30 },
  { id_cita: 'ag-022', id_paciente: 'pac-001', id_doctor: 'usr-001', patient_name: 'Ana García López',        doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(18, 10, 30),status:'pendiente',  reason: '4to ajuste brackets',    avatar_initials: 'AG', duration_min: 30 },
  { id_cita: 'ag-023', id_paciente: 'pac-006', id_doctor: 'usr-001', patient_name: 'Roberto Hernández Luna', doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(18, 14),   status: 'pendiente',  reason: 'Revisión general',        avatar_initials: 'RH', duration_min: 30 },
  // ── Junio 22 ──
  { id_cita: 'ag-024', id_paciente: 'pac-001', id_doctor: 'usr-001', patient_name: 'Ana García López',        doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(22, 9),    status: 'pendiente',  reason: '5to ajuste brackets',    avatar_initials: 'AG', duration_min: 30 },
  { id_cita: 'ag-025', id_paciente: 'pac-004', id_doctor: 'usr-003', patient_name: 'José Martínez Díaz',     doctor_name: 'Dra. Patricia Olvera',  scheduled_at: d(22, 11, 30),status:'pendiente',  reason: 'Alta endodoncia',         avatar_initials: 'JM', duration_min: 30 },
  // ── Junio 24 ──
  { id_cita: 'ag-026', id_paciente: 'pac-002', id_doctor: 'usr-001', patient_name: 'Carlos Ruiz Herrera',    doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(24, 10),   status: 'pendiente',  reason: 'Evaluación posterior',    avatar_initials: 'CR', duration_min: 20 },
  { id_cita: 'ag-027', id_paciente: 'pac-006', id_doctor: 'usr-001', patient_name: 'Roberto Hernández Luna', doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(24, 12),   status: 'pendiente',  reason: 'Control semestral #2',    avatar_initials: 'RH', duration_min: 45 },
  // ── Junio 25 ──
  { id_cita: 'ag-028', id_paciente: 'pac-005', id_doctor: 'usr-003', patient_name: 'Sofía Reyes Castillo',    doctor_name: 'Dra. Patricia Olvera',  scheduled_at: d(25, 9),    status: 'pendiente',  reason: 'Control tratamiento',     avatar_initials: 'SR', duration_min: 30 },
  { id_cita: 'ag-029', id_paciente: 'pac-003', id_doctor: 'usr-001', patient_name: 'María Torres Vega',       doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(25, 10, 30),status:'pendiente',  reason: 'Revisión semestral',      avatar_initials: 'MT', duration_min: 30 },
  { id_cita: 'ag-030', id_paciente: 'pac-001', id_doctor: 'usr-001', patient_name: 'Ana García López',        doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(25, 14),   status: 'pendiente',  reason: '6to ajuste brackets',    avatar_initials: 'AG', duration_min: 30 },
  // ── Junio 29 ──
  { id_cita: 'ag-031', id_paciente: 'pac-004', id_doctor: 'usr-003', patient_name: 'José Martínez Díaz',     doctor_name: 'Dra. Patricia Olvera',  scheduled_at: d(29, 11),   status: 'pendiente',  reason: 'Alta definitiva',         avatar_initials: 'JM', duration_min: 30 },
  { id_cita: 'ag-032', id_paciente: 'pac-006', id_doctor: 'usr-001', patient_name: 'Roberto Hernández Luna', doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(29, 13),   status: 'pendiente',  reason: 'Seguimiento anual',       avatar_initials: 'RH', duration_min: 30 },
  // ── Junio 30 ──
  { id_cita: 'ag-033', id_paciente: 'pac-001', id_doctor: 'usr-001', patient_name: 'Ana García López',        doctor_name: 'Dr. Ricardo Mendoza',   scheduled_at: d(30, 9),    status: 'pendiente',  reason: 'Evaluación trimestral',   avatar_initials: 'AG', duration_min: 45 },
];

@Component({
  selector: 'app-agendar',
  imports: [CommonModule, RouterModule, AppointmentFormModal],
  templateUrl: './agendar.html',
  styleUrl: './agendar.css',
})
export class Agendar {
  // ── Estado de sesión simulado ─────────────────────────────────────────────
  // TODO: reemplazar con AuthService desde JWT
  currentUser = signal<StaffUser>(MOCK_DOCTOR);
  isDoctor = computed(() => this.currentUser().role === 'doctor');
  isAdmin  = computed(() => this.currentUser().role === 'admin');

  sidebarOpen = false;
  readonly weekDays = WEEK_DAYS;
  doctors = MOCK_DOCTORS;

  // ── Navegación de mes ─────────────────────────────────────────────────────
  currentYM = signal({ year: new Date().getFullYear(), month: new Date().getMonth() });
  selectedDate = signal<Date>(new Date());

  monthName = computed(() => MONTHS[this.currentYM().month]);

  // ── Citas filtradas por rol ───────────────────────────────────────────────
  allAppointments = computed(() =>
    this.isDoctor()
      ? ALL_APPOINTMENTS.filter((a: AgendaAppointment) => a.id_doctor === this.currentUser().id_usuario)
      : ALL_APPOINTMENTS
  );

  // ── Grilla del calendario ─────────────────────────────────────────────────
  calendarDays = computed((): CalendarDay[] => {
    const { year, month } = this.currentYM();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay   = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7; // lunes primero

    const days: CalendarDay[] = [];

    // Relleno mes anterior
    for (let i = startOffset; i > 0; i--) {
      const date = new Date(year, month, 1 - i);
      days.push({ date, dayNum: date.getDate(), isCurrentMonth: false, isToday: false, appointments: [] });
    }

    // Días del mes actual
    for (let n = 1; n <= daysInMonth; n++) {
      const date  = new Date(year, month, n);
      const isToday = isSameDay(date, today);
      const appointments = this.allAppointments().filter((a: AgendaAppointment) => isSameDay(a.scheduled_at, date));
      days.push({ date, dayNum: n, isCurrentMonth: true, isToday, appointments });
    }

    // Relleno mes siguiente (6 semanas = 42 celdas)
    const remaining = 42 - days.length;
    for (let n = 1; n <= remaining; n++) {
      const date = new Date(year, month + 1, n);
      days.push({ date, dayNum: n, isCurrentMonth: false, isToday: false, appointments: [] });
    }

    return days;
  });

  // ── Panel del día seleccionado ────────────────────────────────────────────
  selectedDayAppts = computed(() =>
    this.allAppointments()
      .filter((a: AgendaAppointment) => isSameDay(a.scheduled_at, this.selectedDate()))
      .sort((a: AgendaAppointment, b: AgendaAppointment) => a.scheduled_at.getTime() - b.scheduled_at.getTime())
  );

  selectedDayLabel = computed(() => {
    const sel = this.selectedDate();
    const today = new Date();
    if (isSameDay(sel, today)) {
      const tom = new Date(today); tom.setDate(tom.getDate() + 1);
      return 'Hoy · ' + this.formatDateMedium(sel);
    }
    const tom = new Date(); tom.setDate(tom.getDate() + 1);
    if (isSameDay(sel, tom)) return 'Mañana · ' + this.formatDateMedium(sel);
    return this.formatDateMedium(sel);
  });

  // ── Estadísticas del mes ──────────────────────────────────────────────────
  monthStats = computed(() => {
    const { year, month } = this.currentYM();
    const inMonth = this.allAppointments().filter((a: AgendaAppointment) =>
      a.scheduled_at.getFullYear() === year && a.scheduled_at.getMonth() === month
    );
    return {
      total:     inMonth.length,
      completed: inMonth.filter((a: AgendaAppointment) => a.status === 'completada').length,
      pending:   inMonth.filter((a: AgendaAppointment) => a.status === 'pendiente').length,
      active:    inMonth.filter((a: AgendaAppointment) => a.status === 'en_curso').length,
    };
  });

  // ── Navegación ────────────────────────────────────────────────────────────
  prevMonth(): void {
    const { year, month } = this.currentYM();
    this.currentYM.set(month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
  }

  nextMonth(): void {
    const { year, month } = this.currentYM();
    this.currentYM.set(month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });
  }

  goToToday(): void {
    const now = new Date();
    this.currentYM.set({ year: now.getFullYear(), month: now.getMonth() });
    this.selectedDate.set(now);
  }

  selectDay(day: CalendarDay): void {
    this.selectedDate.set(day.date);
    // Si el día es de otro mes, navegar a ese mes
    const { year, month } = this.currentYM();
    if (day.date.getMonth() !== month || day.date.getFullYear() !== year) {
      this.currentYM.set({ year: day.date.getFullYear(), month: day.date.getMonth() });
    }
  }

  isSelectedDay(date: Date): boolean {
    return isSameDay(date, this.selectedDate());
  }

  // ── Modal de cita ─────────────────────────────────────────────────────────
  showAppointmentModal    = false;
  appointmentModalMode: AppointmentFormMode = 'create';
  editingAppointment: AppointmentFormData | null = null;

  openNewAppointment(): void {
    this.editingAppointment  = null;
    this.appointmentModalMode = 'create';
    this.showAppointmentModal = true;
  }

  openEditAppointment(appt: AgendaAppointment): void {
    const y = appt.scheduled_at.getFullYear();
    const m = String(appt.scheduled_at.getMonth() + 1).padStart(2, '0');
    const day = String(appt.scheduled_at.getDate()).padStart(2, '0');
    const h   = String(appt.scheduled_at.getHours()).padStart(2, '0');
    const min = String(appt.scheduled_at.getMinutes()).padStart(2, '0');

    this.editingAppointment = {
      id_cita: appt.id_cita,
      id_paciente: appt.id_paciente,
      patient_name: appt.patient_name,
      id_doctor: appt.id_doctor,
      scheduled_date: `${y}-${m}-${day}`,
      scheduled_time: `${h}:${min}`,
      duration_minutes: appt.duration_min,
      reason: appt.reason,
      notes: '',
      status: appt.status,
    };
    this.appointmentModalMode = 'edit';
    this.showAppointmentModal = true;
  }

  onAppointmentSaved(data: AppointmentFormData): void {
    // TODO: POST /functions/v1/create-appointment o PATCH /api/citas?id_cita=eq.{id}
    console.log('[mock] Cita guardada:', data);
    this.showAppointmentModal = false;
  }

  // ── Helpers de presentación ───────────────────────────────────────────────
  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  formatDateMedium(date: Date): string {
    return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  getStatusLabel(status: AppointmentStatus): string { return STATUS_LABELS[status]; }

  toggleRole(): void {
    this.currentUser.set(this.isDoctor() ? MOCK_SECRETARY : MOCK_DOCTOR);
  }
}
