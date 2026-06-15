import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  DocumentData,
  onSnapshot
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firebaseService = inject(FirebaseService);
  private db: Firestore;

  constructor() {
    this.db = this.firebaseService.getFirestore();
  }

  // ── MÉTODOS GENÉRICOS CRUD ──────────────────────────────────────────────────

  // Obtener un documento por ID
  async getDocument<T = DocumentData>(path: string, id: string): Promise<T | null> {
    const docRef = doc(this.db, path, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as unknown as T;
    }
    return null;
  }

  // Obtener todos los documentos de una colección
  async getCollection<T = DocumentData>(path: string): Promise<T[]> {
    const colRef = collection(this.db, path);
    const querySnapshot = await getDocs(colRef);
    const results: T[] = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() } as unknown as T);
    });
    return results;
  }

  // Agregar un documento con ID autogenerado
  addDocument(path: string, data: any) {
    const colRef = collection(this.db, path);
    return addDoc(colRef, {
      ...data,
      createdAt: new Date().toISOString()
    });
  }

  // Crear o sobrescribir un documento con un ID específico
  setDocument(path: string, id: string, data: any) {
    const docRef = doc(this.db, path, id);
    return setDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  // Actualizar un documento
  updateDocument(path: string, id: string, data: any) {
    const docRef = doc(this.db, path, id);
    return updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }

  // Eliminar un documento
  deleteDocument(path: string, id: string) {
    const docRef = doc(this.db, path, id);
    return deleteDoc(docRef);
  }

  // Obtener actualizaciones en tiempo real de una colección/query como Observable
  getCollectionUpdates$<T = DocumentData>(path: string, ...queries: any[]): Observable<T[]> {
    return new Observable<T[]>((subscriber) => {
      const colRef = collection(this.db, path);
      const q = queries.length > 0 ? query(colRef, ...queries) : colRef;
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const results: T[] = [];
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as unknown as T);
        });
        subscriber.next(results);
      }, (error) => {
        subscriber.error(error);
      });

      return () => unsubscribe();
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
    return this.getCollectionUpdates$('citas', orderBy('fechaHora', 'asc'));
  }

  addCita(citaData: any) {
    return this.addDocument('citas', citaData);
  }

  // Expediente / Consultas
  getConsultasDePaciente(pacienteId: string) {
    const colRef = collection(this.db, 'consultas');
    const q = query(colRef, where('pacienteId', '==', pacienteId), orderBy('fecha', 'desc'));
    return getDocs(q).then((querySnapshot) => {
      const results: any[] = [];
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
      return results;
    });
  }

  addConsulta(consultaData: any) {
    return this.addDocument('consultas', consultaData);
  }
}
