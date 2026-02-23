-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- Profiles table (linked to Supabase Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  clinic_name TEXT,
  specialization TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  medical_history TEXT,
  allergies TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- X-ray uploads table
CREATE TABLE public.xray_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  xray_type TEXT NOT NULL DEFAULT 'panoramic',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Diagnoses table
CREATE TABLE public.diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  xray_id UUID NOT NULL REFERENCES public.xray_uploads(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_assessment TEXT,
  confidence_score NUMERIC(3,2),
  odontal_findings JSONB DEFAULT '[]'::jsonb,
  parodontal_findings JSONB DEFAULT '[]'::jsonb,
  protetic_findings JSONB DEFAULT '[]'::jsonb,
  chirurgical_findings JSONB DEFAULT '[]'::jsonb,
  treatment_plan JSONB DEFAULT '[]'::jsonb,
  urgency_level TEXT DEFAULT 'normal',
  raw_ai_response JSONB,
  doctor_approved BOOLEAN DEFAULT FALSE,
  doctor_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xray_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Patients policies
CREATE POLICY "Doctors can view own patients" ON public.patients FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can insert patients" ON public.patients FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors can update own patients" ON public.patients FOR UPDATE USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can delete own patients" ON public.patients FOR DELETE USING (auth.uid() = doctor_id);

-- X-ray uploads policies
CREATE POLICY "Doctors can view own xrays" ON public.xray_uploads FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can insert xrays" ON public.xray_uploads FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors can delete own xrays" ON public.xray_uploads FOR DELETE USING (auth.uid() = doctor_id);

-- Diagnoses policies
CREATE POLICY "Doctors can view own diagnoses" ON public.diagnoses FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can insert diagnoses" ON public.diagnoses FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors can update own diagnoses" ON public.diagnoses FOR UPDATE USING (auth.uid() = doctor_id);

-- Create indexes
CREATE INDEX idx_patients_doctor_id ON public.patients(doctor_id);
CREATE INDEX idx_xray_uploads_patient_id ON public.xray_uploads(patient_id);
CREATE INDEX idx_xray_uploads_doctor_id ON public.xray_uploads(doctor_id);
CREATE INDEX idx_diagnoses_xray_id ON public.diagnoses(xray_id);
CREATE INDEX idx_diagnoses_patient_id ON public.diagnoses(patient_id);
CREATE INDEX idx_diagnoses_doctor_id ON public.diagnoses(doctor_id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
