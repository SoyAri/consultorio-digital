import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  AppointmentStatus, ClinicStatus,
  PatientDetail, PatientFormMode,
  AppointmentFormData, AppointmentFormMode,
  ConsultationRecord, ConsultationFormMode,
  DoctorOption,
} from './models';
import { EMPTY_PATIENT } from '../models';
import { PatientFormModal } from '../../components/patient-form-modal/patient-form-modal';
import { AppointmentFormModal } from '../../components/appointment-form-modal/appointment-form-modal';
import { ConsultationFormModal } from '../../components/consultation-form-modal/consultation-form-modal';
import { Sidebar } from '../../components/sidebar/sidebar';
import { AuthService } from '../services/auth.service';
import { DatabaseService } from '../services/database.service';
import { ToastService } from '../services/toast.service';

export interface StaffUser {
  id_usuario: string;
  full_name: string;
  role: 'doctor' | 'admin';
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

export type { AppointmentStatus, ClinicStatus };

@Component({
  selector: 'app-consultorio',
  imports: [CommonModule, RouterModule, Sidebar, PatientFormModal, AppointmentFormModal, ConsultationFormModal],
  templateUrl: './consultorio.html',
  styleUrl: './consultorio.css',
})
export class Consultorio implements OnInit, OnDestroy {
  private auth  = inject(AuthService);
  private db    = inject(DatabaseService);
  private toast = inject(ToastService);

  private readonly emptyUser: StaffUser = { id_usuario: '', full_name: '', role: 'admin', email: '' };
  currentUser = computed(() => this.auth.staffProfile() ?? this.emptyUser);
  isDoctor    = computed(() => this.currentUser().role === 'doctor');
  isAdmin     = computed(() => this.currentUser().role === 'admin');

  greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  private appointments = signal<Appointment[]>([]);
  loading   = signal(true);
  error     = signal('');

  todayDate = new Date();
  doctors: DoctorOption[] = [];

  todayAppointments = computed(() => {
    const user = this.currentUser();
    return user.role === 'doctor'
      ? this.appointments().filter(a => a.id_doctor === user.id_usuario)
      : this.appointments();
  });

  currentAppointment = computed(() =>
    this.todayAppointments().find(a => a.status === 'en_curso') ?? null
  );

  nextAppointment = computed(() =>
    this.todayAppointments().find(a => a.status === 'pendiente') ?? null
  );

  completedCount = computed(() =>
    this.todayAppointments().filter(a => a.status === 'completada').length
  );

  pendingCount = computed(() =>
    this.todayAppointments().filter(a => a.status === 'pendiente').length
  );

  sidebarOpen = false;

  showPatientModal      = false;
  patientModalMode: PatientFormMode = 'create';
  editingPatient: PatientDetail | null = null;

  showAppointmentModal      = false;
  appointmentModalMode: AppointmentFormMode = 'create';
  editingAppointment: AppointmentFormData | null = null;

  showConsultationModal     = false;
  consultationModalMode: ConsultationFormMode = 'create';
  editingConsultation: ConsultationRecord | null = null;

  private autoTimer: ReturnType<typeof setInterval> | null = null;

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadAppointments(), this.loadDoctors()]);
    this.loading.set(false);
    this.autoTimer = setInterval(() => this.autoAdvanceStatus(), 15_000);
  }

  ngOnDestroy(): void {
    if (this.autoTimer) clearInterval(this.autoTimer);
  }

  private async autoAdvanceStatus(): Promise<void> {
    const now = new Date();
    const toAdvance = this.appointments()
      .filter(a => a.status === 'pendiente' && a.scheduled_at <= now);
    for (const appt of toAdvance) {
      try {
        await this.db.updateCita(appt.id_cita, { status: 'en_curso' });
        this.appointments.update(list =>
          list.map(a => a.id_cita === appt.id_cita ? { ...a, status: 'en_curso' as AppointmentStatus } : a)
        );
      } catch {}
    }
  }

  private async loadAppointments(): Promise<void> {
    const rows = await this.db.getCitasHoy();
    this.appointments.set(rows.map(r => this.mapCita(r)));
  }

  private async loadDoctors(): Promise<void> {
    this.doctors = await this.db.getDoctors();
  }

  private mapCita(r: any): Appointment {
    return {
      id_cita:         r.id_cita,
      id_paciente:     r.id_paciente,
      id_doctor:       r.id_doctor,
      patient_name:    r.patient_name,
      doctor_name:     r.doctor_name,
      scheduled_at:    new Date(r.scheduled_at),
      status:          r.status,
      reason:          r.reason,
      avatar_initials: r.patient_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase(),
    };
  }

  openNewPatient(): void {
    const user = this.currentUser();
    // Pre-asignar doctor si el que crea es doctor
    this.editingPatient = user.role === 'doctor'
      ? { ...EMPTY_PATIENT, assigned_doctor_id: user.id_usuario }
      : null;
    this.patientModalMode = 'create';
    this.showPatientModal = true;
  }

  openEditPatient(patient: PatientDetail): void {
    this.editingPatient   = patient;
    this.patientModalMode = 'edit';
    this.showPatientModal = true;
  }

  openNewAppointment(): void {
    this.editingAppointment    = null;
    this.appointmentModalMode  = 'create';
    this.showAppointmentModal  = true;
  }

  openEditAppointment(appointment: AppointmentFormData): void {
    this.editingAppointment    = appointment;
    this.appointmentModalMode  = 'edit';
    this.showAppointmentModal  = true;
  }

  openConsultationForCurrentAppointment(): void {
    this.editingConsultation   = null;
    this.consultationModalMode = 'create';
    this.showConsultationModal = true;
  }

  async onPatientSaved(data: PatientDetail): Promise<void> {
    try {
      if (data.id_paciente) {
        await this.db.updatePaciente(data.id_paciente, data);
        this.toast.success('Datos del paciente actualizados');
      } else {
        const user = this.currentUser();
        if (user.role === 'doctor' && !data.assigned_doctor_id) {
          data.assigned_doctor_id = user.id_usuario;
        }
        await this.db.addPaciente(data);
        this.toast.success('Paciente registrado correctamente');
      }
    } catch (err: any) {
      this.toast.error(err.message ?? 'Error al guardar paciente.');
    }
    this.showPatientModal = false;
  }

  async onAppointmentSaved(data: AppointmentFormData): Promise<void> {
    try {
      const scheduledAt = new Date(`${data.scheduled_date}T${data.scheduled_time}:00`);
      const payload = {
        id_paciente:  data.id_paciente || null,
        id_doctor:    data.id_doctor || null,
        patient_name: data.patient_name,
        doctor_name:  this.getDoctorName(data.id_doctor),
        scheduled_at: scheduledAt.toISOString(),
        reason:       data.reason,
        notes:        data.notes,
        status:       data.status,
      };

      if (data.id_cita) {
        await this.db.updateCita(data.id_cita, payload);
        this.appointments.update(list =>
          list.map(a => a.id_cita === data.id_cita
            ? { ...a, doctor_name: payload.doctor_name, scheduled_at: scheduledAt,
                reason: payload.reason, status: payload.status as AppointmentStatus }
            : a
          )
        );
        this.toast.success('Cita actualizada');
      } else {
        const created = await this.db.addCita(payload);
        if (created) this.appointments.update(list => [...list, this.mapCita(created)]);
        this.toast.success('Cita agendada correctamente');
      }
    } catch (err: any) {
      this.toast.error(err.message ?? 'Error al guardar cita.');
    }
    this.showAppointmentModal = false;
  }

  async onConsultationSaved(data: ConsultationRecord): Promise<void> {
    try {
      if (data.id_historial) {
        await this.db.updateConsulta(data.id_historial, data);
        this.toast.success('Consulta actualizada');
      } else {
        await this.db.addConsulta(data);
        this.toast.success('Consulta registrada correctamente');
      }
      const current = this.currentAppointment();
      if (current) await this.finalizeAppointment(current.id_cita);
    } catch (err: any) {
      this.toast.error(err.message ?? 'Error al guardar consulta.');
    }
    this.showConsultationModal = false;
  }

  async finalizeAppointment(id_cita: string): Promise<void> {
    try {
      await this.db.updateCita(id_cita, { status: 'completada' });
      this.appointments.update(list =>
        list.map(a => a.id_cita === id_cita ? { ...a, status: 'completada' as AppointmentStatus } : a)
      );
    } catch (err: any) {
      this.error.set(err.message ?? 'Error al finalizar cita.');
    }
  }

  private getDoctorName(doctorId: string): string {
    return this.doctors.find(d => d.id_usuario === doctorId)?.full_name ?? '';
  }

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
}
