-- V2: Full schema rebuild for Optim Dental AI Stoma
-- Drop old tables (order matters for foreign keys)
DROP TABLE IF EXISTS public.diagnoses CASCADE;
DROP TABLE IF EXISTS public.xray_uploads CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Clinics / Cabinete dentare
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  county TEXT,
  phone TEXT,
  email TEXT,
  cui TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors / Medici
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  specialization TEXT DEFAULT 'generalist',
  license_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients / Pacienti
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  allergies TEXT,
  medical_history TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- X-Rays / Radiografii
CREATE TABLE public.xrays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id),
  file_url TEXT NOT NULL,
  file_name TEXT,
  xray_type TEXT NOT NULL DEFAULT 'panoramic_opg',
  notes TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW()
);

-- AI Analyses / Rezultate analiza AI
CREATE TABLE public.ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  xray_id UUID NOT NULL REFERENCES public.xrays(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  detection_results JSONB,
  annotated_image_url TEXT,
  diagnostic_summary TEXT,
  findings JSONB DEFAULT '[]'::jsonb,
  plan_odontal JSONB,
  plan_parodontal JSONB,
  plan_protetic JSONB,
  plan_chirurgical JSONB,
  plan_endodontic JSONB,
  plan_ortodontic JSONB,
  treatment_priority JSONB,
  estimated_sessions INTEGER,
  recommendations JSONB,
  confidence_score FLOAT,
  disclaimer TEXT DEFAULT 'Acest rezultat este generat de AI și are caracter informativ. Nu înlocuiește diagnosticul profesional al medicului stomatolog.',
  status TEXT DEFAULT 'processing',
  doctor_notes TEXT,
  doctor_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dental Chart / Odontograma
CREATE TABLE public.dental_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.ai_analyses(id) ON DELETE CASCADE,
  tooth_number INTEGER NOT NULL,
  condition TEXT,
  severity TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xrays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_charts ENABLE ROW LEVEL SECURITY;

-- Clinics: doctors can see their own clinic
CREATE POLICY "Doctors see own clinic" ON public.clinics
  FOR ALL USING (id IN (SELECT clinic_id FROM public.doctors WHERE user_id = auth.uid()));

-- Doctors: users can see their own doctor record
CREATE POLICY "Users see own doctor record" ON public.doctors
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own doctor record" ON public.doctors
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users insert own doctor record" ON public.doctors
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Patients: doctors see their own patients
CREATE POLICY "Doctors see own patients" ON public.patients
  FOR ALL USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

-- Xrays: doctors see their own xrays
CREATE POLICY "Doctors see own xrays" ON public.xrays
  FOR ALL USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

-- AI Analyses: doctors see their own analyses
CREATE POLICY "Doctors see own analyses" ON public.ai_analyses
  FOR ALL USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

-- Dental Charts: via patient ownership
CREATE POLICY "Doctors see own dental charts" ON public.dental_charts
  FOR ALL USING (patient_id IN (
    SELECT id FROM public.patients WHERE doctor_id IN (
      SELECT id FROM public.doctors WHERE user_id = auth.uid()
    )
  ));

-- Indexes
CREATE INDEX idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX idx_doctors_clinic_id ON public.doctors(clinic_id);
CREATE INDEX idx_patients_doctor_id ON public.patients(doctor_id);
CREATE INDEX idx_patients_clinic_id ON public.patients(clinic_id);
CREATE INDEX idx_xrays_patient_id ON public.xrays(patient_id);
CREATE INDEX idx_xrays_doctor_id ON public.xrays(doctor_id);
CREATE INDEX idx_ai_analyses_xray_id ON public.ai_analyses(xray_id);
CREATE INDEX idx_ai_analyses_doctor_id ON public.ai_analyses(doctor_id);
CREATE INDEX idx_dental_charts_patient_id ON public.dental_charts(patient_id);
CREATE INDEX idx_dental_charts_analysis_id ON public.dental_charts(analysis_id);

-- Auto-create clinic + doctor on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_clinic_id UUID;
  user_name TEXT;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  INSERT INTO public.clinics (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'clinic_name', 'Cabinetul meu'))
  RETURNING id INTO new_clinic_id;

  INSERT INTO public.doctors (user_id, clinic_id, first_name, last_name)
  VALUES (
    NEW.id,
    new_clinic_id,
    split_part(user_name, ' ', 1),
    COALESCE(NULLIF(split_part(user_name, ' ', 2), ''), split_part(user_name, ' ', 1))
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
