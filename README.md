<div align="center">

# Consultorio Digital DWI

### Plataforma SaaS diseñada para la gestión eficiente y modernización de clínicas dentales

[![Angular](https://img.shields.io/badge/Frontend-Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

<br/>

> Este sistema centraliza la administración de citas, historiales clínicos y el acceso a la información  
> tanto para el personal médico como para los pacientes.

</div>

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | [Angular](https://angular.dev/) |
| **Backend / Base de Datos** | [Supabase](https://supabase.com/) |

> Nota: El stack de backend se encuentra actualmente en fase de definición.

---

## Estructura del Proyecto

```
src/
├── app/                          ← Páginas y lógica de cada módulo
│   ├── inicio/                   ← Landing page (/)
│   ├── login/
│   │   ├── login-paciente/       ← Autenticación OTP WhatsApp (/login/paciente)
│   │   └── login-equipo/         ← Autenticación de personal (/login/equipo)
│   ├── portal/                   ← Portal del paciente (/portal)
│   │   └── consulta-detalle/     ← Detalle de consulta (/portal/consultas/:id)
│   ├── consultorio/              ← Dashboard administrativo (/consultorio)
│   ├── agendar/                  ← Calendario de citas (/agendar)
│   ├── pacientes/                ← Módulo de pacientes
│   │   ├── directorio/           ← Listado (/pacientes)
│   │   ├── perfil/               ← Perfil de usuario (/pacientes/:id)
│   │   ├── historial/            ← Historial clínico (/pacientes/:id/historial)
│   │   └── expediente/           ← Expediente médico (/pacientes/:id/consultas/:id)
│   └── configuracion/            ← Configuración y control de roles (/configuracion)
└── components/                   ← Componentes compartidos (UI)
    └── navbar/                   ← Barra de navegación global
```

---

## Esquema de Rutas

### Accesos Públicos

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Landing page y presentación de servicios | Público general |
| `/login/paciente` | Autenticación OTP vía WhatsApp Meta | Pacientes |
| `/login/equipo` | Autenticación mediante credenciales | Personal médico y administrativo |

### Portal del Paciente

| Ruta | Descripción |
|------|-------------|
| `/portal` | Panel principal: próxima cita, agendamiento e historial |
| `/portal/consultas/:idConsulta` | Vista detallada de consultas previas (solo lectura) |

### Módulo del Consultorio (Personal)

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/consultorio` | Panel de control inicial | Médico, Recepción |
| `/agendar` | Gestión interactiva del calendario de citas | Médico, Recepción |
| `/pacientes` | Directorio general con motor de búsqueda | Médico, Recepción |
| `/pacientes/:id` | Perfil detallado del paciente | Médico, Recepción |
| `/pacientes/:id/historial` | Registro cronológico de consultas | Médico, Recepción |
| `/pacientes/:id/consultas/:idConsulta` | Expediente clínico (con permisos de edición limitados) | Exclusivo Médico |
| `/configuracion` | Administración del sistema y asignación de permisos | Administrador |

---

## Estrategia de Control de Versiones (GitHub Flow)

El desarrollo se organiza mediante ramas de características (features). Se requiere la creación de un Pull Request (PR) hacia la rama `main` al concluir el trabajo.

| Rama | Módulo Correspondiente |
|------|------------------------|
| `feat/landing-page` | Landing page (`/`) |
| `feat/login-paciente` | Autenticación OTP WhatsApp (`/login/paciente`) |
| `feat/login-equipo` | Autenticación de personal (`/login/equipo`) |
| `feat/portal-paciente` | Portal del paciente (`/portal`) |
| `feat/dashboard-consultorio` | Dashboard administrativo (`/consultorio`) |
| `feat/agendar` | Calendario de citas (`/agendar`) |
| `feat/directorio-pacientes` | Directorio y perfiles (`/pacientes`) |
| `feat/expediente-consulta` | Expediente clínico (`/pacientes/:id/consultas/:id`) |
| `feat/configuracion` | Configuración y control de roles (`/configuracion`) |
| `feat/global-navbar` | Navegación global (`src/components/navbar`) |
| `feat/auth-guards` | Implementación de protección de rutas por rol |

### Directrices para la Creación de Ramas

```bash
# 1. Posicionarse en la rama principal y sincronizar cambios
git checkout main
git pull origin main

# 2. Crear una nueva rama para la característica a desarrollar
git checkout -b feat/<nombre-caracteristica>

# 3. Desarrollar e integrar los cambios locales
git add .
git commit -m "feat: descripción concisa de la actualización"

# 4. Publicar la rama en el repositorio remoto
git push -u origin feat/<nombre-caracteristica>

# 5. Generar el Pull Request correspondiente hacia la rama main en GitHub
```

> **Normativa de Integración:** No se permiten integraciones directas (push) a la rama `main`. Todas las actualizaciones deben ser revisadas mediante un Pull Request.

---

## Módulos y Funcionalidades Principales

El sistema opera bajo una arquitectura de **control de acceso basado en roles**, garantizando la seguridad y delimitación de funciones en las distintas áreas de la clínica:

### Presentación Institucional (Landing Page)
Exposición de los servicios clínicos ofrecidos y punto de acceso centralizado a la plataforma.

### Portal de Pacientes
Interfaz orientada al usuario final, permitiendo el inicio de sesión seguro y la gestión autónoma de información y citas.

### Módulo Administrativo (Recepción)
Conjunto de herramientas diseñadas para optimizar la creación, reprogramación y administración de la agenda clínica.

### Módulo Médico (Especialistas)
Acceso al itinerario diario, registro de nuevas evaluaciones, seguimiento de tratamientos y gestión integral del historial clínico de los pacientes.

---

## Entorno de Desarrollo y Despliegue

> Proyecto en fase de estructuración inicial. La base de dependencias se expandirá conforme evolucione el desarrollo.

**1. Clonación del repositorio:**

```bash
git clone https://github.com/SoyAri/consultorio-digitaldwi.git
```

**2. Instalación de dependencias:**

```bash
npm install
```

**3. Ejecución del entorno de desarrollo:**

```bash
ng serve
```

La aplicación estará disponible en `http://localhost:4200/`. El entorno cuenta con recarga activa de módulos.

**4. Creación de nuevos componentes:**

```bash
# Componente asociado a una característica (en src/app/)
ng generate component nombre-componente

# Componente compartido (implementación manual en src/components/)
```

**5. Compilación para producción:**

```bash
ng build
```

**6. Ejecución de pruebas automatizadas:**

```bash
ng test
```
