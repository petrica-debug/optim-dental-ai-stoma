'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  FileImage,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Activity,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Patient } from '@/types/database'

const XRAY_TYPES = [
  { value: 'panoramic', label: 'Panoramică (OPG)' },
  { value: 'periapical', label: 'Periapicală' },
  { value: 'bitewing', label: 'Bitewing' },
  { value: 'cbct', label: 'CBCT' },
  { value: 'cephalometric', label: 'Cefalometrică' },
  { value: 'other', label: 'Altul' },
]

type AnalysisStep = 'select' | 'upload' | 'analyzing' | 'complete' | 'error'

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
      <UploadPageContent />
    </Suspense>
  )
}

function UploadPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPatient = searchParams.get('patient')

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient ?? '')
  const [xrayType, setXrayType] = useState('panoramic')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [step, setStep] = useState<AnalysisStep>('select')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadPatients() {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .order('full_name', { ascending: true })
      if (data) setPatients(data)
    }
    loadPatients()
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  async function handleAnalyze() {
    if (!file || !selectedPatient) return

    setStep('upload')
    setProgress('Se încarcă radiografia...')
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Nu ești autentificat')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${selectedPatient}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('xrays')
        .upload(fileName, file)

      if (uploadError) throw new Error(`Eroare la upload: ${uploadError.message}`)

      const {
        data: { publicUrl },
      } = supabase.storage.from('xrays').getPublicUrl(fileName)

      setStep('analyzing')
      setProgress('Se analizează radiografia cu AI...')

      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.readAsDataURL(file)
      })
      const base64 = await base64Promise

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64,
          file_name: file.name,
          file_url: publicUrl,
          patient_id: selectedPatient,
          xray_type: xrayType,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Eroare la analiza AI')
      }

      const data = await response.json()
      setDiagnosisId(data.diagnosis_id)
      setStep('complete')
      setProgress('Analiză completă!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare necunoscută')
      setStep('error')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analiză nouă</h1>
        <p className="text-gray-600 mt-1">
          Încarcă o radiografie dentară pentru analiză AI
        </p>
      </div>

      {step === 'complete' ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Analiză completă!</h2>
            <p className="text-gray-600 mb-6">
              Diagnosticul AI a fost generat cu succes. Poți vedea rezultatele detaliate.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push(`/analysis/${diagnosisId}`)}>
                Vezi diagnosticul
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('select')
                  setFile(null)
                  setPreview(null)
                  setDiagnosisId(null)
                }}
              >
                Analiză nouă
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : step === 'error' ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Eroare</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setStep('select')
                setError('')
              }}
            >
              Încearcă din nou
            </Button>
          </CardContent>
        </Card>
      ) : step === 'upload' || step === 'analyzing' ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="relative mx-auto mb-6">
              <div className="h-20 w-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{progress}</h2>
            <p className="text-sm text-gray-500">
              {step === 'upload'
                ? 'Se încarcă imaginea în cloud...'
                : 'AI analizează radiografia pentru diagnostic odontal, parodontal, protetic și chirurgical...'}
            </p>
            {step === 'analyzing' && (
              <div className="mt-6 w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4" />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Selectează pacientul</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="">-- Selectează pacient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Tip radiografie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {XRAY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setXrayType(t.value)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                      xrayType === t.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. Încarcă radiografia</CardTitle>
            </CardHeader>
            <CardContent>
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview radiografie"
                    className="w-full max-h-96 object-contain rounded-xl border border-gray-200 bg-gray-900"
                  />
                  <button
                    onClick={() => {
                      setFile(null)
                      setPreview(null)
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                  <p className="text-sm text-gray-500 mt-2 text-center">{file?.name}</p>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-700">
                    {isDragActive ? 'Plasează fișierul aici' : 'Trage și plasează radiografia aici'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">sau click pentru a selecta</p>
                  <p className="text-xs text-gray-400 mt-2">PNG, JPG, WEBP • Max 10MB</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleAnalyze}
            size="lg"
            className="w-full"
            disabled={!file || !selectedPatient}
          >
            <Activity className="h-5 w-5" />
            Analizează cu AI
          </Button>
        </>
      )}
    </div>
  )
}
