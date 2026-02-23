export interface RoboflowPrediction {
  class: string
  confidence: number
  x: number
  y: number
  width: number
  height: number
}

export interface DetectionResult {
  predictions: RoboflowPrediction[]
  imageWidth: number
  imageHeight: number
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

export interface AnalysisResult {
  rezumat_diagnostic: string
  constatari: ToothFinding[]
  plan_odontal: TreatmentSection
  plan_parodontal: TreatmentSection
  plan_protetic: TreatmentSection
  plan_chirurgical: TreatmentSection
  plan_endodontic: TreatmentSection
  plan_ortodontic?: TreatmentSection
  prioritizare: Prioritization
  nr_sedinte_estimate: number
  recomandari_generale: string[]
  scor_incredere: number
  nota_disclaimer: string
}
