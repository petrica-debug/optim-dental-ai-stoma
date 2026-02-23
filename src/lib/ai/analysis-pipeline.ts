import { createClient } from '@supabase/supabase-js'
import { detectDentalConditions, isRoboflowConfigured } from './roboflow'
import { generateTreatmentPlan } from './openai'
import type { DetectionResult } from './types'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function runAnalysisPipeline(
  xrayId: string,
  imageBase64: string,
  doctorId: string,
  xrayType: string,
  mimeType: string
): Promise<string> {
  const { data: analysis, error: createErr } = await supabaseAdmin
    .from('ai_analyses')
    .insert({
      xray_id: xrayId,
      doctor_id: doctorId,
      status: 'processing',
    })
    .select()
    .single()

  if (createErr || !analysis) throw new Error('Failed to create analysis record')

  try {
    // Step 1: Roboflow object detection (optional)
    let detections: DetectionResult | null = null
    if (isRoboflowConfigured()) {
      detections = await detectDentalConditions(imageBase64)
      if (detections) {
        await supabaseAdmin
          .from('ai_analyses')
          .update({ detection_results: detections })
          .eq('id', analysis.id)
      }
    }

    // Step 2: GPT-4o treatment plan generation
    const detectionJson = detections ? JSON.stringify(detections, null, 2) : null
    const treatmentPlan = await generateTreatmentPlan(
      imageBase64,
      detectionJson,
      xrayType,
      mimeType
    )

    // Step 3: Save complete results
    await supabaseAdmin
      .from('ai_analyses')
      .update({
        diagnostic_summary: treatmentPlan.rezumat_diagnostic,
        findings: treatmentPlan.constatari,
        plan_odontal: treatmentPlan.plan_odontal,
        plan_parodontal: treatmentPlan.plan_parodontal,
        plan_protetic: treatmentPlan.plan_protetic,
        plan_chirurgical: treatmentPlan.plan_chirurgical,
        plan_endodontic: treatmentPlan.plan_endodontic,
        plan_ortodontic: treatmentPlan.plan_ortodontic || null,
        treatment_priority: treatmentPlan.prioritizare,
        estimated_sessions: treatmentPlan.nr_sedinte_estimate,
        recommendations: treatmentPlan.recomandari_generale,
        confidence_score: treatmentPlan.scor_incredere,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysis.id)

    // Step 4: Create dental chart entries
    if (treatmentPlan.constatari?.length) {
      const { data: xray } = await supabaseAdmin
        .from('xrays')
        .select('patient_id')
        .eq('id', xrayId)
        .single()

      if (xray) {
        const chartEntries = treatmentPlan.constatari
          .filter((f: any) => f.dinte && /^\d+$/.test(f.dinte))
          .map((f: any) => ({
            patient_id: xray.patient_id,
            analysis_id: analysis.id,
            tooth_number: parseInt(f.dinte),
            condition: f.conditie,
            severity: f.severitate,
            notes: f.observatii,
          }))

        if (chartEntries.length > 0) {
          await supabaseAdmin.from('dental_charts').insert(chartEntries)
        }
      }
    }

    return analysis.id
  } catch (error) {
    await supabaseAdmin
      .from('ai_analyses')
      .update({ status: 'error' })
      .eq('id', analysis.id)
    throw error
  }
}
