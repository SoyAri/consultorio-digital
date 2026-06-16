import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffUser, StaffFormMode, StaffFormData, UserRole, EMPTY_STAFF } from '../../app/models';

@Component({
  selector: 'app-staff-form-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-form-modal.html',
  styleUrl: './staff-form-modal.css',
})
export class StaffFormModal implements OnChanges {
  @Input() mode: StaffFormMode = 'create';
  @Input() staff: StaffUser | null = null;

  @Output() saved         = new EventEmitter<StaffFormData>();
  @Output() closed        = new EventEmitter<void>();
  @Output() resetPassword = new EventEmitter<string>();

  form: StaffFormData = { ...EMPTY_STAFF };
  specialtyError = '';

  get isCreate(): boolean { return this.mode === 'create'; }
  get isDoctor():  boolean { return this.form.role === 'doctor'; }

  get title(): string {
    return this.mode === 'create' ? 'Invitar nuevo miembro' : 'Editar perfil';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['staff'] || changes['mode']) {
      this.specialtyError = '';

      if (this.staff && this.mode === 'edit') {
        this.form = {
          id_usuario: this.staff.id_usuario,
          full_name:  this.staff.full_name,
          email:      this.staff.email,
          role:       this.staff.role,
          specialty:  this.staff.specialty ?? '',
        };
      } else {
        this.form = { ...EMPTY_STAFF };
      }
    }
  }

  setRole(role: UserRole): void {
    this.form.role = role;
    if (role !== 'doctor') {
      this.form.specialty = '';
      this.specialtyError = '';
    }
  }

  submit(): void {
    this.specialtyError = '';

    if (!this.form.full_name.trim() || !this.form.email.trim()) return;

    if (this.form.role === 'doctor' && !this.form.specialty.trim()) {
      this.specialtyError = 'La especialidad es requerida para doctores';
      return;
    }

    if (this.mode === 'create') {
      // ── FLUJO DE INVITACIÓN (crear) ────────────────────────────────────────
      //
      // NO se usa supabase.auth.signUp() porque eso requiere que el admin
      // introduzca la contraseña. En cambio se usa inviteUserByEmail, que
      // envía al nuevo miembro un correo con un link seguro para que él mismo
      // establezca su contraseña.
      //
      // IMPORTANTE: inviteUserByEmail requiere la SERVICE ROLE KEY (no la
      // anon key). Por seguridad, esa clave NUNCA debe estar en el frontend.
      // Debes crear una Supabase Edge Function que reciba los datos del form
      // y ejecute la invitación desde el servidor. Ejemplo de Edge Function:
      //
      //   // supabase/functions/invite-staff/index.ts
      //   import { createClient } from '@supabase/supabase-js'
      //   const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!)
      //
      //   Deno.serve(async (req) => {
      //     const { email, full_name, role, specialty } = await req.json()
      //     const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      //       data: { full_name, role, specialty }   // se guarda en auth.users.raw_user_meta_data
      //     })
      //     if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
      //     // Opcional: insertar en tabla staff_users ahora o usar un trigger en Supabase
      //     // para insertar cuando el usuario acepta la invitación (evento: user.created)
      //     return new Response(JSON.stringify({ id: data.user.id }), { status: 200 })
      //   })
      //
      // Desde este componente, la llamada sería:
      //   const res = await fetch('/functions/v1/invite-staff', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anonKey}` },
      //     body: JSON.stringify({ email, full_name, role, specialty })
      //   })
      //
      // El usuario recibirá un email con un link. Al hacer clic, Supabase lo
      // redirige a la app (configura Site URL en el Dashboard). Ahí debe haber
      // una ruta /set-password que llame a supabase.auth.updateUser({ password }).
      // ──────────────────────────────────────────────────────────────────────
      console.log('[mock] Invitación enviada a:', this.form.email);
    } else {
      // ── FLUJO DE EDICIÓN ────────────────────────────────────────────────────
      // Solo se actualizan full_name, role y specialty en la tabla staff_users.
      // El email NO se puede cambiar (Supabase no permite cambiar el email de
      // otro usuario desde el cliente; requeriría otra Edge Function con service role).
      //
      //   await supabase
      //     .from('staff_users')
      //     .update({ full_name: form.full_name, role: form.role, specialty: form.specialty })
      //     .eq('id_usuario', form.id_usuario)
      // ──────────────────────────────────────────────────────────────────────
      console.log('[mock] Perfil actualizado:', this.form.id_usuario);
    }

    this.saved.emit({ ...this.form });
    this.close();
  }

  requestReset(): void {
    // ── RESTABLECER CONTRASEÑA ────────────────────────────────────────────────
    // Desde el frontend sí se puede llamar directamente (usa la anon key):
    //   await supabase.auth.resetPasswordForEmail(email, {
    //     redirectTo: 'https://tu-dominio.com/set-password'
    //   })
    // Supabase envía un email con un link. Al hacer clic, redirige a /set-password
    // con un token en la URL. Ahí llama a supabase.auth.updateUser({ password }).
    // El componente ResetPasswordModal ya tiene el esqueleto para esto.
    // ─────────────────────────────────────────────────────────────────────────
    this.resetPassword.emit(this.staff?.email ?? this.form.email);
  }

  close(): void {
    this.form           = { ...EMPTY_STAFF };
    this.specialtyError = '';
    this.closed.emit();
  }
}
