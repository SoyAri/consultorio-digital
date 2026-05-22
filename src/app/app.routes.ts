import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Inicio } from './inicio/inicio';

export const routes: Routes = [
  { path: 'inicio', component: Inicio },
  { path: 'login', component: Login },
  { path: '', redirectTo: '/inicio', pathMatch: 'full' }
];
