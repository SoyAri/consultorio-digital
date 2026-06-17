import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffUser, StaffFormMode, StaffFormData, UserRole, EMPTY_STAFF } from '../../app/models';

@Component({
  selector: 'app-staff-form-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-form-modal.html',
  styleUrl: './staff-form-modal.css',
})
export class StaffFormModal implements OnChanges {
  @Input() mode: StaffFormMode = 'create';
  @Input() staff: StaffUser | null = null;

  @Output() saved         = new EventEmitter<StaffFormData>();
  @Output() closed        = new EventEmitter<void>();
  @Output() resetPassword = new EventEmitter<string>();

  form: StaffFormData = { ...EMPTY_STAFF };
  specialtyError = '';

  get isCreate(): boolean { return this.mode === 'create'; }
  get isDoctor():  boolean { return this.form.role === 'doctor'; }

  get title(): string {
    return this.mode === 'create' ? 'Invitar nuevo miembro' : 'Editar perfil';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['staff'] || changes['mode']) {
      this.specialtyError = '';

      if (this.staff && this.mode === 'edit') {
        this.form = {
          id_usuario: this.staff.id_usuario,
          full_name:  this.staff.full_name,
          email:      this.staff.email,
          role:       this.staff.role,
          specialty:  this.staff.specialty ?? '',
        };
      } else {
        this.form = { ...EMPTY_STAFF };
      }
    }
  }

  setRole(role: UserRole): void {
    this.form.role = role;
    if (role !== 'doctor') {
      this.form.specialty = '';
      this.specialtyError = '';
    }
  }

  submit(): void {
    this.specialtyError = '';

    if (!this.form.full_name.trim() || !this.form.email.trim()) return;

    if (this.form.role === 'doctor' && !this.form.specialty.trim()) {
      this.specialtyError = 'La especialidad es requerida para doctores';
      return;
    }

    // La lógica real (invite-staff Edge Function o updateStaffUser) se ejecuta
    // en el componente padre que recibe el evento 'saved'.
    this.saved.emit({ ...this.form });
    this.close();
  }

  requestReset(): void {
    this.resetPassword.emit(this.staff?.email ?? this.form.email);
  }

  close(): void {
    this.form           = { ...EMPTY_STAFF };
    this.specialtyError = '';
    this.closed.emit();
  }
}
