export interface Clinic {
  id: string
  name: string
  address: string | null
  city: string | null
  county: string | null
  phone: string | null
  email: string | null
  cui: string | null
  created_at: string
}

export interface Doctor {
  id: string
  user_id: string
  clinic_id: string | null
  first_name: string
  last_name: string
  specialization: string | null
  license_number: string | null
  created_at: string
}

export interface Patient {
  id: string
  clinic_id: string | null
  doctor_id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  phone: string | null
  email: string | null
  allergies: string | null
  medical_history: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Xray {
  id: string
  patient_id: string
  doctor_id: string
  clinic_id: string | null
  file_url: string
  file_name: string | null
  xray_type: string
  notes: string | null
  upload_date: string
}

export interface AiAnalysis {
  id: string
  xray_id: string
  doctor_id: string
  detection_results: Record<string, unknown> | null
  annotated_image_url: string | null
  diagnostic_summary: string | null
  findings: ToothFinding[] | null
  plan_odontal: TreatmentSection | null
  plan_parodontal: TreatmentSection | null
  plan_protetic: TreatmentSection | null
  plan_chirurgical: TreatmentSection | null
  plan_endodontic: TreatmentSection | null
  plan_ortodontic: TreatmentSection | null
  treatment_priority: Prioritization | null
  estimated_sessions: number | null
  recommendations: string[] | null
  confidence_score: number | null
  disclaimer: string
  status: string
  doctor_notes: string | null
  doctor_approved: boolean
  created_at: string
  updated_at: string
}

export interface DentalChart {
  id: string
  patient_id: string
  analysis_id: string | null
  tooth_number: number
  condition: string | null
  severity: string | null
  notes: string | null
  created_at: string
}

export interface ToothFinding {
  dinte: string
  conditie: string
  severitate: string
  observatii: string
}

export interface TreatmentItem {
  dinte?: string
  zona?: string
  procedura: string
  material_sugerat?: string
  tip_lucrare?: string
  indicatie?: string
  urgenta?: string
  frecventa?: string
  nr_canale_estimat?: string
  observatii?: string
}

export interface TreatmentSection {
  titlu: string
  diagnostic_parodontal?: string
  tratamente: TreatmentItem[]
}

export interface Prioritization {
  urgent: string[]
  pe_termen_scurt: string[]
  pe_termen_mediu: string[]
  preventiv: string[]
}
