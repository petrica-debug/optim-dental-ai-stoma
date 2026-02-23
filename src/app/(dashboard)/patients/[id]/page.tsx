import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Activity, FileImage, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  if (!patient) notFound()

  const { data: diagnoses } = await supabase
    .from('diagnoses')
    .select('*, xray_uploads(file_name, xray_type)')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{patient.full_name}</h1>
          <p className="text-gray-600 mt-0.5">
            Pacient din {formatDate(patient.created_at)}
          </p>
        </div>
        <Link href={`/upload?patient=${patient.id}`}>
          <Button>
            <Upload className="h-4 w-4" />
            Analiză nouă
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informații pacient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {patient.phone && (
              <div>
                <span className="text-gray-500">Telefon:</span>
                <span className="ml-2 text-gray-900">{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2 text-gray-900">{patient.email}</span>
              </div>
            )}
            {patient.date_of_birth && (
              <div>
                <span className="text-gray-500">Data nașterii:</span>
                <span className="ml-2 text-gray-900">{formatDate(patient.date_of_birth)}</span>
              </div>
            )}
            {patient.allergies && (
              <div>
                <span className="text-gray-500">Alergii:</span>
                <span className="ml-2 text-gray-900">{patient.allergies}</span>
              </div>
            )}
            {patient.notes && (
              <div>
                <span className="text-gray-500">Note:</span>
                <p className="text-gray-900 mt-1">{patient.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Istoric diagnostice</CardTitle>
            </CardHeader>
            <CardContent>
              {!diagnoses || diagnoses.length === 0 ? (
                <div className="text-center py-8">
                  <FileImage className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">Niciun diagnostic pentru acest pacient</p>
                  <Link href={`/upload?patient=${patient.id}`}>
                    <Button variant="outline">
                      <Upload className="h-4 w-4" />
                      Încarcă radiografie
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {diagnoses.map((d) => (
                    <Link
                      key={d.id}
                      href={`/analysis/${d.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {(d.xray_uploads as { xray_type: string })?.xray_type ?? 'Radiografie'}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(d.created_at)}</p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          d.urgency_level === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : d.urgency_level === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {d.urgency_level === 'urgent'
                          ? 'Urgent'
                          : d.urgency_level === 'high'
                            ? 'Prioritar'
                            : 'Normal'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
