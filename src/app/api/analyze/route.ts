import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runAnalysisPipeline } from '@/lib/ai/analysis-pipeline'

export const maxDuration = 60

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image_base64, file_name, file_url, patient_id, xray_type } = body

    if (!image_base64 || !patient_id || !file_url) {
      return NextResponse.json({ error: 'Lipsesc câmpuri obligatorii' }, { status: 400 })
    }

    // Auth check via cookies
    const authHeader = request.headers.get('cookie')
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            if (!authHeader) return []
            return authHeader.split(';').map((c) => {
              const [name, ...rest] = c.trim().split('=')
              return { name, value: rest.join('=') }
            })
          },
          setAll() {},
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    // Get doctor record
    const { data: doctor } = await supabaseAdmin
      .from('doctors')
      .select('id, clinic_id')
      .eq('user_id', user.id)
      .single()

    if (!doctor) {
      return NextResponse.json({ error: 'Profil medic negăsit' }, { status: 404 })
    }

    const mimeType = file_name?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'

    // Create X-ray record
    const { data: xray, error: xrayError } = await supabaseAdmin
      .from('xrays')
      .insert({
        patient_id,
        doctor_id: doctor.id,
        clinic_id: doctor.clinic_id,
        file_url,
        file_name: file_name || 'xray.jpg',
        xray_type: xray_type || 'panoramic_opg',
      })
      .select()
      .single()

    if (xrayError || !xray) {
      return NextResponse.json(
        { error: `Eroare salvare radiografie: ${xrayError?.message}` },
        { status: 500 }
      )
    }

    // Run the hybrid AI analysis pipeline
    const analysisId = await runAnalysisPipeline(
      xray.id,
      image_base64,
      doctor.id,
      xray_type || 'panoramic_opg',
      mimeType
    )

    return NextResponse.json({
      success: true,
      analysis_id: analysisId,
      message: 'Analiza AI a fost finalizată cu succes',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare server'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
