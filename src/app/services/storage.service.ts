import { Injectable, inject } from '@angular/core';
import { 
  FirebaseStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private firebaseService = inject(FirebaseService);
  private storage: FirebaseStorage;

  constructor() {
    this.storage = this.firebaseService.getStorage();
  }

  /**
   * Sube un archivo a un path específico en Firebase Storage y retorna su URL de descarga.
   * @param path Ruta del archivo en el bucket (ej. 'recetas/paciente_123/receta.pdf')
   * @param file Archivo Blob o File a subir
   */
  async uploadFile(path: string, file: File | Blob): Promise<string> {
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  /**
   * Elimina un archivo de Firebase Storage.
   * @param path Ruta del archivo o URL de descarga completa
   */
  async deleteFile(path: string): Promise<void> {
    let fileRef;
    if (path.startsWith('http')) {
      // Si se pasa la URL completa, podemos resolver la referencia usando ref(storage, url)
      fileRef = ref(this.storage, path);
    } else {
      fileRef = ref(this.storage, path);
    }
    return deleteObject(fileRef);
  }
}
