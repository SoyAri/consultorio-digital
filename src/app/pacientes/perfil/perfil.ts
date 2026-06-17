import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  StaffUser, ClinicStatus, PatientDetail, PatientFormMode, DoctorOption,
  ConsultationRecord, ConsultationFormMode, PrescriptionItem,
} from '../../models';
import { PatientFormModal } from '../../../components/patient-form-modal/patient-form-modal';
import { ConsultationFormModal } from '../../../components/consultation-form-modal/consultation-form-modal';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/database.service';
import { ToastService } from '../../services/toast.service';

const STATUS_LABELS: Record<ClinicStatus, string> = {
  en_tratamiento: 'En tratamiento',
  dado_de_alta:   'Alta médica',
  inactivo:       'Inactivo',
};

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, RouterModule, FormsModule, Sidebar, PatientFormModal, ConsultationFormModal],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private route = inject(ActivatedRoute);
  private auth  = inject(AuthService);
  private db    = inject(DatabaseService);
  private toast = inject(ToastService);

  private readonly emptyUser: StaffUser = { id_usuario: '', full_name: '', role: 'admin', email: '' };
  currentUser = computed(() => this.auth.staffProfile() ?? this.emptyUser);
  isDoctor    = computed(() => this.currentUser().role === 'doctor');
  isAdmin     = computed(() => this.currentUser().role === 'admin');

  patient       = signal<PatientDetail | null>(null);
  consultations = signal<ConsultationRecord[]>([]);
  doctors: DoctorOption[] = [];
  loading       = signal(true);
  error         = signal('');

  sidebarOpen = false;

  showPatientModal        = false;
  patientModalMode: PatientFormMode = 'edit';

  readonly PAGE_SIZE = 25;
  consultPage = 1;

  consultTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.consultations().length / this.PAGE_SIZE))
  );

  pagedConsultations = computed(() => {
    const start = (this.consultPage - 1) * this.PAGE_SIZE;
    return this.consultations().slice(start, start + this.PAGE_SIZE);
  });

  prevConsultPage(): void { if (this.consultPage > 1) this.consultPage--; }
  nextConsultPage(): void { if (this.consultPage < this.consultTotalPages()) this.consultPage++; }

  showConsultationModal   = false;
  consultationModalMode: ConsultationFormMode = 'create';
  editingConsultation: ConsultationRecord | null = null;

  readonly statusOptions: { value: ClinicStatus; label: string }[] = [
    { value: 'en_tratamiento', label: 'En tratamiento' },
    { value: 'dado_de_alta',   label: 'Alta médica' },
    { value: 'inactivo',       label: 'Inactivo' },
  ];

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) { this.loading.set(false); return; }

    const [patient, consultations, doctors] = await Promise.all([
      this.db.getPacienteById(id),
      this.db.getConsultasDePaciente(id),
      this.db.getDoctors(),
    ]);

    this.patient.set(patient);
    this.consultations.set(this.sortConsultations(consultations));
    this.doctors = doctors;
    this.loading.set(false);
  }

  openEditPatient(): void {
    this.patientModalMode = 'edit';
    this.showPatientModal  = true;
  }

  openNewConsultation(): void {
    this.editingConsultation   = null;
    this.consultationModalMode = 'create';
    this.showConsultationModal = true;
  }

  openEditConsultation(c: ConsultationRecord): void {
    this.editingConsultation   = c;
    this.consultationModalMode = 'edit';
    this.showConsultationModal = true;
  }

  async onPatientSaved(data: PatientDetail): Promise<void> {
    try {
      const id = data.id_paciente ?? this.patient()?.id_paciente;
      if (id) {
        await this.db.updatePaciente(id, data);
        this.patient.set({ ...data, id_paciente: id });
        this.toast.success('Datos del paciente actualizados');
      }
    } catch (err: any) {
      this.toast.error(err.message ?? 'Error al guardar paciente.');
    }
    this.showPatientModal = false;
  }

  async onConsultationSaved(data: ConsultationRecord): Promise<void> {
    try {
      if (this.consultationModalMode === 'edit' && data.id_historial) {
        await this.db.updateConsulta(data.id_historial, data);
        this.consultations.update(list =>
          this.sortConsultations(list.map((c: ConsultationRecord) => c.id_historial === data.id_historial ? data : c))
        );
        this.toast.success('Consulta actualizada');
      } else {
        const created = await this.db.addConsulta(data);
        if (created) this.consultations.update(list => [created, ...list]);
        this.toast.success('Consulta registrada correctamente');
      }
    } catch (err: any) {
      this.toast.error(err.message ?? 'Error al guardar consulta.');
    }
    this.showConsultationModal = false;
  }

  async changeStatus(status: ClinicStatus): Promise<void> {
    const p = this.patient();
    if (!p?.id_paciente) return;
    try {
      await this.db.updatePaciente(p.id_paciente, { clinic_status: status });
      this.patient.set({ ...p, clinic_status: status });
      this.toast.success('Estado del paciente actualizado');
    } catch (err: any) {
      this.toast.error(err.message ?? 'Error al cambiar estado.');
    }
  }

  getAge(birthDate: string): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate + 'T12:00:00');
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  formatDateShort(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  private sortConsultations(list: ConsultationRecord[]): ConsultationRecord[] {
    return [...list].sort((a, b) => {
      const dateDiff = new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date((b as any).created_at ?? 0).getTime() - new Date((a as any).created_at ?? 0).getTime();
    });
  }

  getStatusLabel(status: ClinicStatus): string { return STATUS_LABELS[status]; }

  getPrescriptionSummary(prescriptions: PrescriptionItem[]): string {
    if (!prescriptions?.length) return 'Sin receta';
    return prescriptions.map(p => p.medicine).join(', ');
  }
}
