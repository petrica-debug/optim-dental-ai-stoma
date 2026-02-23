export interface Profile {
  id: string
  full_name: string
  clinic_name: string | null
  specialization: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  doctor_id: string
  full_name: string
  date_of_birth: string | null
  phone: string | null
  email: string | null
  medical_history: string | null
  allergies: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface XrayUpload {
  id: string
  patient_id: string
  doctor_id: string
  file_url: string
  file_name: string
  xray_type: string
  notes: string | null
  created_at: string
}

export interface Diagnosis {
  id: string
  xray_id: string
  patient_id: string
  doctor_id: string
  overall_assessment: string | null
  confidence_score: number | null
  odontal_findings: OdontalFinding[]
  parodontal_findings: ParodontalFinding[]
  protetic_findings: ProteticFinding[]
  chirurgical_findings: ChirurgicalFinding[]
  treatment_plan: TreatmentStep[]
  urgency_level: string
  raw_ai_response: Record<string, unknown> | null
  doctor_approved: boolean
  doctor_notes: string | null
  created_at: string
  updated_at: string
}

export interface OdontalFinding {
  tooth_number: string
  condition: string
  severity: 'mild' | 'moderate' | 'severe'
  description: string
  recommended_treatment: string
}

export interface ParodontalFinding {
  area: string
  condition: string
  severity: 'mild' | 'moderate' | 'severe'
  description: string
  recommended_treatment: string
}

export interface ProteticFinding {
  area: string
  type: string
  description: string
  recommendation: string
  priority: 'low' | 'medium' | 'high'
}

export interface ChirurgicalFinding {
  area: string
  procedure: string
  description: string
  urgency: 'elective' | 'soon' | 'urgent'
  complexity: 'simple' | 'moderate' | 'complex'
}

export interface TreatmentStep {
  step: number
  category: 'odontal' | 'parodontal' | 'protetic' | 'chirurgical'
  procedure: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimated_sessions: number
  notes: string
}

export interface DiagnosisWithRelations extends Diagnosis {
  xray_uploads?: XrayUpload
  patients?: Patient
}
