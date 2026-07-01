import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DatabaseService } from '../../services/database.service';

// =============================================================================
// [TODO-SEGURIDAD] RESPONSABILIDAD: COMPAÑERO OTP
// Alcance: SOLO este archivo (login-paciente.ts) y login-paciente.html.
// NO tocar portal.ts, auth.guard.ts ni consulta-detalle.ts —
// esos archivos son responsabilidad de otro compañero (ver sus propios comentarios).
//
// CONFIGURACIÓN: Phone Auth con Twilio ya está habilitado en el Supabase Dashboard.
//   Solo falta implementar el código — no hay configuración adicional pendiente.
//   Para usar el cliente de Supabase inyectar: inject(SupabaseService).client
//   (SupabaseService está en src/app/services/supabase.service.ts)
//
// CONTRATO DE ENTREGA (lo que el portal espera encontrar al redirigir a /portal):
//   sessionStorage key 'patient_session' con:
//     { id_paciente: string, phone: string }
//   (solo estos dos campos — sin full_name ni otros datos PII)
//
// ── PASO 1: sendOtp() ──────────────────────────────────────────────────────
//
//   IMPLEMENTAR:
//     const { error } = await supabase.auth.signInWithOtp({
//       phone: '+52' + digits,
//       options: { channel: 'sms' },
//     });
//
//   SEGURIDAD — ANTI-ENUMERACIÓN DE CUENTAS:
//     NO buscar el paciente en la tabla `pacientes` en este paso.
//     NO verificar si el número existe o no.
//     Siempre mostrar el MISMO mensaje neutro sin importar el resultado:
//       "Si ese número está registrado, recibirás un código por SMS."
//     Esto evita que un atacante descubra qué números tienen cuenta registrada.
//
//   NO guardar nada en sessionStorage aquí.
//   NO guardar foundPatient. NO mostrar el nombre del paciente.
//
// ── PASO 2: verifyOtp() ────────────────────────────────────────────────────
//
//   IMPLEMENTAR (en este orden exacto):
//
//   1. Verificar el OTP con Supabase Auth:
//        const { error } = await supabase.auth.verifyOtp({
//          phone: '+52' + this.phone.replace(/\D/g, ''),
//          token: this.otp,
//          type: 'sms',
//        });
//        if (error) throw error;  → mostrar "Código incorrecto o expirado." (genérico)
//
//   2. OTP válido → verificar que está registrado como paciente:
//        const digits = this.phone.replace(/\D/g, '');
//        const patient = await this.db.getPacienteByPhone(digits);
//        if (!patient) {
//          await supabase.auth.signOut();
//          // Error genérico — no revelar que el número no existe en pacientes.
//          throw new Error('No se pudo completar el acceso.');
//        }
//
//   3. Guardar sesión (SOLO aquí, después del OTP exitoso):
//        sessionStorage.setItem('patient_session', JSON.stringify({
//          id_paciente: (patient as any).id_paciente,
//          phone: digits,
//          // NO incluir full_name ni otros datos — el portal los carga desde la DB
//        }));
//
//   4. navigate(['/portal'])
//
// ── PASO 3: resend() ───────────────────────────────────────────────────────
//
//   IMPLEMENTAR:
//     await supabase.auth.signInWithOtp({
//       phone: '+52' + this.phone.replace(/\D/g, ''),
//       options: { channel: 'sms' },
//     });
//
// ── HTML: login-paciente.html ─────────────────────────────────────────────
//
//   Ver comentarios [TODO-SEGURIDAD] en login-paciente.html.
//   Resumen: cambiar el saludo "¡Hola, {{ firstNamePatient }}!" por texto neutro.
//
// =============================================================================

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

    // [TODO-SEGURIDAD] REEMPLAZAR este bloque completo con OTP real de Supabase.
    // Ver el bloque de comentarios al inicio del archivo para el código correcto.
    // PUNTOS CLAVE:
    //   1. Usar supabase.auth.signInWithOtp({ phone: '+52' + digits, options: { channel: 'sms' } })
    //   2. Siempre responder con mensaje neutro — NO buscar en tabla pacientes aquí
    //   3. NO guardar en sessionStorage aquí — solo en verifyOtp() tras éxito
    //   4. NO asignar foundPatient ni mostrar el nombre del paciente
    // ──────────────────────────────────────────────── INICIO BLOQUE DEMO ──

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

    // ────────────────────────────────────────────────── FIN BLOQUE DEMO ──
  }

  async verifyOtp(): Promise<void> {
    if (this.otp.length !== 6) return;
    this.loading = true;
    this.error   = '';
    try {
      // [TODO-SEGURIDAD] REEMPLAZAR este bloque con verificación real de Supabase.
      // Ver el bloque de comentarios al inicio del archivo para el código correcto.
      // PUNTOS CLAVE:
      //   1. supabase.auth.verifyOtp({ phone: '+52' + digits, token: this.otp, type: 'sms' })
      //   2. Si error → throw (mensaje genérico, no detallar el error de Supabase)
      //   3. Buscar paciente con getPacienteByPhone(digits)
      //   4. Si no existe en tabla → supabase.auth.signOut() + throw (error genérico)
      //   5. sessionStorage.setItem AQUÍ (después del OTP exitoso, no antes)
      //   6. NO guardar full_name en sessionStorage
      // ──────────────────────────────────────────────── INICIO BLOQUE DEMO ──

      // OTP real (descomentar cuando Twilio esté configurado):
      // const { error } = await supabase.auth.verifyOtp({
      //   phone: '+52' + this.phone.replace(/\D/g, ''),
      //   token: this.otp,
      //   type: 'sms',
      // });
      // if (error) throw error;

      // Por ahora: cualquier código de 6 dígitos pasa (demo)
      await new Promise(r => setTimeout(r, 500));

      // ────────────────────────────────────────────────── FIN BLOQUE DEMO ──

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
    // [TODO-SEGURIDAD] Reemplazar con OTP real:
    // await supabase.auth.signInWithOtp({ phone: '+52' + this.phone.replace(/\D/g, ''), options: { channel: 'sms' } });
    //
    // IMPORTANTE: NO eliminar el this.startCooldown() de abajo.
    // El cooldown de 30s es necesario para evitar SMS bombing (spam de mensajes
    // a un número de teléfono). Supabase también tiene rate limiting propio,
    // pero el cooldown en UI es una capa adicional.
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

  // [TODO-SEGURIDAD] NO usar este getter en el HTML del paso OTP.
  // Mostrar el nombre antes de verificar el OTP revela que ese número existe
  // en el sistema → enumeración de cuentas (account enumeration).
  // Ver comentario en login-paciente.html para el cambio concreto en la UI.
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
