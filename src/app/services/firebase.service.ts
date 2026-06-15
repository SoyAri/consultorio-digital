import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  private authInstance: Auth;
  private firestoreInstance: Firestore;
  private storageInstance: FirebaseStorage;

  constructor() {
    // Inicializar Firebase con la configuración del entorno actual
    this.app = initializeApp(environment.firebase);
    this.authInstance = getAuth(this.app);
    this.firestoreInstance = getFirestore(this.app);
    this.storageInstance = getStorage(this.app);
  }

  getApp(): FirebaseApp {
    return this.app;
  }

  getAuth(): Auth {
    return this.authInstance;
  }

  getFirestore(): Firestore {
    return this.firestoreInstance;
  }

  getStorage(): FirebaseStorage {
    return this.storageInstance;
  }
}
