import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Activity,
  Stethoscope,
  Bone,
  Crown,
  Scissors,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type {
  OdontalFinding,
  ParodontalFinding,
  ProteticFinding,
  ChirurgicalFinding,
  TreatmentStep,
} from '@/types/database'

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    mild: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Ușor' },
    moderate: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Moderat' },
    severe: { bg: 'bg-red-100', text: 'text-red-700', label: 'Sever' },
    low: { bg: 'bg-green-100', text: 'text-green-700', label: 'Scăzut' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Mediu' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Ridicat' },
    urgent: { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgent' },
    elective: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Electiv' },
    soon: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Curând' },
    simple: { bg: 'bg-green-100', text: 'text-green-700', label: 'Simplu' },
    complex: { bg: 'bg-red-100', text: 'text-red-700', label: 'Complex' },
  }
  const c = config[severity] || { bg: 'bg-gray-100', text: 'text-gray-700', label: severity }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: diagnosis } = await supabase
    .from('diagnoses')
    .select('*, patients(full_name, phone, email), xray_uploads(file_url, file_name, xray_type)')
    .eq('id', id)
    .single()

  if (!diagnosis) notFound()

  const patient = diagnosis.patients as { full_name: string; phone: string; email: string } | null
  const xray = diagnosis.xray_uploads as {
    file_url: string
    file_name: string
    xray_type: string
  } | null
  const odontal = (diagnosis.odontal_findings || []) as OdontalFinding[]
  const parodontal = (diagnosis.parodontal_findings || []) as ParodontalFinding[]
  const protetic = (diagnosis.protetic_findings || []) as ProteticFinding[]
  const chirurgical = (diagnosis.chirurgical_findings || []) as ChirurgicalFinding[]
  const treatmentPlan = (diagnosis.treatment_plan || []) as TreatmentStep[]

  const urgencyConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> =
    {
      normal: { icon: CheckCircle2, color: 'text-green-600', label: 'Normal' },
      high: { icon: AlertTriangle, color: 'text-orange-600', label: 'Prioritar' },
      urgent: { icon: AlertCircle, color: 'text-red-600', label: 'Urgent' },
    }
  const urgency = urgencyConfig[diagnosis.urgency_level] || urgencyConfig.normal

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Diagnostic AI — {patient?.full_name ?? 'Pacient'}
          </h1>
          <p className="text-gray-600 mt-0.5">
            {xray?.xray_type ?? 'Radiografie'} • {formatDate(diagnosis.created_at)}
          </p>
        </div>
        <div className={`flex items-center gap-2 ${urgency.color}`}>
          <urgency.icon className="h-5 w-5" />
          <span className="font-semibold">{urgency.label}</span>
        </div>
      </div>

      {/* Overall Assessment */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 shrink-0">
              <Stethoscope className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Evaluare generală</h2>
              <p className="text-gray-700 leading-relaxed">{diagnosis.overall_assessment}</p>
              {diagnosis.confidence_score && (
                <p className="text-sm text-blue-600 mt-2">
                  Scor de încredere: {Math.round(diagnosis.confidence_score * 100)}%
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Odontal Findings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-base">Diagnostic Odontal</CardTitle>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">
                {odontal.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {odontal.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nu s-au identificat probleme odontalice
              </p>
            ) : (
              <div className="space-y-3">
                {odontal.map((f, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        Dinte {f.tooth_number} — {f.condition}
                      </span>
                      <SeverityBadge severity={f.severity} />
                    </div>
                    <p className="text-sm text-gray-600">{f.description}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Tratament: {f.recommended_treatment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parodontal Findings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <Bone className="h-4 w-4 text-green-600" />
              </div>
              <CardTitle className="text-base">Diagnostic Parodontal</CardTitle>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">
                {parodontal.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {parodontal.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nu s-au identificat probleme parodontale
              </p>
            ) : (
              <div className="space-y-3">
                {parodontal.map((f, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {f.area} — {f.condition}
                      </span>
                      <SeverityBadge severity={f.severity} />
                    </div>
                    <p className="text-sm text-gray-600">{f.description}</p>
                    <p className="text-xs text-green-600 mt-1">
                      Tratament: {f.recommended_treatment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Protetic Findings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <Crown className="h-4 w-4 text-purple-600" />
              </div>
              <CardTitle className="text-base">Diagnostic Protetic</CardTitle>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-auto">
                {protetic.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {protetic.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nu s-au identificat necesități protetice
              </p>
            ) : (
              <div className="space-y-3">
                {protetic.map((f, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {f.area} — {f.type}
                      </span>
                      <SeverityBadge severity={f.priority} />
                    </div>
                    <p className="text-sm text-gray-600">{f.description}</p>
                    <p className="text-xs text-purple-600 mt-1">{f.recommendation}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chirurgical Findings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                <Scissors className="h-4 w-4 text-red-600" />
              </div>
              <CardTitle className="text-base">Indicații Chirurgicale</CardTitle>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-auto">
                {chirurgical.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {chirurgical.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nu s-au identificat indicații chirurgicale
              </p>
            ) : (
              <div className="space-y-3">
                {chirurgical.map((f, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {f.area} — {f.procedure}
                      </span>
                      <div className="flex gap-1">
                        <SeverityBadge severity={f.urgency} />
                        <SeverityBadge severity={f.complexity} />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{f.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Treatment Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <ClipboardList className="h-4 w-4 text-indigo-600" />
            </div>
            <CardTitle>Plan de Tratament</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {treatmentPlan.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nu a fost generat un plan de tratament
            </p>
          ) : (
            <div className="space-y-4">
              {treatmentPlan.map((step, i) => {
                const categoryColors: Record<string, string> = {
                  odontal: 'border-l-blue-500 bg-blue-50/30',
                  parodontal: 'border-l-green-500 bg-green-50/30',
                  protetic: 'border-l-purple-500 bg-purple-50/30',
                  chirurgical: 'border-l-red-500 bg-red-50/30',
                }
                const categoryLabels: Record<string, string> = {
                  odontal: 'Odontal',
                  parodontal: 'Parodontal',
                  protetic: 'Protetic',
                  chirurgical: 'Chirurgical',
                }
                return (
                  <div
                    key={i}
                    className={`rounded-xl border-l-4 p-4 ${categoryColors[step.category] || 'border-l-gray-300'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-bold">
                          {step.step}
                        </span>
                        <span className="font-semibold text-gray-900">{step.procedure}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={step.priority} />
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {step.estimated_sessions} ședințe
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">{step.description}</p>
                    <div className="flex items-center gap-2 ml-8 mt-1">
                      <span className="text-xs text-gray-400">
                        {categoryLabels[step.category] || step.category}
                      </span>
                      {step.notes && (
                        <span className="text-xs text-gray-500">• {step.notes}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/dashboard">
          <Button variant="outline">Înapoi la panou</Button>
        </Link>
        <Link href={`/patients/${diagnosis.patient_id}`}>
          <Button variant="outline">Vezi pacientul</Button>
        </Link>
        <Link href="/upload">
          <Button>Analiză nouă</Button>
        </Link>
      </div>
    </div>
  )
}
