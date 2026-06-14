import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  StaffUser, UserRole, ClinicStatus, PatientDetail, PatientFormMode, DoctorOption,
} from '../../models';
import { PatientFormModal } from '../../../components/patient-form-modal/patient-form-modal';

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

const MOCK_DOCTOR: StaffUser = {
  id_usuario: 'usr-001', full_name: 'Ricardo Mendoza',
  role: 'doctor', specialty: 'Ortodoncia', email: 'r.mendoza@consultorio.mx',
};

const MOCK_SECRETARY: StaffUser = {
  id_usuario: 'usr-002', full_name: 'Laura Sánchez',
  role: 'admin', email: 'l.sanchez@consultorio.mx',
};

const MOCK_PATIENTS: PatientListItem[] = [
  {
    id_paciente: 'pac-001', full_name: 'Ana García López', birth_date: '1990-03-15',
    phone: '2231234567', email: 'ana.garcia@gmail.com',
    assigned_doctor_id: 'usr-001', assigned_doctor_name: 'Dr. Ricardo Mendoza',
    clinic_status: 'en_tratamiento', avatar_initials: 'AG', last_visit: '2026-06-10',
  },
  {
    id_paciente: 'pac-002', full_name: 'Carlos Ruiz Herrera', birth_date: '1985-07-22',
    phone: '2239876543', email: 'carlos.ruiz@gmail.com',
    assigned_doctor_id: 'usr-001', assigned_doctor_name: 'Dr. Ricardo Mendoza',
    clinic_status: 'en_tratamiento', avatar_initials: 'CR', last_visit: '2026-06-14',
  },
  {
    id_paciente: 'pac-003', full_name: 'María Torres Vega', birth_date: '1995-11-30',
    phone: '2231112233', email: 'maria.torres@gmail.com',
    assigned_doctor_id: 'usr-001', assigned_doctor_name: 'Dr. Ricardo Mendoza',
    clinic_status: 'dado_de_alta', avatar_initials: 'MT', last_visit: '2026-05-20',
  },
  {
    id_paciente: 'pac-004', full_name: 'José Martínez Díaz', birth_date: '1978-04-08',
    phone: '2234445566', email: 'jose.martinez@gmail.com',
    assigned_doctor_id: 'usr-003', assigned_doctor_name: 'Dra. Patricia Olvera',
    clinic_status: 'en_tratamiento', avatar_initials: 'JM', last_visit: '2026-06-12',
  },
  {
    id_paciente: 'pac-005', full_name: 'Sofía Reyes Castillo', birth_date: '2001-09-14',
    phone: '2237778899', email: 'sofia.reyes@gmail.com',
    assigned_doctor_id: 'usr-003', assigned_doctor_name: 'Dra. Patricia Olvera',
    clinic_status: 'inactivo', avatar_initials: 'SR', last_visit: '2026-03-01',
  },
  {
    id_paciente: 'pac-006', full_name: 'Roberto Hernández Luna', birth_date: '1969-12-05',
    phone: '2230001122', email: 'roberto.hernandez@gmail.com',
    assigned_doctor_id: 'usr-001', assigned_doctor_name: 'Dr. Ricardo Mendoza',
    clinic_status: 'en_tratamiento', avatar_initials: 'RH', last_visit: '2026-06-08',
  },
];

const MOCK_DOCTORS: DoctorOption[] = [
  { id_usuario: 'usr-001', full_name: 'Dr. Ricardo Mendoza',    specialty: 'Ortodoncia' },
  { id_usuario: 'usr-003', full_name: 'Dra. Patricia Olvera',   specialty: 'Endodoncia' },
  { id_usuario: 'usr-004', full_name: 'Dr. Andrés Cisneros',    specialty: 'Cirugía Oral' },
];

const STATUS_LABELS: Record<ClinicStatus, string> = {
  en_tratamiento: 'En tratamiento',
  dado_de_alta:   'Alta médica',
  inactivo:       'Inactivo',
};

@Component({
  selector: 'app-directorio',
  imports: [CommonModule, RouterModule, FormsModule, PatientFormModal],
  templateUrl: './directorio.html',
  styleUrl: './directorio.css',
})
export class Directorio {
  currentUser = signal<StaffUser>(MOCK_DOCTOR);

  isDoctor = computed(() => this.currentUser().role === 'doctor');
  isAdmin  = computed(() => this.currentUser().role === 'admin');

  sidebarOpen   = false;
  searchQuery   = '';
  statusFilter: ClinicStatus | '' = '';

  showPatientModal    = false;
  patientModalMode: PatientFormMode = 'create';
  editingPatient: PatientDetail | null = null;

  doctors = MOCK_DOCTORS;

  readonly statusOptions: { value: ClinicStatus | ''; label: string }[] = [
    { value: '',               label: 'Todos' },
    { value: 'en_tratamiento', label: 'En tratamiento' },
    { value: 'dado_de_alta',   label: 'Alta médica' },
    { value: 'inactivo',       label: 'Inactivo' },
  ];

  get filteredPatients(): PatientListItem[] {
    let list = this.isDoctor()
      ? MOCK_PATIENTS.filter(p => p.assigned_doctor_id === this.currentUser().id_usuario)
      : MOCK_PATIENTS;

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

  openNewPatient(): void {
    this.editingPatient   = null;
    this.patientModalMode = 'create';
    this.showPatientModal  = true;
  }

  onPatientSaved(data: PatientDetail): void {
    // TODO: POST /api/pacientes
    console.log('[mock] Paciente guardado:', data);
    this.showPatientModal = false;
  }

  getAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  getStatusLabel(status: ClinicStatus): string { return STATUS_LABELS[status]; }

  toggleRole(): void {
    this.currentUser.set(this.isDoctor() ? MOCK_SECRETARY : MOCK_DOCTOR);
  }
}
