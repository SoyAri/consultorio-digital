import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../app/services/auth.service';

@Component({
  selector: 'app-reset-password-modal',
  imports: [CommonModule],
  templateUrl: './reset-password-modal.html',
  styleUrl: './reset-password-modal.css',
})
export class ResetPasswordModal {
  private auth = inject(AuthService);

  @Input() email = '';

  @Output() sent   = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  sending = false;
  success = false;
  error   = '';

  async send(): Promise<void> {
    if (!this.email.trim()) return;
    this.sending = true;
    this.error   = '';
    try {
      await this.auth.resetPassword(this.email.trim());
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
