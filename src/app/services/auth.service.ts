import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private firebaseService = inject(FirebaseService);
  private auth: Auth;
  
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$: Observable<User | null> = this.userSubject.asObservable();

  constructor() {
    this.auth = this.firebaseService.getAuth();
    
    // Escuchar cambios en el estado de autenticación
    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);
    });
  }

  // Obtener el usuario actual síncronamente
  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  // Iniciar sesión con email y contraseña
  login(email: string, pass: string) {
    return signInWithEmailAndPassword(this.auth, email, pass);
  }

  // Registrar un nuevo usuario
  register(email: string, pass: string, displayName?: string) {
    return createUserWithEmailAndPassword(this.auth, email, pass)
      .then(async (userCredential) => {
        if (displayName && userCredential.user) {
          await updateProfile(userCredential.user, { displayName });
        }
        return userCredential;
      });
  }

  // Cerrar sesión
  logout() {
    return signOut(this.auth);
  }

  // Recuperación de contraseña
  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }
}
