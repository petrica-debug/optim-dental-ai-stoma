import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Stethoscope,
  Calendar,
  User,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { TreatmentPlanTabs } from '@/components/analysis/TreatmentPlanTabs'
import { XrayAnnotated } from '@/components/xray/XrayAnnotated'
import { ConfidenceIndicator } from '@/components/analysis/ConfidenceIndicator'
import { Disclaimer } from '@/components/analysis/Disclaimer'
import type { TreatmentSection, Prioritization, ToothFinding } from '@/types/database'

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: analysis } = await supabase
    .from('ai_analyses')
    .select('*, xrays(file_url, file_name, xray_type, patients(first_name, last_name, id))')
    .eq('id', id)
    .single()

  if (!analysis) notFound()

  const xray = analysis.xrays as { file_url: string; file_name: string; xray_type: string; patients: { first_name: string; last_name: string; id: string } | null } | null
  const patient = xray?.patients
  const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'Pacient'
  const findings = (analysis.findings || []) as ToothFinding[]
  const detections = analysis.detection_results as { predictions: any[]; imageWidth: number; imageHeight: number } | null
  const recommendations = (analysis.recommendations || []) as string[]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/analize">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Diagnostic AI — {patientName}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(analysis.created_at)}</span>
            <span className="flex items-center gap-1"><Stethoscope className="h-4 w-4" />{xray?.xray_type || 'Radiografie'}</span>
            {analysis.estimated_sessions && (
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{analysis.estimated_sessions} ședințe estimate</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ConfidenceIndicator score={analysis.confidence_score} />
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
            analysis.status === 'completed' ? 'bg-green-100 text-green-700'
            : analysis.status === 'error' ? 'bg-red-100 text-red-700'
            : 'bg-yellow-100 text-yellow-700'
          }`}>
            {analysis.status === 'completed' ? 'Finalizat' : analysis.status === 'error' ? 'Eroare' : 'Procesare'}
          </span>
        </div>
      </div>

      <Disclaimer />

      {/* Main layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: X-ray with annotations */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Radiografie</CardTitle>
            </CardHeader>
            <CardContent>
              <XrayAnnotated
                imageUrl={xray?.file_url || ''}
                detections={detections}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Diagnosis + Treatment Tabs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 shrink-0">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 mb-2">Rezumat Diagnostic</h2>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {analysis.diagnostic_summary || 'Nu a fost generat un rezumat.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Findings per tooth */}
          {findings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Constatări per dinte ({findings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-2">
                  {findings.map((f, i) => (
                    <div key={i} className="rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          Dinte {f.dinte}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          f.severitate === 'severă' ? 'bg-red-100 text-red-700'
                          : f.severitate === 'moderată' ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {f.severitate}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{f.conditie}</p>
                      {f.observatii && <p className="text-xs text-gray-500 mt-0.5">{f.observatii}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Treatment Plan Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Plan de Tratament</CardTitle>
            </CardHeader>
            <CardContent>
              <TreatmentPlanTabs
                planOdontal={analysis.plan_odontal as TreatmentSection | null}
                planParodontal={analysis.plan_parodontal as TreatmentSection | null}
                planProtetic={analysis.plan_protetic as TreatmentSection | null}
                planChirurgical={analysis.plan_chirurgical as TreatmentSection | null}
                planEndodontic={analysis.plan_endodontic as TreatmentSection | null}
                prioritizare={analysis.treatment_priority as Prioritization | null}
              />
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recomandări generale</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/dashboard">
          <Button variant="outline">Înapoi la panou</Button>
        </Link>
        {patient && (
          <Link href={`/patients/${patient.id}`}>
            <Button variant="outline">
              <User className="h-4 w-4" />
              Vezi pacientul
            </Button>
          </Link>
        )}
        <Link href="/upload">
          <Button>Analiză nouă</Button>
        </Link>
      </div>
    </div>
  )
}
