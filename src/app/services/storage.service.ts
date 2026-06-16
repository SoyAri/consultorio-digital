import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.client;
  private bucketName = 'default-bucket'; // Change this to your actual Supabase bucket name

  constructor() {}

  /**
   * Sube un archivo a un path específico en Supabase Storage y retorna su URL pública.
   * @param path Ruta del archivo en el bucket (ej. 'recetas/paciente_123/receta.pdf')
   * @param file Archivo Blob o File a subir
   */
  async uploadFile(path: string, file: File | Blob): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, file, {
        upsert: true,
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    return urlData.publicUrl;
  }

  /**
   * Elimina un archivo de Supabase Storage.
   * @param path Ruta del archivo en el bucket
   */
  async deleteFile(path: string): Promise<void> {
    // If the full URL was passed, we'd need to extract the path.
    // For Supabase, it's safer to pass the relative path within the bucket.
    let filePath = path;
    if (path.startsWith('http')) {
      const urlParts = path.split(`${this.bucketName}/`);
      if (urlParts.length > 1) {
        filePath = urlParts[1];
      }
    }

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      throw error;
    }
  }
}
