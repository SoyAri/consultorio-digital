<div align="center">

# 🦷 Consultorio Digital DWI

### Plataforma SaaS diseñada para la gestión eficiente y modernización de clínicas dentales

[![Angular](https://img.shields.io/badge/Frontend-Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

<br/>

> Este sistema centraliza la administración de citas, historiales clínicos y el acceso a la información  
> tanto para el personal médico como para los pacientes.

</div>

---

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | [Angular](https://angular.dev/) |
| **Backend / Base de Datos** | [Supabase](https://supabase.com/) |

> ⚠️ Stack de backend actualmente en **fase de definición**.

---

## 📁 Estructura del Proyecto

```
src/
├── app/                          ← Páginas y lógica de cada feature
│   ├── inicio/                   ← Landing page (/)
│   ├── login/
│   │   ├── login-paciente/       ← Login OTP WhatsApp (/login/paciente)
│   │   └── login-equipo/         ← Login usuario/contraseña (/login/equipo)
│   ├── portal/                   ← Portal del paciente (/portal)
│   │   └── consulta-detalle/     ← Detalle de consulta (/portal/consultas/:id)
│   ├── consultorio/              ← Dashboard del staff (/consultorio)
│   ├── agendar/                  ← Calendario de citas (/agendar)
│   ├── pacientes/                ← Módulo de pacientes
│   │   ├── directorio/           ← Listado (/pacientes)
│   │   ├── perfil/               ← Perfil (/pacientes/:id)
│   │   ├── historial/            ← Historial (/pacientes/:id/historial)
│   │   └── expediente/           ← Expediente (/pacientes/:id/consultas/:id)
│   └── configuracion/            ← Configuración y roles (/configuracion)
└── components/                   ← Componentes reutilizables (shared UI)
    └── navbar/                   ← Barra de navegación global
```

---

## 🗺️ Esquema de Rutas

### Accesos Públicos

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Landing page con botones CTA | Todos |
| `/login/paciente` | Login OTP vía WhatsApp Meta | Pacientes |
| `/login/equipo` | Login usuario/contraseña | Doctor, Secretaria, Admin |

### Portal del Paciente

| Ruta | Descripción |
|------|-------------|
| `/portal` | Panel principal: próxima cita, agendar, historial |
| `/portal/consultas/:idConsulta` | Vista de solo lectura de una consulta pasada |

### Módulo del Consultorio (Staff)

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/consultorio` | Dashboard de bienvenida | Doctor, Secretaria |
| `/agendar` | Calendario interactivo de citas | Doctor, Secretaria |
| `/pacientes` | Directorio con buscador | Doctor, Secretaria |
| `/pacientes/:id` | Perfil del paciente | Doctor, Secretaria |
| `/pacientes/:id/historial` | Línea de tiempo de consultas | Doctor, Secretaria |
| `/pacientes/:id/consultas/:idConsulta` | Expediente médico (editable para Doctor) | Solo Doctor |
| `/configuracion` | Alta de usuarios y asignación de roles | Admin / Doctor dueño |

---

## 🌿 Ramas del Proyecto (GitHub Flow)

Cada sección tiene su propia rama de feature. Se trabaja sobre ella y se hace PR a `main` al terminar.

| Rama | Sección |
|------|---------|
| `feat/landing-page` | Landing page (`/`) |
| `feat/login-paciente` | Login OTP WhatsApp (`/login/paciente`) |
| `feat/login-equipo` | Login usuario/contraseña (`/login/equipo`) |
| `feat/portal-paciente` | Portal del paciente (`/portal`) |
| `feat/dashboard-consultorio` | Dashboard del staff (`/consultorio`) |
| `feat/agendar` | Calendario de citas (`/agendar`) |
| `feat/directorio-pacientes` | Directorio y perfil (`/pacientes`) |
| `feat/expediente-consulta` | Expediente médico (`/pacientes/:id/consultas/:id`) |
| `feat/configuracion` | Configuración y roles (`/configuracion`) |
| `feat/global-navbar` | Navbar compartida (`src/components/navbar`) |
| `feat/auth-guards` | Guards de autenticación por rol |

### Cómo crear una nueva rama (GitHub Flow)

```bash
# 1. Asegúrate de estar en main y actualizado
git checkout main
git pull origin main

# 2. Crea la rama para tu feature
git checkout -b feat/<nombre-seccion>

# 3. Desarrolla y commitea tu trabajo
git add .
git commit -m "feat: descripción del cambio"

# 4. Sube la rama a GitHub
git push -u origin feat/<nombre-seccion>

# 5. Abre un Pull Request hacia main en GitHub
```

> **Regla de oro:** Nunca se hace push directo a `main`. Todo cambio entra por Pull Request.

---

## ⚙️ Módulos y Características

El sistema está diseñado con un **control de acceso basado en roles** para cubrir todas las áreas de la clínica:

### 🌐 Landing Page
Presentación general de los servicios de la clínica y punto de entrada al sistema.

### 👤 Portal de Pacientes
Sección integrada en la landing page para que los pacientes inicien sesión y consulten su información.

### 🗂️ Módulo Administrativo — Secretaría
Herramientas optimizadas para la creación, cancelación y gestión de la agenda de citas.

### 🩺 Módulo Médico — Doctores
Acceso a la agenda diaria, registro de nuevas visitas, evolución de tratamientos y control del historial clínico detallado de cada paciente.

---

## 🛠️ Entorno de Desarrollo

> Proyecto en **fase inicial de estructuración**. Las dependencias irán creciendo conforme avance el desarrollo.

**1. Clona el repositorio:**

```bash
git clone https://github.com/SoyAri/consultorio-digitaldwi.git
```

**2. Instala dependencias:**

```bash
npm install
```

**3. Levanta el servidor de desarrollo:**

```bash
ng serve
```

Navega a `http://localhost:4200/`. La aplicación se recarga automáticamente al modificar archivos.

**4. Generar un nuevo componente:**

```bash
# Componente de feature (dentro de src/app/)
ng generate component nombre-componente

# Componente reutilizable (crear manualmente en src/components/)
```

**5. Build de producción:**

```bash
ng build
```

**6. Ejecutar tests:**

```bash
ng test
```
