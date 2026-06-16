import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User, AuthError } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.client;
  
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$: Observable<User | null> = this.userSubject.asObservable();

  constructor() {
    // Check initial session
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.userSubject.next(session?.user ?? null);
    });

    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.userSubject.next(session?.user ?? null);
    });
  }

  // Get current user synchronously
  get currentUser(): User | null {
    return this.userSubject.value;
  }

  // Sign in with email and password
  async login(email: string, pass: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  }

  // Register a new user
  async register(email: string, pass: string, displayName?: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          display_name: displayName,
        }
      }
    });
    if (error) throw error;
    return data;
  }

  // Sign out
  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  // Password recovery
  async resetPassword(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  }
}
