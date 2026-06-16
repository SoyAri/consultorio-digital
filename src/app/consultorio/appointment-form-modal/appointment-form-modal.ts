import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UserRole, AppointmentFormData, AppointmentFormMode, AppointmentStatus,
  DoctorOption, EMPTY_APPOINTMENT,
} from '../models';

@Component({
  selector: 'app-appointment-form-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-form-modal.html',
  styleUrl: './appointment-form-modal.css',
})
export class AppointmentFormModal implements OnChanges {
  @Input() mode: AppointmentFormMode = 'create';
  @Input() appointment: AppointmentFormData | null = null;
  @Input() userRole: UserRole = 'doctor';
  @Input() doctorId: string = '';          // ID del doctor actual (si el usuario es doctor)
  @Input() doctors: DoctorOption[] = [];

  @Output() saved = new EventEmitter<AppointmentFormData>();
  @Output() closed = new EventEmitter<void>();

  form: AppointmentFormData = { ...EMPTY_APPOINTMENT };

  readonly statusOptions: { value: AppointmentStatus; label: string }[] = [
    { value: 'pendiente',  label: 'Pendiente' },
    { value: 'en_curso',   label: 'En curso' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada',  label: 'Cancelada' },
  ];

  get isDoctor(): boolean { return this.userRole === 'doctor'; }
  get isAdmin(): boolean  { return this.userRole === 'admin'; }
  get isEditing(): boolean { return this.mode === 'edit'; }

  get title(): string {
    return this.mode === 'edit' ? 'Editar cita' : 'Agendar nueva cita';
  }

  get minDate(): string {
    if (this.mode === 'edit') return '';
    return new Date().toISOString().split('T')[0];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appointment'] || changes['mode']) {
      if (this.appointment) {
        this.form = { ...this.appointment };
      } else {
        this.form = {
          ...EMPTY_APPOINTMENT,
          id_doctor: this.isDoctor ? this.doctorId : '',
        };
      }
    }
  }

  submit(): void {
    if (!this.form.patient_name.trim() || !this.form.scheduled_date || !this.form.scheduled_time) return;
    // TODO (crear):  POST  /functions/v1/create-appointment  (verifica traslapes)
    // TODO (editar): PATCH /api/citas?id_cita=eq.{id}
    this.saved.emit({ ...this.form });
    this.close();
  }

  close(): void {
    this.form = { ...EMPTY_APPOINTMENT, id_doctor: this.isDoctor ? this.doctorId : '' };
    this.closed.emit();
  }
}
