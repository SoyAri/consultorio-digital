import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  StaffUser, ClinicStatus, PatientDetail, PatientFormMode, DoctorOption, EMPTY_PATIENT,
} from '../../models';
import { PatientFormModal } from '../../../components/patient-form-modal/patient-form-modal';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/database.service';
import { ToastService } from '../../services/toast.service';

export interface PatientListItem {
  id_paciente: string;
  full_name: string;
  birth_date: string;
  phone: string;
  email: string;
  assigned_doctor_id: string;
  assigned_doctor_name: string;
  clinic_status: ClinicStatus;
  avatar_initials: string;
  last_visit?: string;
}

const STATUS_LABELS: Record<ClinicStatus, string> = {
  en_tratamiento: 'En tratamiento',
  dado_de_alta:   'Alta médica',
  inactivo:       'Inactivo',
};

@Component({
  selector: 'app-directorio',
  imports: [CommonModule, RouterModule, FormsModule, Sidebar, PatientFormModal],
  templateUrl: './directorio.html',
  styleUrl: './directorio.css',
})
export class Directorio implements OnInit {
  private auth  = inject(AuthService);
  private db    = inject(DatabaseService);
  private toast = inject(ToastService);

  private readonly emptyUser: StaffUser = { id_usuario: '', full_name: '', role: 'admin', email: '' };
  currentUser = computed(() => this.auth.staffProfile() ?? this.emptyUser);
  isDoctor    = computed(() => this.currentUser().role === 'doctor');
  isAdmin     = computed(() => this.currentUser().role === 'admin');

  sidebarOpen = false;

  private _searchQuery = '';
  get searchQuery() { return this._searchQuery; }
  set searchQuery(v: string) { this._searchQuery = v; this.page = 1; }

  private _statusFilter: ClinicStatus | '' = '';
  get statusFilter() { return this._statusFilter; }
  set statusFilter(v: ClinicStatus | '') { this._statusFilter = v; this.page = 1; }

  readonly PAGE_SIZE = 25;
  page = 1;

  showPatientModal    = false;
  patientModalMode: PatientFormMode = 'create';
  editingPatient: PatientDetail | null = null;

  private patients = signal<PatientListItem[]>([]);
  doctors: DoctorOption[] = [];
  loading = signal(true);
  error   = signal('');

  readonly statusOptions: { value: ClinicStatus | ''; label: string }[] = [
    { value: '',               label: 'Todos' },
    { value: 'en_tratamiento', label: 'En tratamiento' },
    { value: 'dado_de_alta',   label: 'Alta médica' },
    { value: 'inactivo',       label: 'Inactivo' },
  ];

  get totalPatientPages(): number {
    return Math.max(1, Math.ceil(this.filteredPatients.length / this.PAGE_SIZE));
  }

  get pagedPatients(): PatientListItem[] {
    const start = (this.page - 1) * this.PAGE_SIZE;
    return this.filteredPatients.slice(start, start + this.PAGE_SIZE);
  }

  prevPatientPage(): void { if (this.page > 1) this.page--; }
  nextPatientPage(): void { if (this.page < this.totalPatientPages) this.page++; }

  get filteredPatients(): PatientListItem[] {
    const user = this.currentUser();
    let list = user.role === 'doctor'
      ? this.patients().filter(p => p.assigned_doctor_id === user.id_usuario)
      : this.patients();

    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        p.full_name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    }

    if (this.statusFilter) {
      list = list.filter(p => p.clinic_status === this.statusFilter);
    }

    return list;
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadPatients(), this.loadDoctors()]);
    this.loading.set(false);
  }

  private async loadPatients(): Promise<void> {
    const rows = await this.db.getPacientes();
    this.patients.set(rows.map(r => this.mapPatient(r)));
  }

  private async loadDoctors(): Promise<void> {
    this.doctors = await this.db.getDoctors();
  }

  private mapPatient(r: any): PatientListItem {
    const doctorName = this.doctors.find(d => d.id_usuario === r.assigned_doctor_id)?.full_name ?? '';
    return {
      id_paciente:          r.id_paciente,
      full_name:            r.full_name,
      birth_date:           r.birth_date ?? '',
      phone:                r.phone ?? '',
      email:                r.email ?? '',
      assigned_doctor_id:   r.assigned_doctor_id ?? '',
      assigned_doctor_name: doctorName,
      clinic_status:        r.clinic_status ?? 'inactivo',
      avatar_initials:      r.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase(),
    };
  }

  openNewPatient(): void {
    const user = this.currentUser();
    this.editingPatient = user.role === 'doctor'
      ? { ...EMPTY_PATIENT, assigned_doctor_id: user.id_usuario }
      : null;
    this.patientModalMode = 'create';
    this.showPatientModal = true;
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
      await this.loadPatients();
    } catch (err: any) {
      this.toast.error(err.message ?? 'Error al guardar paciente.');
    }
    this.showPatientModal = false;
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
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  getStatusLabel(status: ClinicStatus): string { return STATUS_LABELS[status]; }
}
