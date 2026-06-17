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

  @Output() saved  = new EventEmitter<PatientDetail>();
  @Output() closed = new EventEmitter<void>();

  activeTab: TabId = 'personal';
  isSaving = false;
  errors: Record<string, string> = {};

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'personal', label: 'Datos personales' },
    { id: 'medico',   label: 'Historial médico' },
    { id: 'dental',   label: 'Antecedentes dentales' },
  ];

  form: PatientDetail = { ...EMPTY_PATIENT };

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

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
      this.form      = this.patient ? { ...this.patient } : { ...EMPTY_PATIENT };
      this.activeTab = 'personal';
      this.errors    = {};
      this.isSaving  = false;
    }
  }

  setTab(id: TabId): void { this.activeTab = id; }

  // ── Validation ────────────────────────────────────────────────────────────

  private validatePersonalTab(): boolean {
    const errs: Record<string, string> = {};

    if (!this.stripHtml(this.form.full_name ?? '')) {
      errs['full_name'] = 'El nombre completo es obligatorio.';
    }

    const phone = (this.form.phone ?? '').replace(/\s/g, '');
    if (!phone) {
      errs['phone'] = 'El teléfono es obligatorio.';
    } else if (!/^\d{10}$/.test(phone)) {
      errs['phone'] = 'Ingresa exactamente 10 dígitos numéricos.';
    }

    if (!this.form.birth_date) {
      errs['birth_date'] = 'La fecha de nacimiento es obligatoria.';
    } else if (this.form.birth_date > this.today) {
      errs['birth_date'] = 'La fecha de nacimiento no puede ser en el futuro.';
    }

    if (!this.form.assigned_doctor_id) {
      errs['assigned_doctor_id'] = 'Selecciona un doctor para continuar.';
    }

    this.errors = errs;
    return Object.keys(errs).length === 0;
  }

  private validateMedicoTab(): boolean {
    const errs: Record<string, string> = {};

    const w = this.form.weight_kg;
    if (w !== '' && w != null) {
      const wn = Number(w);
      if (isNaN(wn) || wn < 1 || wn > 700) {
        errs['weight_kg'] = 'El peso debe estar entre 1 y 700 kg.';
      }
    }

    const h = this.form.height_cm;
    if (h !== '' && h != null) {
      const hn = Number(h);
      if (isNaN(hn) || hn < 30 || hn > 300) {
        errs['height_cm'] = 'La estatura debe estar entre 30 y 300 cm.';
      }
    }

    this.errors = errs;
    return Object.keys(errs).length === 0;
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  nextTab(): void {
    if (this.isLastTab) return;
    if (this.activeTab === 'personal' && !this.validatePersonalTab()) return;
    if (this.activeTab === 'medico'   && !this.validateMedicoTab())   return;
    this.errors    = {};
    this.activeTab = this.tabs[this.currentTabIndex + 1].id;
  }

  prevTab(): void {
    if (!this.isFirstTab) {
      this.errors    = {};
      this.activeTab = this.tabs[this.currentTabIndex - 1].id;
    }
  }

  // ── XSS sanitization ──────────────────────────────────────────────────────

  private stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, '').trim();
  }

  private sanitizeForm(): void {
    const textFields: (keyof PatientDetail)[] = [
      'full_name', 'address', 'allergies_medications', 'allergies_materials',
      'allergies_other', 'chronic_conditions', 'current_medications', 'surgeries_detail',
      'dental_treatments_history', 'sensitivity_triggers', 'prosthetics_detail',
      'chief_complaint', 'notes',
    ];
    for (const field of textFields) {
      const val = (this.form as any)[field];
      if (typeof val === 'string') {
        (this.form as any)[field] = this.stripHtml(val);
      }
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  submit(): void {
    if (this.isSaving) return;

    if (!this.validatePersonalTab()) {
      this.activeTab = 'personal';
      return;
    }
    if (this.isDoctor && !this.validateMedicoTab()) {
      this.activeTab = 'medico';
      return;
    }

    this.sanitizeForm();
    this.isSaving = true;
    // Parent closes the modal via showPatientModal = false after onPatientSaved()
    this.saved.emit({ ...this.form });
  }

  close(): void {
    this.form      = { ...EMPTY_PATIENT };
    this.activeTab = 'personal';
    this.errors    = {};
    this.isSaving  = false;
    this.closed.emit();
  }
}
