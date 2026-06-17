import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

interface PatientSession {
  id_paciente: string;
  full_name: string;
  phone: string;
}

@Component({
  selector: 'app-portal',
  imports: [CommonModule, RouterModule],
  templateUrl: './portal.html',
  styleUrl: './portal.css',
})
export class Portal implements OnInit {
  private supabase = inject(SupabaseService).client;
  private router   = inject(Router);

  patient       = signal<PatientSession | null>(null);
  appointments  = signal<any[]>([]);
  consultations = signal<any[]>([]);
  loading       = signal(true);
  error         = signal('');

  async ngOnInit(): Promise<void> {
    const sessionStr = sessionStorage.getItem('patient_session');
    if (!sessionStr) {
      this.router.navigate(['/login/paciente']);
      return;
    }

    const patient = JSON.parse(sessionStr) as PatientSession;
    this.patient.set(patient);

    await this.loadData(patient.id_paciente);
    this.loading.set(false);
  }

  private async loadData(pacienteId: string): Promise<void> {
    const now = new Date().toISOString();

    const [citasRes, consultasRes] = await Promise.all([
      this.supabase
        .from('citas')
        .select('id_cita, doctor_name, scheduled_at, reason, status')
        .eq('id_paciente', pacienteId)
        .gte('scheduled_at', now)
        .order('scheduled_at')
        .limit(10),
      this.supabase
        .from('consultas')
        .select('id_historial, doctor_name, visit_date, chief_complaint, diagnosis, prescriptions')
        .eq('id_paciente', pacienteId)
        .order('visit_date', { ascending: false })
        .limit(10),
    ]);

    if (citasRes.error)    this.error.set('Error al cargar citas.');
    if (consultasRes.error) this.error.set('Error al cargar historial.');

    this.appointments.set(citasRes.data ?? []);
    this.consultations.set(consultasRes.data ?? []);
  }

  logout(): void {
    sessionStorage.removeItem('patient_session');
    this.router.navigate(['/login/paciente']);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente', en_curso: 'En curso',
      completada: 'Completada', cancelada: 'Cancelada',
    };
    return labels[status] ?? status;
  }

  get firstName(): string {
    return this.patient()?.full_name.split(' ')[0] ?? '';
  }
}
