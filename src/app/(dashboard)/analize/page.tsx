import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Activity, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { ConfidenceIndicator } from '@/components/analysis/ConfidenceIndicator'

export default async function AnalizePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: analyses } = await supabase
    .from('ai_analyses')
    .select('*, xrays(xray_type, patients(first_name, last_name))')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analize AI</h1>
          <p className="text-gray-600 mt-1">Toate analizele AI efectuate</p>
        </div>
        <Link href="/upload">
          <Button><Activity className="h-4 w-4" />Analiză nouă</Button>
        </Link>
      </div>

      {!analyses || analyses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Nu ai nicio analiză AI încă</p>
            <Link href="/upload">
              <Button variant="outline">Creează prima analiză</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {analyses.map((a: any) => {
            const patient = a.xrays?.patients
            const patientName = patient
              ? `${patient.first_name} ${patient.last_name}`
              : 'Pacient'
            return (
              <Link key={a.id} href={`/analize/${a.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{patientName}</p>
                          <p className="text-sm text-gray-500">
                            {a.xrays?.xray_type || 'Radiografie'} • {formatDate(a.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ConfidenceIndicator score={a.confidence_score} />
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          a.status === 'completed' ? 'bg-green-100 text-green-700'
                          : a.status === 'error' ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {a.status === 'completed' ? 'Finalizat' : a.status === 'error' ? 'Eroare' : 'Procesare'}
                        </span>
                      </div>
                    </div>
                    {a.diagnostic_summary && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                        {a.diagnostic_summary}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
