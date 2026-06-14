import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  StaffUser, UserRole, ClinicStatus, PatientDetail, PatientFormMode, DoctorOption,
  ConsultationRecord, ConsultationFormMode, PrescriptionItem,
} from '../../models';
import { PatientFormModal } from '../../../components/patient-form-modal/patient-form-modal';
import { ConsultationFormModal } from '../../../components/consultation-form-modal/consultation-form-modal';

const MOCK_DOCTOR: StaffUser = {
  id_usuario: 'usr-001', full_name: 'Ricardo Mendoza',
  role: 'doctor', specialty: 'Ortodoncia', email: 'r.mendoza@consultorio.mx',
};

const MOCK_SECRETARY: StaffUser = {
  id_usuario: 'usr-002', full_name: 'Laura Sánchez',
  role: 'admin', email: 'l.sanchez@consultorio.mx',
};

const MOCK_DOCTORS: DoctorOption[] = [
  { id_usuario: 'usr-001', full_name: 'Dr. Ricardo Mendoza',  specialty: 'Ortodoncia' },
  { id_usuario: 'usr-003', full_name: 'Dra. Patricia Olvera', specialty: 'Endodoncia' },
  { id_usuario: 'usr-004', full_name: 'Dr. Andrés Cisneros',  specialty: 'Cirugía Oral' },
];

// Ficha completa de cada paciente (mock)
const MOCK_PATIENTS_DETAIL: Partial<PatientDetail> & Pick<PatientDetail, 'full_name' | 'birth_date'>[] = [
  {
    id_paciente: 'pac-001', full_name: 'Ana García López', birth_date: '1990-03-15',
    phone: '2231234567', email: 'ana.garcia@gmail.com', gender: 'F',
    blood_type: 'O+', weight_kg: '62', height_cm: '163',
    has_allergies: false, allergies_medications: '', allergies_materials: '', allergies_other: '',
    has_chronic_conditions: false, chronic_conditions: '',
    takes_medications: false, current_medications: '',
    has_previous_surgeries: false, surgeries_detail: '',
    is_pregnant: 'no', smokes: false, drinks_alcohol: false,
    had_dental_treatment: true, last_dental_visit: '2026-04-15',
    dental_treatments_history: 'Ortodoncia iniciada en 2026. Brackets metálicos.',
    has_dental_sensitivity: true, sensitivity_triggers: 'Frio',
    has_braces_history: false, has_prosthetics: false, prosthetics_detail: '',
    chief_complaint: 'Corrección de apiñamiento dental',
    notes: 'Paciente comprometida con el tratamiento. Muy puntual.',
    assigned_doctor_id: 'usr-001', clinic_status: 'en_tratamiento',
  },
  {
    id_paciente: 'pac-002', full_name: 'Carlos Ruiz Herrera', birth_date: '1985-07-22',
    phone: '2239876543', email: 'carlos.ruiz@gmail.com', gender: 'M',
    blood_type: 'A+', weight_kg: '78', height_cm: '175',
    has_allergies: true, allergies_medications: 'Penicilina', allergies_materials: '', allergies_other: '',
    has_chronic_conditions: false, chronic_conditions: '',
    takes_medications: false, current_medications: '',
    has_previous_surgeries: false, surgeries_detail: '',
    is_pregnant: 'na', smokes: true, drinks_alcohol: false,
    had_dental_treatment: true, last_dental_visit: '2026-06-01',
    dental_treatments_history: 'Extracción del 1.7',
    has_dental_sensitivity: false, sensitivity_triggers: '',
    has_braces_history: false, has_prosthetics: false, prosthetics_detail: '',
    chief_complaint: 'Dolor en molar superior derecho',
    notes: 'Alergia a Penicilina confirmada. Usar Amoxicilina con precaución.',
    assigned_doctor_id: 'usr-001', clinic_status: 'en_tratamiento',
  },
  {
    id_paciente: 'pac-003', full_name: 'María Torres Vega', birth_date: '1995-11-30',
    phone: '2231112233', email: 'maria.torres@gmail.com', gender: 'F',
    blood_type: 'B+', weight_kg: '55', height_cm: '158',
    has_allergies: false, allergies_medications: '', allergies_materials: '', allergies_other: '',
    has_chronic_conditions: false, chronic_conditions: '',
    takes_medications: false, current_medications: '',
    has_previous_surgeries: false, surgeries_detail: '',
    is_pregnant: 'no', smokes: false, drinks_alcohol: false,
    had_dental_treatment: true, last_dental_visit: '2026-05-20',
    dental_treatments_history: 'Limpieza dental profunda. Sin caries activas.',
    has_dental_sensitivity: false, sensitivity_triggers: '',
    has_braces_history: false, has_prosthetics: false, prosthetics_detail: '',
    chief_complaint: 'Revisión y limpieza general',
    notes: '',
    assigned_doctor_id: 'usr-001', clinic_status: 'dado_de_alta',
  },
  {
    id_paciente: 'pac-004', full_name: 'José Martínez Díaz', birth_date: '1978-04-08',
    phone: '2234445566', email: 'jose.martinez@gmail.com', gender: 'M',
    blood_type: 'AB-', weight_kg: '82', height_cm: '172',
    has_allergies: false, allergies_medications: '', allergies_materials: '', allergies_other: '',
    has_chronic_conditions: true, chronic_conditions: 'Hipertensión',
    takes_medications: true, current_medications: 'Losartán 50mg',
    has_previous_surgeries: false, surgeries_detail: '',
    is_pregnant: 'na', smokes: false, drinks_alcohol: true,
    had_dental_treatment: true, last_dental_visit: '2026-06-12',
    dental_treatments_history: 'Endodoncia en pieza 1.6',
    has_dental_sensitivity: true, sensitivity_triggers: 'Calor y frío',
    has_braces_history: false, has_prosthetics: false, prosthetics_detail: '',
    chief_complaint: 'Dolor en pieza 1.6',
    notes: 'Monitorear presión arterial antes de procedimientos.',
    assigned_doctor_id: 'usr-003', clinic_status: 'en_tratamiento',
  },
  {
    id_paciente: 'pac-005', full_name: 'Sofía Reyes Castillo', birth_date: '2001-09-14',
    phone: '2237778899', email: 'sofia.reyes@gmail.com', gender: 'F',
    blood_type: 'O-', weight_kg: '58', height_cm: '165',
    has_allergies: false, allergies_medications: '', allergies_materials: '', allergies_other: '',
    has_chronic_conditions: false, chronic_conditions: '',
    takes_medications: false, current_medications: '',
    has_previous_surgeries: false, surgeries_detail: '',
    is_pregnant: 'no', smokes: false, drinks_alcohol: false,
    had_dental_treatment: false, last_dental_visit: '',
    dental_treatments_history: '',
    has_dental_sensitivity: false, sensitivity_triggers: '',
    has_braces_history: false, has_prosthetics: false, prosthetics_detail: '',
    chief_complaint: 'Primera consulta',
    notes: '',
    assigned_doctor_id: 'usr-003', clinic_status: 'inactivo',
  },
  {
    id_paciente: 'pac-006', full_name: 'Roberto Hernández Luna', birth_date: '1969-12-05',
    phone: '2230001122', email: 'roberto.hernandez@gmail.com', gender: 'M',
    blood_type: 'A-', weight_kg: '90', height_cm: '178',
    has_allergies: false, allergies_medications: '', allergies_materials: '', allergies_other: '',
    has_chronic_conditions: true, chronic_conditions: 'Diabetes tipo 2',
    takes_medications: true, current_medications: 'Metformina 850mg',
    has_previous_surgeries: true, surgeries_detail: 'Apendicectomía (2005)',
    is_pregnant: 'na', smokes: false, drinks_alcohol: false,
    had_dental_treatment: true, last_dental_visit: '2026-06-08',
    dental_treatments_history: 'Profilaxis semestral. Sin caries activas.',
    has_dental_sensitivity: false, sensitivity_triggers: '',
    has_braces_history: false, has_prosthetics: false, prosthetics_detail: '',
    chief_complaint: 'Control semestral',
    notes: 'Controlar glucemia antes de cualquier procedimiento invasivo.',
    assigned_doctor_id: 'usr-001', clinic_status: 'en_tratamiento',
  },
] as (Partial<PatientDetail> & Pick<PatientDetail, 'full_name' | 'birth_date'>)[];

// Historial de consultas por paciente (mock)
const MOCK_CONSULTATIONS: Record<string, ConsultationRecord[]> = {
  'pac-001': [
    {
      id_historial: 'hist-005', id_paciente: 'pac-001', patient_name: 'Ana García López',
      id_doctor: 'usr-001', doctor_name: 'Dr. Ricardo Mendoza', id_cita: 'cit-010',
      visit_date: '2026-06-10', chief_complaint: '2do ajuste de brackets',
      diagnosis: 'Avance favorable del tratamiento ortodoncia fase 2',
      treatment: 'Activación de arco, ajuste brackets sector posterior',
      observations: 'La paciente refiere leve sensibilidad tras el ajuste anterior. Se observa buen movimiento dental. Espacio creado para el canino 1.3. Continuamos con plan de tratamiento según cronograma.',
      prescriptions: [
        { medicine: 'Ibuprofeno', dosage: '400 mg', frequency: 'Cada 8 horas', duration: '3 días si hay dolor' },
      ],
      next_visit_date: '2026-07-10',
    },
    {
      id_historial: 'hist-004', id_paciente: 'pac-001', patient_name: 'Ana García López',
      id_doctor: 'usr-001', doctor_name: 'Dr. Ricardo Mendoza', id_cita: 'cit-008',
      visit_date: '2026-05-15', chief_complaint: '1er ajuste de brackets',
      diagnosis: 'Evolución favorable, leve sensibilidad post-activación',
      treatment: 'Cambio a arco 0.16 NiTi, activación de resortes',
      observations: 'Se observa buen movimiento inicial. Paciente comenta sensibilidad leve en dientes anteriores, normal en esta etapa. Higiene dental mejorada con respecto a visita anterior. Se refuerza técnica de cepillado.',
      prescriptions: [
        { medicine: 'Ibuprofeno', dosage: '400 mg', frequency: 'Cada 8 horas si hay dolor', duration: '3 días' },
      ],
      next_visit_date: '2026-06-10',
    },
    {
      id_historial: 'hist-003', id_paciente: 'pac-001', patient_name: 'Ana García López',
      id_doctor: 'usr-001', doctor_name: 'Dr. Ricardo Mendoza', id_cita: 'cit-006',
      visit_date: '2026-04-15', chief_complaint: 'Inicio tratamiento de ortodoncia',
      diagnosis: 'Maloclusión clase II. Apiñamiento moderado en sector anterior',
      treatment: 'Colocación de brackets metálicos superiores e inferiores',
      observations: 'Se explica al paciente el protocolo de cuidado con brackets: alimentos a evitar, técnica de cepillado interproximal. Buen estado periodontal previo. Paciente entusiasta y comprometida con el tratamiento.',
      prescriptions: [
        { medicine: 'Clorhexidina 0.12%', dosage: 'Enjuague bucal', frequency: '2 veces al día', duration: '1 mes' },
      ],
      next_visit_date: '2026-05-15',
    },
  ],
  'pac-002': [
    {
      id_historial: 'hist-001', id_paciente: 'pac-002', patient_name: 'Carlos Ruiz Herrera',
      id_doctor: 'usr-001', doctor_name: 'Dr. Ricardo Mendoza', id_cita: 'cit-003',
      visit_date: '2026-06-01', chief_complaint: 'Dolor en molar superior derecho',
      diagnosis: 'Caries profunda en 2do molar superior derecho (1.7). Indicación de extracción.',
      treatment: 'Extracción del 1.7 bajo anestesia local (Lidocaína 2%). Sutura 3-0 absorbible.',
      observations: 'Paciente tolera bien el procedimiento. Se aplica sutura. Sangrado controlado post-extracción. Se brindan instrucciones de cuidado post-operatorio: no morder con gasa por 30 min, no escupir, alimentación blanda las primeras 24h, no fumar. Programar revisión en 14 días.',
      prescriptions: [
        { medicine: 'Amoxicilina', dosage: '500 mg', frequency: 'Cada 8 horas', duration: '7 días' },
        { medicine: 'Ibuprofeno', dosage: '400 mg', frequency: 'Cada 6 horas', duration: '3 días (si hay dolor)' },
        { medicine: 'Paracetamol', dosage: '500 mg', frequency: 'Cada 6 horas alternado con ibuprofeno', duration: '3 días' },
      ],
      next_visit_date: '2026-06-14',
    },
  ],
  'pac-006': [
    {
      id_historial: 'hist-006', id_paciente: 'pac-006', patient_name: 'Roberto Hernández Luna',
      id_doctor: 'usr-001', doctor_name: 'Dr. Ricardo Mendoza', id_cita: 'cit-012',
      visit_date: '2026-06-08', chief_complaint: 'Control semestral y limpieza',
      diagnosis: 'Cálculo dental leve en sector anteroinferior. Sin caries activas.',
      treatment: 'Profilaxis completa: detartraje con ultrasonido, pulido con pasta profiláctica.',
      observations: 'Paciente con buena higiene dental en general. Se detecta cálculo leve. Encías en buen estado, sin sangrado significativo. Se recomienda mantener control glucémico estricto antes de próximos procedimientos más invasivos. Próximo control en 6 meses.',
      prescriptions: [],
      next_visit_date: '2026-12-08',
    },
  ],
};

const STATUS_LABELS: Record<ClinicStatus, string> = {
  en_tratamiento: 'En tratamiento',
  dado_de_alta:   'Alta médica',
  inactivo:       'Inactivo',
};

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, RouterModule, FormsModule, PatientFormModal, ConsultationFormModal],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private route = inject(ActivatedRoute);

  currentUser = signal<StaffUser>(MOCK_DOCTOR);
  patient     = signal<PatientDetail | null>(null);
  consultations = signal<ConsultationRecord[]>([]);

  isDoctor = computed(() => this.currentUser().role === 'doctor');
  isAdmin  = computed(() => this.currentUser().role === 'admin');

  sidebarOpen = false;

  showPatientModal        = false;
  patientModalMode: PatientFormMode = 'edit';

  showConsultationModal   = false;
  consultationModalMode: ConsultationFormMode = 'create';
  editingConsultation: ConsultationRecord | null = null;

  doctors = MOCK_DOCTORS;

  readonly statusOptions: { value: ClinicStatus; label: string }[] = [
    { value: 'en_tratamiento', label: 'En tratamiento' },
    { value: 'dado_de_alta',   label: 'Alta médica' },
    { value: 'inactivo',       label: 'Inactivo' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const found = MOCK_PATIENTS_DETAIL.find(p => (p as PatientDetail).id_paciente === id);
    this.patient.set(found ? (found as PatientDetail) : null);
    this.consultations.set(MOCK_CONSULTATIONS[id] ?? []);
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

  onPatientSaved(data: PatientDetail): void {
    // TODO: PATCH /api/pacientes?id_paciente=eq.{id}
    this.patient.set(data);
    this.showPatientModal = false;
  }

  onConsultationSaved(data: ConsultationRecord): void {
    // TODO (crear):  POST  /api/historiales
    // TODO (editar): PATCH /api/historiales?id_historial=eq.{id}
    if (this.consultationModalMode === 'edit') {
      this.consultations.update(list =>
        list.map((c: ConsultationRecord) => c.id_historial === data.id_historial ? data : c)
      );
    } else {
      const newRecord: ConsultationRecord = { ...data, id_historial: 'hist-' + Date.now() };
      this.consultations.update(list => [newRecord, ...list]);
    }
    this.showConsultationModal = false;
  }

  changeStatus(status: ClinicStatus): void {
    const p = this.patient();
    if (p) this.patient.set({ ...p, clinic_status: status });
    // TODO: PATCH /api/pacientes?id_paciente=eq.{id}  body: { clinic_status: status }
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

  getStatusLabel(status: ClinicStatus): string { return STATUS_LABELS[status]; }

  getPrescriptionSummary(prescriptions: PrescriptionItem[]): string {
    if (!prescriptions.length) return 'Sin receta';
    return prescriptions.map(p => p.medicine).join(', ');
  }

  toggleRole(): void {
    this.currentUser.set(this.isDoctor() ? MOCK_SECRETARY : MOCK_DOCTOR);
  }
}
