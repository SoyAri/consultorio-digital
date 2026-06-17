import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UserRole, ConsultationRecord, ConsultationFormMode,
  PrescriptionItem, EMPTY_CONSULTATION, EMPTY_PRESCRIPTION,
} from '../../app/models';

@Component({
  selector: 'app-consultation-form-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './consultation-form-modal.html',
  styleUrl: './consultation-form-modal.css',
})
export class ConsultationFormModal implements OnChanges {
  @Input() mode: ConsultationFormMode = 'create';
  @Input() consultation: ConsultationRecord | null = null;
  @Input() patientId: string = '';
  @Input() patientName: string = '';
  @Input() doctorId: string = '';
  @Input() doctorName: string = '';
  @Input() appointmentId: string = '';
  @Input() userRole: UserRole = 'doctor';

  @Output() saved = new EventEmitter<ConsultationRecord>();
  @Output() closed = new EventEmitter<void>();

  form: ConsultationRecord = { ...EMPTY_CONSULTATION };
  newPrescription: PrescriptionItem = { ...EMPTY_PRESCRIPTION };
  isSaving = false;

  get isEditing(): boolean { return this.mode === 'edit'; }
  get title(): string { return this.isEditing ? 'Editar consulta' : 'Registrar consulta'; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['consultation'] || changes['mode'] || changes['patientId'] || changes['doctorId']) {
      if (this.consultation) {
        this.form = { ...this.consultation, prescriptions: [...this.consultation.prescriptions] };
      } else {
        this.form = {
          ...EMPTY_CONSULTATION,
          id_paciente: this.patientId,
          patient_name: this.patientName,
          id_doctor: this.doctorId,
          doctor_name: this.doctorName,
          id_cita: this.appointmentId,
          visit_date: new Date().toISOString().split('T')[0],
        };
      }
      this.newPrescription = { ...EMPTY_PRESCRIPTION };
    }
  }

  addPrescriptionItem(): void {
    if (!this.newPrescription.medicine.trim()) return;
    this.form.prescriptions = [...this.form.prescriptions, { ...this.newPrescription }];
    this.newPrescription = { ...EMPTY_PRESCRIPTION };
  }

  removePrescriptionItem(index: number): void {
    this.form.prescriptions = this.form.prescriptions.filter((_: PrescriptionItem, i: number) => i !== index);
  }

  submit(): void {
    if (this.isSaving) return;
    if (!this.form.observations.trim() && !this.form.diagnosis.trim()) return;
    this.isSaving = true;
    this.saved.emit({ ...this.form, prescriptions: [...this.form.prescriptions] });
    // Parent closes modal after async save via showConsultationModal = false
  }

  close(): void {
    this.form = { ...EMPTY_CONSULTATION };
    this.newPrescription = { ...EMPTY_PRESCRIPTION };
    this.closed.emit();
  }
}
