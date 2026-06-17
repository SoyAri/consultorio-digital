import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { PatientDetail, StaffUser, DoctorOption, ConsultationRecord } from '../models';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.client;

  // ── PACIENTES ──────────────────────────────────────────────────────────────

  async getPacientes(): Promise<PatientDetail[]> {
    const { data, error } = await this.supabase
      .from('pacientes')
      .select('*')
      .order('full_name');
    if (error) { console.error('getPacientes:', error); return []; }
    return (data ?? []) as PatientDetail[];
  }

  async getPacientesPaginados(options: {
    page: number;
    pageSize: number;
    query: string;
    status: string;
    doctorId?: string;
  }): Promise<{ data: PatientDetail[]; total: number }> {
    const { page, pageSize, query, status, doctorId } = options;
    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;

    let q = this.supabase
      .from('pacientes')
      .select('*', { count: 'exact' })
      .order('full_name')
      .range(from, to);

    if (query.trim()) {
      const words = query.trim().split(/\s+/).filter(Boolean);
      if (words.length === 1) {
        const w = words[0];
        q = q.or(`full_name.ilike.%${w}%,phone.ilike.%${w}%,email.ilike.%${w}%`);
      } else {
        for (const word of words) {
          q = q.ilike('full_name', `%${word}%`);
        }
      }
    }

    if (status) q = q.eq('clinic_status', status);
    if (doctorId) q = q.eq('assigned_doctor_id', doctorId);

    const { data, error, count } = await q;
    if (error) { console.error('getPacientesPaginados:', error); return { data: [], total: 0 }; }
    return { data: (data ?? []) as PatientDetail[], total: count ?? 0 };
  }

  async getPacienteById(id: string): Promise<PatientDetail | null> {
    const { data, error } = await this.supabase
      .from('pacientes')
      .select('*')
      .eq('id_paciente', id)
      .single();
    if (error) { console.error('getPacienteById:', error); return null; }
    return data as PatientDetail;
  }

  async getPacienteByPhone(phone: string): Promise<PatientDetail | null> {
    const { data, error } = await this.supabase
      .from('pacientes')
      .select('id_paciente, full_name, phone')
      .eq('phone', phone)
      .single();
    if (error) return null;
    return data as PatientDetail;
  }

  async searchPacientes(query: string): Promise<{ id_paciente: string; full_name: string; phone: string }[]> {
    const q = query.trim();
    if (!q) return [];

    const words = q.split(/\s+/).filter(Boolean);

    // Cada palabra debe aparecer en algún lugar del nombre (AND entre palabras)
    // Ej: "axel torres" → full_name ilike '%axel%' AND full_name ilike '%torres%'
    let nameQuery = this.supabase
      .from('pacientes')
      .select('id_paciente, full_name, phone')
      .order('full_name')
      .limit(8);
    for (const word of words) {
      nameQuery = nameQuery.ilike('full_name', `%${word}%`);
    }

    const { data: nameData, error } = await nameQuery;
    if (error) { console.error('searchPacientes:', error); return []; }

    const results: { id_paciente: string; full_name: string; phone: string }[] = [...(nameData ?? [])];

    // Buscar por teléfono también (solo si es una sola palabra, puede ser número)
    if (words.length === 1) {
      const { data: phoneData } = await this.supabase
        .from('pacientes')
        .select('id_paciente, full_name, phone')
        .ilike('phone', `%${q}%`)
        .limit(4);
      const seen = new Set(results.map(r => r.id_paciente));
      for (const p of (phoneData ?? [])) {
        if (!seen.has(p.id_paciente)) results.push(p);
      }
    }

    return results;
  }

  async addPaciente(pacienteData: Omit<PatientDetail, 'id_paciente'>): Promise<PatientDetail | null> {
    const { data, error } = await this.supabase
      .from('pacientes')
      .insert(this.sanitizePatient(pacienteData))
      .select()
      .single();
    if (error) throw error;
    return data as PatientDetail;
  }

  async updatePaciente(id: string, pacienteData: Partial<PatientDetail>): Promise<void> {
    const { error } = await this.supabase
      .from('pacientes')
      .update(this.sanitizePatient(pacienteData))
      .eq('id_paciente', id);
    if (error) throw error;
  }

  // Convierte strings vacíos a null en campos tipados; elimina id_paciente vacío
  private sanitizePatient(data: any): any {
    const clean = { ...data };
    // DATE fields
    if (clean.birth_date === '')       clean.birth_date = null;
    if (clean.last_dental_visit === '') clean.last_dental_visit = null;
    // UUID fields — PostgreSQL rechaza "" para columnas uuid
    if (clean.assigned_doctor_id === '') clean.assigned_doctor_id = null;
    if (clean.id_paciente === '')       delete clean.id_paciente;
    return clean;
  }

  // ── STAFF USERS ────────────────────────────────────────────────────────────

  async getStaffUsers(): Promise<StaffUser[]> {
    const { data, error } = await this.supabase
      .from('staff_users')
      .select('*')
      .order('full_name');
    if (error) { console.error('getStaffUsers:', error); return []; }
    return (data ?? []) as StaffUser[];
  }

  async getDoctors(): Promise<DoctorOption[]> {
    const { data, error } = await this.supabase
      .from('staff_users')
      .select('id_usuario, full_name, specialty')
      .eq('role', 'doctor')
      .order('full_name');
    if (error) { console.error('getDoctors:', error); return []; }
    return (data ?? []) as DoctorOption[];
  }

  async getStaffById(id: string): Promise<StaffUser | null> {
    const { data, error } = await this.supabase
      .from('staff_users')
      .select('*')
      .eq('id_usuario', id)
      .single();
    if (error) { console.error('getStaffById:', error); return null; }
    return data as StaffUser;
  }

  async updateStaffUser(id: string, staffData: Partial<StaffUser>): Promise<void> {
    const { error } = await this.supabase
      .from('staff_users')
      .update(staffData)
      .eq('id_usuario', id);
    if (error) throw error;
  }

  // ── CITAS ──────────────────────────────────────────────────────────────────

  async getCitasHoy(doctorId?: string): Promise<any[]> {
    const today = new Date();
    const start = new Date(today); start.setHours(0, 0, 0, 0);
    const end   = new Date(today); end.setHours(23, 59, 59, 999);

    let query = this.supabase
      .from('citas')
      .select('*')
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at');

    if (doctorId) query = query.eq('id_doctor', doctorId);

    const { data, error } = await query;
    if (error) { console.error('getCitasHoy:', error); return []; }
    return data ?? [];
  }

  async getCitasPorMes(year: number, month: number, doctorId?: string): Promise<any[]> {
    const start = new Date(year, month, 1);
    const end   = new Date(year, month + 1, 0, 23, 59, 59, 999);

    let query = this.supabase
      .from('citas')
      .select('*')
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at');

    if (doctorId) query = query.eq('id_doctor', doctorId);

    const { data, error } = await query;
    if (error) { console.error('getCitasPorMes:', error); return []; }
    return data ?? [];
  }

  async getCitasDePaciente(pacienteId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('citas')
      .select('*')
      .eq('id_paciente', pacienteId)
      .order('scheduled_at', { ascending: false });
    if (error) { console.error('getCitasDePaciente:', error); return []; }
    return data ?? [];
  }

  async checkDoctorConflict(doctorId: string, scheduledAt: string, excludeCitaId?: string): Promise<boolean> {
    if (!doctorId || !scheduledAt) return false;
    const dt   = new Date(scheduledAt);
    const from = new Date(dt.getTime() - 30 * 60_000).toISOString();
    const to   = new Date(dt.getTime() + 30 * 60_000).toISOString();

    let q = this.supabase
      .from('citas')
      .select('id_cita')
      .eq('id_doctor', doctorId)
      .in('status', ['pendiente', 'en_curso'])
      .gte('scheduled_at', from)
      .lte('scheduled_at', to);

    if (excludeCitaId) q = q.neq('id_cita', excludeCitaId);

    const { data } = await q;
    return (data?.length ?? 0) > 0;
  }

  async addCita(citaData: any): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('citas')
      .insert(citaData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateCita(id: string, citaData: any): Promise<void> {
    const { error } = await this.supabase
      .from('citas')
      .update(citaData)
      .eq('id_cita', id);
    if (error) throw error;
  }

  // Real-time para citas de hoy
  getCitasHoyRealtime$(doctorId?: string): Observable<any[]> {
    return new Observable((subscriber) => {
      this.getCitasHoy(doctorId).then(data => subscriber.next(data));

      const channel = this.supabase
        .channel('citas_hoy')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, () => {
          this.getCitasHoy(doctorId).then(data => subscriber.next(data));
        })
        .subscribe();

      return () => { this.supabase.removeChannel(channel); };
    });
  }

  // ── CONSULTAS ──────────────────────────────────────────────────────────────

  async getConsultasDePaciente(pacienteId: string): Promise<ConsultationRecord[]> {
    const { data, error } = await this.supabase
      .from('consultas')
      .select('*')
      .eq('id_paciente', pacienteId)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) { console.error('getConsultasDePaciente:', error); return []; }
    return (data ?? []) as ConsultationRecord[];
  }

  async addConsulta(consultaData: any): Promise<ConsultationRecord | null> {
    const clean = { ...consultaData };
    if (clean.next_visit_date === '') clean.next_visit_date = null;
    if (clean.id_cita === '')       clean.id_cita = null;
    if (clean.id_paciente === '')   clean.id_paciente = null;
    if (clean.id_doctor === '')     clean.id_doctor = null;

    const { data, error } = await this.supabase
      .from('consultas')
      .insert(clean)
      .select()
      .single();
    if (error) throw error;
    return data as ConsultationRecord;
  }

  async updateConsulta(id: string, consultaData: any): Promise<void> {
    const clean = { ...consultaData };
    if (clean.next_visit_date === '') clean.next_visit_date = null;
    if (clean.id_cita === '')       clean.id_cita = null;
    if (clean.id_paciente === '')   clean.id_paciente = null;
    if (clean.id_doctor === '')     clean.id_doctor = null;

    const { error } = await this.supabase
      .from('consultas')
      .update(clean)
      .eq('id_historial', id);
    if (error) throw error;
  }
}
