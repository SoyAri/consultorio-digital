import { Routes } from '@angular/router';

export const routes: Routes = [
  // ── Públicas ───────────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./inicio/inicio').then(m => m.Inicio),
  },
  {
    path: 'login/paciente',
    loadComponent: () => import('./login/login-paciente/login-paciente').then(m => m.LoginPaciente),
  },
  {
    path: 'login/equipo',
    loadComponent: () => import('./login/login-equipo/login-equipo').then(m => m.LoginEquipo),
  },

  // ── Portal del Paciente ────────────────────────────────────────────────────
  {
    path: 'portal',
    children: [
      {
        path: '',
        loadComponent: () => import('./portal/portal').then(m => m.Portal),
      },
      {
        path: 'consultas/:idConsulta',
        loadComponent: () => import('./portal/consulta-detalle/consulta-detalle').then(m => m.ConsultaDetalle),
      },
    ],
  },

  // ── Módulo del Consultorio (Staff) ─────────────────────────────────────────
  {
    path: 'consultorio',
    loadComponent: () => import('./consultorio/consultorio').then(m => m.Consultorio),
  },
  {
    path: 'agendar',
    loadComponent: () => import('./agendar/agendar').then(m => m.Agendar),
  },
  {
    path: 'pacientes',
    children: [
      {
        path: '',
        loadComponent: () => import('./pacientes/directorio/directorio').then(m => m.Directorio),
      },
      {
        path: ':id',
        children: [
          {
            path: '',
            loadComponent: () => import('./pacientes/perfil/perfil').then(m => m.Perfil),
          },
          {
            path: 'historial',
            loadComponent: () => import('./pacientes/historial/historial').then(m => m.Historial),
          },
          {
            path: 'consultas/:idConsulta',
            loadComponent: () => import('./pacientes/expediente/expediente').then(m => m.Expediente),
          },
        ],
      },
    ],
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./configuracion/configuracion').then(m => m.Configuracion),
  },

  // ── Fallback ───────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
