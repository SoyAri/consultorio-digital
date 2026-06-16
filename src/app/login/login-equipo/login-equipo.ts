import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login-equipo',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-equipo.html',
  styleUrl: './login-equipo.css',
})
export class LoginEquipo {
  email    = '';
  password = '';
  showPwd  = false;

  loading = false;
  error   = '';

  showReset    = false;
  resetEmail   = '';
  resetSent    = false;
  resetLoading = false;

  constructor(private router: Router) {}

  async login(): Promise<void> {
    if (!this.email.trim() || !this.password) return;
    this.loading = true;
    this.error   = '';
    try {
      // TODO: const { data, error } = await authService.login(this.email, this.password)
      // Con Supabase la sesión queda persistida automáticamente.
      // Luego leer staff_users por data.user.id para obtener role y redirigir.
      console.log('[mock] Login equipo:', this.email);
      await new Promise(r => setTimeout(r, 800));
      this.router.navigate(['/consultorio']);
    } catch {
      this.error = 'Correo o contraseña incorrectos.';
    } finally {
      this.loading = false;
    }
  }

  async sendReset(): Promise<void> {
    if (!this.resetEmail.trim()) return;
    this.resetLoading = true;
    this.error        = '';
    try {
      // TODO: await authService.resetPassword(this.resetEmail)
      console.log('[mock] Enlace de restablecimiento enviado a:', this.resetEmail);
      await new Promise(r => setTimeout(r, 700));
      this.resetSent = true;
    } catch {
      this.error = 'No se pudo enviar el correo. Intenta de nuevo.';
    } finally {
      this.resetLoading = false;
    }
  }

  openReset(): void {
    this.showReset  = true;
    this.resetSent  = false;
    this.resetEmail = this.email;
    this.error      = '';
  }

  closeReset(): void {
    this.showReset  = false;
    this.resetSent  = false;
    this.resetEmail = '';
  }
}
