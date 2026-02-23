import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, getInitials } from '@/lib/utils'
import { AddPatientDialog } from '@/components/dashboard/add-patient-dialog'

export default async function PatientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: patients } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacienți</h1>
          <p className="text-gray-600 mt-1">Gestionează pacienții cabinetului</p>
        </div>
        <AddPatientDialog />
      </div>

      {!patients || patients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Nu ai niciun pacient încă</p>
            <AddPatientDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => {
            const fullName = `${patient.first_name} ${patient.last_name}`
            return (
              <Link key={patient.id} href={`/patients/${patient.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm shrink-0">
                        {getInitials(fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{fullName}</p>
                        {patient.phone && <p className="text-sm text-gray-500 truncate">{patient.phone}</p>}
                        {patient.email && <p className="text-sm text-gray-500 truncate">{patient.email}</p>}
                        <p className="text-xs text-gray-400 mt-1">Adăugat: {formatDate(patient.created_at)}</p>
                      </div>
                    </div>
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
