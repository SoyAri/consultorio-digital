import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

type Step = 'loading' | 'set-password' | 'success' | 'error';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        <!-- Loading -->
        @if (step() === 'loading') {
          <div class="flex flex-col items-center gap-4 py-6">
            <div class="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-gray-500">Verificando invitación…</p>
          </div>
        }

        <!-- Establecer contraseña -->
        @if (step() === 'set-password') {
          <div class="mb-6 text-center">
            <div class="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
            </div>
            <h1 class="text-lg font-semibold text-gray-900">Bienvenido al equipo</h1>
            <p class="text-sm text-gray-500 mt-1">Establece una contraseña para tu cuenta.</p>
          </div>

          @if (error()) {
            <div class="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{{ error() }}</div>
          }

          <form (ngSubmit)="setPassword()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input type="password" [(ngModel)]="password" name="password" required minlength="8"
                placeholder="Mínimo 8 caracteres"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required
                placeholder="Repite tu contraseña"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <button type="submit" [disabled]="saving()"
              class="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              @if (saving()) { Guardando… } @else { Establecer contraseña }
            </button>
          </form>
        }

        <!-- Éxito -->
        @if (step() === 'success') {
          <div class="flex flex-col items-center gap-4 py-6 text-center">
            <div class="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900">¡Contraseña establecida!</p>
              <p class="text-sm text-gray-500 mt-1">Redirigiendo al consultorio…</p>
            </div>
          </div>
        }

        <!-- Error -->
        @if (step() === 'error') {
          <div class="flex flex-col items-center gap-4 py-6 text-center">
            <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-900">Enlace inválido o expirado</p>
              <p class="text-sm text-gray-500 mt-1">{{ error() }}</p>
            </div>
            <a routerLink="/login/equipo" class="text-sm text-teal-600 hover:underline">Ir al inicio de sesión</a>
          </div>
        }

      </div>
    </div>
  `,
})
export class AuthCallback implements OnInit {
  private supabase = inject(SupabaseService).client;
  private router   = inject(Router);

  step    = signal<Step>('loading');
  error   = signal('');
  saving  = signal(false);

  password        = '';
  confirmPassword = '';

  async ngOnInit(): Promise<void> {
    // Supabase JS detecta automáticamente el hash #access_token del URL
    const { data: { session }, error } = await this.supabase.auth.getSession();

    if (error || !session) {
      this.error.set(error?.message ?? 'No se encontró una sesión válida en este enlace.');
      this.step.set('error');
      return;
    }

    this.step.set('set-password');
  }

  async setPassword(): Promise<void> {
    if (this.password.length < 8) {
      this.error.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const { error } = await this.supabase.auth.updateUser({ password: this.password });

    if (error) {
      this.error.set(error.message);
      this.saving.set(false);
      return;
    }

    this.step.set('success');
    setTimeout(() => this.router.navigate(['/consultorio']), 1500);
  }
}
