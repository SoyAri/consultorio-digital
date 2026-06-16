import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

type LoginStep = 'phone' | 'otp';

interface MockPatient {
  id_paciente: string;
  full_name: string;
  phone: string;
}

// ── Datos simulados (reemplazar con consulta a Supabase) ──────────────────────
// TODO: supabase.from('pacientes').select('id_paciente, full_name, phone').eq('phone', phone).single()
const MOCK_PATIENTS: MockPatient[] = [
  { id_paciente: 'pac-001', full_name: 'Ana García López',       phone: '2231234567' },
  { id_paciente: 'pac-002', full_name: 'Carlos Ruiz Herrera',    phone: '2239876543' },
  { id_paciente: 'pac-003', full_name: 'María Torres Vega',      phone: '2231112233' },
  { id_paciente: 'pac-004', full_name: 'José Martínez Díaz',     phone: '2234445566' },
  { id_paciente: 'pac-005', full_name: 'Sofía Reyes Castillo',   phone: '2237778899' },
  { id_paciente: 'pac-006', full_name: 'Roberto Hernández Luna', phone: '2230001122' },
];

@Component({
  selector: 'app-login-paciente',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-paciente.html',
  styleUrl: './login-paciente.css',
})
export class LoginPaciente implements OnDestroy {
  step: LoginStep = 'phone';

  phone = '';
  otp   = '';

  foundPatient: MockPatient | null = null;
  loading         = false;
  error           = '';
  resendCooldown  = 0;

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private router: Router) {}

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  async sendOtp(): Promise<void> {
    const digits = this.phone.replace(/\D/g, '');
    if (digits.length !== 10) return;
    this.loading = true;
    this.error   = '';

    // 1. Buscar paciente en el sistema por número de teléfono
    const patient = MOCK_PATIENTS.find(p => p.phone === digits);

    if (!patient) {
      this.error   = 'No encontramos ningún paciente registrado con ese número.';
      this.loading = false;
      return;
    }

    this.foundPatient = patient;

    try {
      // TODO: await supabase.auth.signInWithOtp({ phone: '+52' + digits })
      // Requiere Twilio (o proveedor SMS) configurado en Supabase Dashboard
      // Authentication > Providers > Phone
      console.log('[mock] OTP enviado a +52' + digits);
      await new Promise(r => setTimeout(r, 800));
      this.step = 'otp';
      this.startCooldown();
    } catch {
      this.error = 'No se pudo enviar el código. Intenta de nuevo.';
    } finally {
      this.loading = false;
    }
  }

  async verifyOtp(): Promise<void> {
    if (this.otp.length !== 6) return;
    this.loading = true;
    this.error   = '';
    try {
      // TODO: const { data, error } = await supabase.auth.verifyOtp({
      //   phone: '+52' + this.phone.replace(/\D/g, ''),
      //   token: this.otp,
      //   type: 'sms',
      // })
      console.log('[mock] OTP verificado:', this.otp, '→ paciente:', this.foundPatient?.full_name);
      await new Promise(r => setTimeout(r, 800));
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
    // TODO: await supabase.auth.signInWithOtp({ phone: '+52' + this.phone.replace(/\D/g, '') })
    console.log('[mock] OTP reenviado');
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
