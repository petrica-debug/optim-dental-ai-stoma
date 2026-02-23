import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, FileImage, FileText, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [patientsRes, xraysRes, diagnosesRes, recentDiagnosesRes] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase.from('xray_uploads').select('id', { count: 'exact', head: true }),
    supabase.from('diagnoses').select('id', { count: 'exact', head: true }),
    supabase
      .from('diagnoses')
      .select('*, patients(full_name), xray_uploads(file_name, xray_type)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Pacienți', value: patientsRes.count ?? 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Radiografii', value: xraysRes.count ?? 0, icon: FileImage, color: 'bg-purple-100 text-purple-600' },
    { label: 'Diagnostice', value: diagnosesRes.count ?? 0, icon: FileText, color: 'bg-green-100 text-green-600' },
  ]

  const recentDiagnoses = recentDiagnosesRes.data ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panou principal</h1>
          <p className="text-gray-600 mt-1">Bine ai venit în Optim Dental AI</p>
        </div>
        <Link href="/upload">
          <Button>
            <Activity className="h-4 w-4" />
            Analiză nouă
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostice recente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDiagnoses.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Nu ai niciun diagnostic încă</p>
              <Link href="/upload">
                <Button variant="outline">Creează primul diagnostic</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDiagnoses.map((diagnosis) => (
                <Link
                  key={diagnosis.id}
                  href={`/analysis/${diagnosis.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {(diagnosis.patients as { full_name: string })?.full_name ?? 'Pacient'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(diagnosis.xray_uploads as { xray_type: string })?.xray_type ?? 'Radiografie'} • {formatDate(diagnosis.created_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      diagnosis.urgency_level === 'urgent'
                        ? 'bg-red-100 text-red-700'
                        : diagnosis.urgency_level === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {diagnosis.urgency_level === 'urgent'
                      ? 'Urgent'
                      : diagnosis.urgency_level === 'high'
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
  )
}
