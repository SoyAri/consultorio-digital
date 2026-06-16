import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StaffUser, UserRole, StaffFormMode, StaffFormData } from '../models';
import { StaffFormModal } from '../../components/staff-form-modal/staff-form-modal';
import { ResetPasswordModal } from '../../components/reset-password-modal/reset-password-modal';

// ── Datos simulados (reemplazar con llamada a Supabase) ───────────────────────
// TODO: supabase.from('staff_users').select('*').order('full_name')
const MOCK_STAFF: StaffUser[] = [
  { id_usuario: 'usr-001', full_name: 'Ricardo Mendoza',  role: 'doctor', specialty: 'Ortodoncia',      email: 'r.mendoza@consultorio.mx' },
  { id_usuario: 'usr-002', full_name: 'Laura Sánchez',    role: 'admin',                                email: 'l.sanchez@consultorio.mx' },
  { id_usuario: 'usr-003', full_name: 'Patricia Olvera',  role: 'doctor', specialty: 'Endodoncia',      email: 'p.olvera@consultorio.mx' },
  { id_usuario: 'usr-004', full_name: 'Andrés Cisneros',  role: 'doctor', specialty: 'Cirugía Oral',    email: 'a.cisneros@consultorio.mx' },
  { id_usuario: 'usr-005', full_name: 'Mónica Reyes',     role: 'admin',                                email: 'm.reyes@consultorio.mx' },
];

const MOCK_LOGGED_DOCTOR: StaffUser    = MOCK_STAFF[0];
const MOCK_LOGGED_SECRETARY: StaffUser = MOCK_STAFF[1];

@Component({
  selector: 'app-configuracion',
  imports: [CommonModule, RouterModule, StaffFormModal, ResetPasswordModal],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion {
  // ── Sesión simulada ──────────────────────────────────────────────────────────
  // TODO: reemplazar con AuthService + lectura de staff_users por user.id
  currentUser = signal<StaffUser>(MOCK_LOGGED_DOCTOR);

  isDoctor = computed(() => this.currentUser().role === 'doctor');
  isAdmin  = computed(() => this.currentUser().role === 'admin');

  // ── Lista de miembros del equipo ─────────────────────────────────────────────
  staffList = signal<StaffUser[]>([...MOCK_STAFF]);

  doctors  = computed(() => this.staffList().filter(s => s.role === 'doctor'));
  admins   = computed(() => this.staffList().filter(s => s.role === 'admin'));

  // ── Estado de UI ─────────────────────────────────────────────────────────────
  sidebarOpen = false;

  showStaffModal    = false;
  staffModalMode: StaffFormMode = 'create';
  editingStaff: StaffUser | null = null;

  showResetModal = false;
  resetEmail     = '';

  // ── Apertura de modales ───────────────────────────────────────────────────────
  openNewStaff(): void {
    this.editingStaff  = null;
    this.staffModalMode = 'create';
    this.showStaffModal = true;
  }

  openEditStaff(staff: StaffUser): void {
    this.editingStaff  = staff;
    this.staffModalMode = 'edit';
    this.showStaffModal = true;
  }

  openResetPassword(email: string): void {
    this.showStaffModal = false;
    this.resetEmail     = email;
    this.showResetModal = true;
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  onStaffSaved(data: StaffFormData): void {
    if (this.staffModalMode === 'create') {
      // TODO: El id_usuario vendrá del user.id retornado por authService.register()
      const nuevo: StaffUser = {
        id_usuario: 'usr-' + Date.now(),
        full_name:  data.full_name,
        email:      data.email,
        role:       data.role,
        specialty:  data.specialty || undefined,
      };
      this.staffList.update(list => [...list, nuevo]);
    } else {
      this.staffList.update(list =>
        list.map(s =>
          s.id_usuario === data.id_usuario
            ? { ...s, full_name: data.full_name, role: data.role, specialty: data.specialty || undefined }
            : s
        )
      );
    }
    this.showStaffModal = false;
  }

  // ── Helpers de presentación ───────────────────────────────────────────────────
  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getRoleLabel(role: UserRole): string {
    return role === 'doctor' ? 'Doctor' : 'Secretaria/o';
  }

  // ── Dev helper ────────────────────────────────────────────────────────────────
  toggleRole(): void {
    this.currentUser.set(this.isDoctor() ? MOCK_LOGGED_SECRETARY : MOCK_LOGGED_DOCTOR);
  }
}
