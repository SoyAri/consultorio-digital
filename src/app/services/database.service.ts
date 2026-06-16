import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.client;

  constructor() {}

  // ── MÉTODOS GENÉRICOS CRUD ──────────────────────────────────────────────────

  // Obtener un documento por ID
  async getDocument<T = any>(table: string, id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching document:', error);
      return null;
    }
    return data as T;
  }

  // Obtener todos los documentos de una tabla
  async getCollection<T = any>(table: string): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(table)
      .select('*');
      
    if (error) {
      console.error('Error fetching collection:', error);
      return [];
    }
    return data as T[];
  }

  // Agregar un documento
  async addDocument(table: string, data: any) {
    const { data: result, error } = await this.supabase
      .from(table)
      .insert({
        ...data,
        createdAt: new Date().toISOString()
      })
      .select();
      
    if (error) throw error;
    return result;
  }

  // Crear o sobrescribir un documento con un ID específico
  async setDocument(table: string, id: string, data: any) {
    const { data: result, error } = await this.supabase
      .from(table)
      .upsert({
        id,
        ...data,
        updatedAt: new Date().toISOString()
      })
      .select();
      
    if (error) throw error;
    return result;
  }

  // Actualizar un documento
  async updateDocument(table: string, id: string, data: any) {
    const { data: result, error } = await this.supabase
      .from(table)
      .update({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return result;
  }

  // Eliminar un documento
  async deleteDocument(table: string, id: string) {
    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }

  // Obtener actualizaciones en tiempo real de una tabla
  getCollectionUpdates$<T = any>(table: string, orderByColumn: string = 'id', ascending: boolean = true): Observable<T[]> {
    return new Observable<T[]>((subscriber) => {
      // Configurar suscripción inicial
      this.supabase
        .from(table)
        .select('*')
        .order(orderByColumn, { ascending })
        .then(({ data, error }) => {
          if (error) {
            subscriber.error(error);
          } else {
            subscriber.next(data as T[]);
          }
        });

      // Escuchar cambios
      const channel = this.supabase
        .channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: table }, (payload) => {
          // Cada vez que hay un cambio, volvemos a consultar para mantener el orden
          // (una implementación más avanzada actualizaría el arreglo local)
          this.supabase
            .from(table)
            .select('*')
            .order(orderByColumn, { ascending })
            .then(({ data, error }) => {
              if (error) {
                subscriber.error(error);
              } else {
                subscriber.next(data as T[]);
              }
            });
        })
        .subscribe();

      return () => {
        this.supabase.removeChannel(channel);
      };
    });
  }

  // ── MÉTODOS ESPECÍFICOS PARA EL CONSULTORIO (SAAS) ─────────────────────────

  // Pacientes
  getPacientes() {
    return this.getCollection('pacientes');
  }

  getPacienteById(id: string) {
    return this.getDocument('pacientes', id);
  }

  addPaciente(pacienteData: any) {
    return this.addDocument('pacientes', pacienteData);
  }

  updatePaciente(id: string, pacienteData: any) {
    return this.updateDocument('pacientes', id, pacienteData);
  }

  // Citas (Agendar)
  getCitas() {
    return this.getCollection('citas');
  }

  getCitasRealtime$() {
    return this.getCollectionUpdates$('citas', 'fechaHora', true);
  }

  addCita(citaData: any) {
    return this.addDocument('citas', citaData);
  }

  // Expediente / Consultas
  async getConsultasDePaciente(pacienteId: string) {
    const { data, error } = await this.supabase
      .from('consultas')
      .select('*')
      .eq('pacienteId', pacienteId)
      .order('fecha', { ascending: false });
      
    if (error) {
      console.error('Error fetching consultas:', error);
      return [];
    }
    return data;
  }

  addConsulta(consultaData: any) {
    return this.addDocument('consultas', consultaData);
  }
}
