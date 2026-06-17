-- ============================================================
-- CONSULTORIO DIGITAL — Schema inicial
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. STAFF_USERS (vinculado a auth.users) ─────────────────
CREATE TABLE IF NOT EXISTS public.staff_users (
  id_usuario   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  role         TEXT NOT NULL CHECK (role IN ('doctor', 'admin')),
  specialty    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. PACIENTES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pacientes (
  id_paciente               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name                 TEXT NOT NULL,
  birth_date                DATE,
  phone                     TEXT,
  email                     TEXT,
  address                   TEXT DEFAULT '',
  gender                    TEXT DEFAULT '',
  blood_type                TEXT DEFAULT '',
  weight_kg                 TEXT DEFAULT '',
  height_cm                 TEXT DEFAULT '',
  -- Alergias
  has_allergies             BOOLEAN DEFAULT FALSE,
  allergies_medications     TEXT DEFAULT '',
  allergies_materials       TEXT DEFAULT '',
  allergies_other           TEXT DEFAULT '',
  -- Antecedentes sistémicos
  has_chronic_conditions    BOOLEAN DEFAULT FALSE,
  chronic_conditions        TEXT DEFAULT '',
  takes_medications         BOOLEAN DEFAULT FALSE,
  current_medications       TEXT DEFAULT '',
  has_previous_surgeries    BOOLEAN DEFAULT FALSE,
  surgeries_detail          TEXT DEFAULT '',
  is_pregnant               TEXT DEFAULT 'na' CHECK (is_pregnant IN ('si', 'no', 'na')),
  smokes                    BOOLEAN DEFAULT FALSE,
  drinks_alcohol            BOOLEAN DEFAULT FALSE,
  -- Antecedentes dentales
  had_dental_treatment      BOOLEAN DEFAULT FALSE,
  last_dental_visit         DATE,
  dental_treatments_history TEXT DEFAULT '',
  has_dental_sensitivity    BOOLEAN DEFAULT FALSE,
  sensitivity_triggers      TEXT DEFAULT '',
  has_braces_history        BOOLEAN DEFAULT FALSE,
  has_prosthetics           BOOLEAN DEFAULT FALSE,
  prosthetics_detail        TEXT DEFAULT '',
  -- Motivo y notas
  chief_complaint           TEXT DEFAULT '',
  notes                     TEXT DEFAULT '',
  -- Asignación
  assigned_doctor_id        UUID REFERENCES public.staff_users(id_usuario) ON DELETE SET NULL,
  clinic_status             TEXT DEFAULT 'en_tratamiento'
                              CHECK (clinic_status IN ('en_tratamiento', 'dado_de_alta', 'inactivo')),
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. CITAS (Appointments) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.citas (
  id_cita       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_paciente   UUID REFERENCES public.pacientes(id_paciente) ON DELETE CASCADE,
  id_doctor     UUID REFERENCES public.staff_users(id_usuario) ON DELETE SET NULL,
  patient_name  TEXT NOT NULL,
  doctor_name   TEXT NOT NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  reason        TEXT DEFAULT '',
  notes         TEXT DEFAULT '',
  status        TEXT DEFAULT 'pendiente'
                  CHECK (status IN ('pendiente', 'en_curso', 'completada', 'cancelada')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. CONSULTAS (Medical records) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.consultas (
  id_historial    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_paciente     UUID REFERENCES public.pacientes(id_paciente) ON DELETE CASCADE,
  id_doctor       UUID REFERENCES public.staff_users(id_usuario) ON DELETE SET NULL,
  id_cita         UUID REFERENCES public.citas(id_cita) ON DELETE SET NULL,
  patient_name    TEXT NOT NULL,
  doctor_name     TEXT NOT NULL,
  visit_date      DATE NOT NULL,
  chief_complaint TEXT DEFAULT '',
  diagnosis       TEXT DEFAULT '',
  treatment       TEXT DEFAULT '',
  observations    TEXT DEFAULT '',
  prescriptions   JSONB DEFAULT '[]',
  next_visit_date DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas   ENABLE ROW LEVEL SECURITY;

-- staff_users: solo staff autenticado puede leer/editar
CREATE POLICY "staff_select" ON public.staff_users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "staff_update_own" ON public.staff_users
  FOR UPDATE TO authenticated USING (auth.uid() = id_usuario);

-- pacientes: cualquier staff autenticado
CREATE POLICY "pacientes_select" ON public.pacientes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "pacientes_insert" ON public.pacientes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pacientes_update" ON public.pacientes
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "pacientes_delete" ON public.pacientes
  FOR DELETE TO authenticated USING (true);

-- citas: cualquier staff autenticado
CREATE POLICY "citas_select" ON public.citas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "citas_insert" ON public.citas
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "citas_update" ON public.citas
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "citas_delete" ON public.citas
  FOR DELETE TO authenticated USING (true);

-- consultas: cualquier staff autenticado
CREATE POLICY "consultas_select" ON public.consultas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "consultas_insert" ON public.consultas
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "consultas_update" ON public.consultas
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "consultas_delete" ON public.consultas
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- TRIGGER: auto-crear staff_users cuando se acepta una invitación
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.staff_users (id_usuario, full_name, email, role, specialty)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
    NEW.raw_user_meta_data->>'specialty'
  )
  ON CONFLICT (id_usuario) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================
-- ÍNDICES útiles
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_citas_scheduled  ON public.citas(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_citas_doctor     ON public.citas(id_doctor);
CREATE INDEX IF NOT EXISTS idx_citas_paciente   ON public.citas(id_paciente);
CREATE INDEX IF NOT EXISTS idx_pacientes_phone  ON public.pacientes(phone);
CREATE INDEX IF NOT EXISTS idx_consultas_pac    ON public.consultas(id_paciente);
