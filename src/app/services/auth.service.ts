import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';
import { StaffUser } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.client;

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$: Observable<User | null> = this.userSubject.asObservable();

  staffProfile = signal<StaffUser | null>(null);
  isLoadingProfile = signal(true);

  constructor() {
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.userSubject.next(session?.user ?? null);
      if (session?.user) {
        this.loadStaffProfile(session.user.id);
      } else {
        this.isLoadingProfile.set(false);
      }
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.userSubject.next(session?.user ?? null);
      if (session?.user) {
        this.loadStaffProfile(session.user.id);
      } else {
        this.staffProfile.set(null);
        this.isLoadingProfile.set(false);
      }
    });
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  async loadStaffProfile(userId: string): Promise<void> {
    this.isLoadingProfile.set(true);
    const { data, error } = await this.supabase
      .from('staff_users')
      .select('*')
      .eq('id_usuario', userId)
      .single();
    if (!error && data) {
      this.staffProfile.set(data as StaffUser);
    }
    this.isLoadingProfile.set(false);
  }

  async login(email: string, pass: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  }

  async register(email: string, pass: string, displayName?: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
    return data;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this.staffProfile.set(null);
  }

  async resetPassword(email: string) {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    return data;
  }
}
