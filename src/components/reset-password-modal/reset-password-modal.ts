import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password-modal',
  imports: [CommonModule],
  templateUrl: './reset-password-modal.html',
  styleUrl: './reset-password-modal.css',
})
export class ResetPasswordModal {
  @Input() email = '';

  @Output() sent   = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  sending = false;
  success = false;
  error   = '';

  async send(): Promise<void> {
    this.sending = true;
    this.error   = '';
    try {
      // TODO: await authService.resetPassword(this.email)
      // Supabase enviará un correo al usuario con un enlace para restablecer su contraseña.
      // El enlace redirigirá al usuario a la URL configurada en el dashboard de Supabase
      // bajo Authentication > URL Configuration > Redirect URLs.
      console.log('[mock] Enlace de restablecimiento enviado a:', this.email);
      await new Promise(r => setTimeout(r, 800)); // simula latencia
      this.success = true;
      this.sent.emit();
    } catch {
      this.error = 'No se pudo enviar el correo. Intenta de nuevo.';
    } finally {
      this.sending = false;
    }
  }

  close(): void {
    this.success = false;
    this.error   = '';
    this.closed.emit();
  }
}
