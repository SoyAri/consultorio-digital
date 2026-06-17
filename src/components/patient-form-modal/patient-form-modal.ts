import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UserRole, PatientDetail, PatientFormMode, DoctorOption, EMPTY_PATIENT,
} from '../../app/models';

type TabId = 'personal' | 'medico' | 'dental';

@Component({
  selector: 'app-patient-form-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-form-modal.html',
  styleUrl: './patient-form-modal.css',
})
export class PatientFormModal implements OnChanges {
  @Input() mode: PatientFormMode = 'create';
  @Input() patient: PatientDetail | null = null;
  @Input() userRole: UserRole = 'doctor';
  @Input() doctors: DoctorOption[] = [];

  @Output() saved = new EventEmitter<PatientDetail>();
  @Output() closed = new EventEmitter<void>();

  activeTab: TabId = 'personal';

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'personal', label: 'Datos personales' },
    { id: 'medico',   label: 'Historial médico' },
    { id: 'dental',   label: 'Antecedentes dentales' },
  ];

  form: PatientDetail = { ...EMPTY_PATIENT };

  get isDoctor(): boolean { return this.userRole === 'doctor'; }
  get isAdmin(): boolean  { return this.userRole === 'admin'; }

  get title(): string {
    return this.mode === 'edit' ? 'Editar ficha del paciente' : 'Registrar nuevo paciente';
  }

  get currentTabIndex(): number {
    return this.tabs.findIndex(t => t.id === this.activeTab);
  }

  get isFirstTab(): boolean { return this.currentTabIndex === 0; }
  get isLastTab(): boolean  { return this.currentTabIndex === this.tabs.length - 1; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patient'] || changes['mode']) {
      this.form = this.patient ? { ...this.patient } : { ...EMPTY_PATIENT };
      this.activeTab = 'personal';
    }
  }

  setTab(id: TabId): void { this.activeTab = id; }

  nextTab(): void {
    if (!this.isLastTab) this.activeTab = this.tabs[this.currentTabIndex + 1].id;
  }

  prevTab(): void {
    if (!this.isFirstTab) this.activeTab = this.tabs[this.currentTabIndex - 1].id;
  }

  doctorError = false;

  submit(): void {
    if (!this.form.full_name.trim()) {
      this.activeTab = 'personal';
      return;
    }
    if (!this.form.assigned_doctor_id) {
      this.doctorError = true;
      this.activeTab = 'personal';
      return;
    }
    this.doctorError = false;
    this.saved.emit({ ...this.form });
    this.close();
  }

  close(): void {
    this.form = { ...EMPTY_PATIENT };
    this.activeTab = 'personal';
    this.closed.emit();
  }
}
