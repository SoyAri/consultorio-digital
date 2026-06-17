import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DatabaseService } from '../../services/database.service';

type LoginStep = 'phone' | 'otp';

interface PatientSession {
  id_paciente: string;
  full_name: string;
  phone: string;
}

@Component({
  selector: 'app-login-paciente',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-paciente.html',
  styleUrl: './login-paciente.css',
})
export class LoginPaciente implements OnDestroy {
  private db     = inject(DatabaseService);
  private router = inject(Router);

  step: LoginStep = 'phone';

  phone = '';
  otp   = '';

  foundPatient: PatientSession | null = null;
  loading        = false;
  error          = '';
  resendCooldown = 0;

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  async sendOtp(): Promise<void> {
    const digits = this.phone.replace(/\D/g, '');
    if (digits.length !== 10) return;
    this.loading = true;
    this.error   = '';

    // 1. Buscar paciente en Supabase por número de teléfono
    const patient = await this.db.getPacienteByPhone(digits);

    if (!patient) {
      this.error   = 'No encontramos ningún paciente registrado con ese número.';
      this.loading = false;
      return;
    }

    this.foundPatient = {
      id_paciente: (patient as any).id_paciente,
      full_name: patient.full_name,
      phone: digits,
    };

    // Guardar sesión de paciente en sessionStorage
    sessionStorage.setItem('patient_session', JSON.stringify(this.foundPatient));

    // 2. Enviar OTP real (requiere proveedor SMS configurado en Supabase > Auth > Providers > Phone)
    // Si Twilio está configurado, descomentar:
    // try {
    //   const { error } = await supabase.auth.signInWithOtp({ phone: '+52' + digits });
    //   if (error) throw error;
    // } catch {
    //   this.error = 'No se pudo enviar el código. Intenta de nuevo.';
    //   this.loading = false;
    //   return;
    // }

    // Por ahora: simular envío (SMS requiere Twilio en Supabase Dashboard)
    await new Promise(r => setTimeout(r, 500));
    this.step = 'otp';
    this.startCooldown();
    this.loading = false;
  }

  async verifyOtp(): Promise<void> {
    if (this.otp.length !== 6) return;
    this.loading = true;
    this.error   = '';
    try {
      // OTP real (descomentar cuando Twilio esté configurado):
      // const { error } = await supabase.auth.verifyOtp({
      //   phone: '+52' + this.phone.replace(/\D/g, ''),
      //   token: this.otp,
      //   type: 'sms',
      // });
      // if (error) throw error;

      // Por ahora: cualquier código de 6 dígitos pasa (demo)
      await new Promise(r => setTimeout(r, 500));
      this.router.navigate(['/portal']);
    } catch {
      this.error = 'Código incorrecto o expirado. Intenta de nuevo.';
    } finally {
      this.loading = false;
    }
  }

  async resend(): Promise<void> {
    if (this.resendCooldown > 0) return;
    this.otp   = '';
    this.error = '';
    // await supabase.auth.signInWithOtp({ phone: '+52' + this.phone.replace(/\D/g, '') });
    this.startCooldown();
  }

  back(): void {
    this.step         = 'phone';
    this.otp          = '';
    this.error        = '';
    this.foundPatient = null;
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.resendCooldown = 0;
  }

  onOtpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.otp    = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = this.otp;
    if (this.otp.length === 6) this.verifyOtp();
  }

  onPhoneInput(event: Event): void {
    const input  = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 10);
    this.phone   = digits;
    input.value  = digits;
  }

  get formattedPhone(): string {
    const d = this.phone.replace(/\D/g, '');
    if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
    return this.phone;
  }

  get firstNamePatient(): string {
    return this.foundPatient?.full_name.split(' ')[0] ?? '';
  }

  private startCooldown(): void {
    this.resendCooldown = 30;
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0 && this.cooldownTimer) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
      }
    }, 1000);
  }
}
