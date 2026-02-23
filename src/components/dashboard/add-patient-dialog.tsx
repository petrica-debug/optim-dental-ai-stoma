'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AddPatientDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Nu ești autentificat')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('patients').insert({
      doctor_id: user.id,
      full_name: form.get('full_name') as string,
      phone: (form.get('phone') as string) || null,
      email: (form.get('email') as string) || null,
      date_of_birth: (form.get('date_of_birth') as string) || null,
      allergies: (form.get('allergies') as string) || null,
      notes: (form.get('notes') as string) || null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Adaugă pacient
      </Button>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Adaugă pacient nou</h2>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nume complet *
              </label>
              <Input name="full_name" placeholder="Ion Popescu" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
                <Input name="phone" placeholder="0712 345 678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Data nașterii
                </label>
                <Input name="date_of_birth" type="date" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <Input name="email" type="email" placeholder="pacient@email.ro" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alergii</label>
              <Input name="allergies" placeholder="Penicilină, latex..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Note adiționale
              </label>
              <textarea
                name="notes"
                rows={2}
                className="flex w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent"
                placeholder="Informații suplimentare..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Anulează
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se salvează...
                  </>
                ) : (
                  'Salvează'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
