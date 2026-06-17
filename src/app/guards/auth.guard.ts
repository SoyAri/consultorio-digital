import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const staffGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService).client;
  const router   = inject(Router);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return router.createUrlTree(['/login/equipo']);
  }
  return true;
};

// Evita que un usuario ya autenticado entre al login de staff.
// Si hay sesión activa, lo manda directo al dashboard.
export const guestGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService).client;
  const router   = inject(Router);

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    return router.createUrlTree(['/consultorio']);
  }
  return true;
};

export const patientGuard: CanActivateFn = () => {
  const router = inject(Router);
  const session = sessionStorage.getItem('patient_session');
  if (!session) {
    return router.createUrlTree(['/login/paciente']);
  }
  return true;
};
