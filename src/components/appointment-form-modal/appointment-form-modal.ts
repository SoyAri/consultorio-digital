import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UserRole, AppointmentFormData, AppointmentFormMode, AppointmentStatus,
  DoctorOption, EMPTY_APPOINTMENT,
} from '../../app/models';
import { DatabaseService } from '../../app/services/database.service';

export interface PatientOption {
  id_paciente: string;
  full_name: string;
  phone: string;
}

@Component({
  selector: 'app-appointment-form-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-form-modal.html',
  styleUrl: './appointment-form-modal.css',
})
export class AppointmentFormModal implements OnChanges {
  private db = inject(DatabaseService);

  @Input() mode: AppointmentFormMode = 'create';
  @Input() appointment: AppointmentFormData | null = null;
  @Input() userRole: UserRole = 'doctor';
  @Input() doctorId: string = '';
  @Input() doctors: DoctorOption[] = [];

  @Output() saved = new EventEmitter<AppointmentFormData>();
  @Output() closed = new EventEmitter<void>();

  form: AppointmentFormData = { ...EMPTY_APPOINTMENT };

  // Autocomplete de paciente
  patientQuery   = '';
  patientResults: PatientOption[] = [];
  searching      = false;
  showDropdown   = false;
  private searchTimeout: any;

  // Conflicto de horario
  conflictWarning = false;
  private pendingData: AppointmentFormData | null = null;

  readonly statusOptions: { value: AppointmentStatus; label: string }[] = [
    { value: 'pendiente',  label: 'Pendiente' },
    { value: 'en_curso',   label: 'En curso' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada',  label: 'Cancelada' },
  ];

  get isDoctor(): boolean  { return this.userRole === 'doctor'; }
  get isAdmin(): boolean   { return this.userRole === 'admin'; }
  get isEditing(): boolean { return this.mode === 'edit'; }

  get title(): string {
    return this.mode === 'edit' ? 'Editar cita' : 'Agendar nueva cita';
  }

  get minDate(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appointment'] || changes['mode']) {
      this.form = this.appointment
        ? { ...this.appointment }
        : { ...EMPTY_APPOINTMENT, id_doctor: this.isDoctor ? this.doctorId : '' };
      // Mostrar el nombre del paciente ya seleccionado en el input
      this.patientQuery = this.form.patient_name;
      this.patientResults = [];
      this.showDropdown = false;
    }
  }

  onPatientInput(): void {
    const q = this.patientQuery.trim();

    // Si borra el campo, limpiar selección y resultados
    if (!q) {
      this.form.id_paciente = '';
      this.form.patient_name = '';
      this.patientResults = [];
      this.showDropdown = false;
      this.searching = false;
      clearTimeout(this.searchTimeout);
      return;
    }

    // Si el texto ya no coincide con el paciente seleccionado, invalidar selección
    if (this.form.patient_name && q !== this.form.patient_name) {
      this.form.id_paciente  = '';
      this.form.patient_name = '';
    }

    clearTimeout(this.searchTimeout);
    if (q.length < 2) { this.showDropdown = false; this.searching = false; return; }

    // El spinner solo aparece cuando el request realmente va a salir (no durante debounce)
    this.searchTimeout = setTimeout(async () => {
      this.searching = true;
      this.patientResults = await this.db.searchPacientes(q);
      this.showDropdown = this.patientResults.length > 0;
      this.searching = false;
    }, 250);
  }

  selectPatient(p: PatientOption): void {
    this.form.id_paciente  = p.id_paciente;
    this.form.patient_name = p.full_name;
    this.patientQuery      = p.full_name;
    this.patientResults    = [];
    this.showDropdown      = false;
  }

  closeDropdown(): void {
    // Pequeño delay para permitir que el click en una opción se registre primero
    setTimeout(() => { this.showDropdown = false; }, 150);
  }

  async submit(): Promise<void> {
    if (!this.form.id_paciente) return;
    if (!this.form.scheduled_date || !this.form.scheduled_time) return;

    const doctorId    = this.form.id_doctor || this.doctorId;
    const scheduledAt = `${this.form.scheduled_date}T${this.form.scheduled_time}:00`;
    const hasConflict = await this.db.checkDoctorConflict(doctorId, scheduledAt, this.form.id_cita);

    if (hasConflict) {
      this.pendingData    = { ...this.form };
      this.conflictWarning = true;
      return;
    }

    this.saved.emit({ ...this.form });
    this.close();
  }

  confirmOverride(): void {
    if (this.pendingData) {
      this.saved.emit(this.pendingData);
      this.close();
    }
  }

  cancelConflict(): void {
    this.conflictWarning = false;
    this.pendingData     = null;
  }

  close(): void {
    this.form            = { ...EMPTY_APPOINTMENT, id_doctor: this.isDoctor ? this.doctorId : '' };
    this.patientQuery    = '';
    this.patientResults  = [];
    this.showDropdown    = false;
    this.conflictWarning = false;
    this.pendingData     = null;
    this.closed.emit();
  }
}
