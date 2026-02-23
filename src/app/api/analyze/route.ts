import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const DENTAL_ANALYSIS_PROMPT = `Ești un expert în stomatologie și radiologie dentară. Analizează această radiografie dentară și oferă un diagnostic complet și plan de tratament detaliat.

IMPORTANT: Răspunde DOAR în format JSON valid. Nu adăuga text înainte sau după JSON.

Structura JSON cerută:

{
  "overall_assessment": "Evaluare generală a stării dentare bazată pe radiografie",
  "confidence_score": 0.85,
  "urgency_level": "normal|high|urgent",
  
  "odontal_findings": [
    {
      "tooth_number": "Numărul dintelui (notație FDI, ex: 16, 21, 36)",
      "condition": "Carie / Fractură / Leziune periapicală / Resorbție / etc.",
      "severity": "mild|moderate|severe",
      "description": "Descriere detaliată a problemei identificate",
      "recommended_treatment": "Tratamentul recomandat"
    }
  ],
  
  "parodontal_findings": [
    {
      "area": "Zona afectată (ex: sextant, localizare)",
      "condition": "Pierdere osoasă / Buzunar parodontal / Retracție gingivală / etc.",
      "severity": "mild|moderate|severe",
      "description": "Descriere detaliată",
      "recommended_treatment": "Tratament parodontal recomandat"
    }
  ],
  
  "protetic_findings": [
    {
      "area": "Zona/dinții afectați",
      "type": "Coroană / Punte / Implant / Proteză / etc.",
      "description": "Descriere și motivare",
      "recommendation": "Recomandare protetică detaliată",
      "priority": "low|medium|high"
    }
  ],
  
  "chirurgical_findings": [
    {
      "area": "Zona care necesită intervenție",
      "procedure": "Extracție / Rezecție apicală / Implant / Chirurgie parodontală / etc.",
      "description": "Descriere și indicație",
      "urgency": "elective|soon|urgent",
      "complexity": "simple|moderate|complex"
    }
  ],
  
  "treatment_plan": [
    {
      "step": 1,
      "category": "odontal|parodontal|protetic|chirurgical",
      "procedure": "Numele procedurii",
      "description": "Descriere detaliată a pasului de tratament",
      "priority": "low|medium|high|urgent",
      "estimated_sessions": 1,
      "notes": "Note adiționale pentru medic"
    }
  ]
}

Analizează radiografia cu atenție la:
1. ODONTAL: Carii (incipiente, medii, profunde), fracturi coronare/radiculare, leziuni periapicale, resorbții, anomalii de formă/poziție
2. PARODONTAL: Nivel osos marginal, pierdere osoasă (orizontală/verticală), buzunare osoase, calcul, factori de retenție
3. PROTETIC: Edentații, restaurări existente (starea lor), necesitate de coroane/punți/implanturi
4. CHIRURGICAL: Dinți incluși/semi-incluși, resturi radiculare, patologie periapicală care necesită chirurgie, indicații de implant

Planul de tratament trebuie să fie:
- Ordonat cronologic (urgente mai întâi)
- Realist și conform cu standardele stomatologice
- Detaliat pentru fiecare etapă

Dacă imaginea nu este o radiografie dentară sau nu poate fi analizată, returnează un JSON cu overall_assessment explicând problema și arrays goale.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image_base64, file_name, file_url, patient_id, xray_type } = body

    if (!image_base64 || !patient_id || !file_url) {
      return NextResponse.json({ error: 'Lipsesc câmpuri obligatorii' }, { status: 400 })
    }

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
      return NextResponse.json({ error: 'Nu ești autentificat' }, { status: 401 })
    }

    const mimeType = file_name?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: DENTAL_ANALYSIS_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analizează această radiografie dentară de tip ${xray_type}. Oferă un diagnostic complet și plan de tratament.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${image_base64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      return NextResponse.json({ error: 'Nu s-a primit răspuns de la AI' }, { status: 500 })
    }

    let analysis
    try {
      const jsonStr = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analysis = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json(
        { error: 'Răspunsul AI nu a putut fi procesat', raw: aiResponse },
        { status: 500 }
      )
    }

    const { data: xray, error: xrayError } = await supabaseAdmin
      .from('xray_uploads')
      .insert({
        patient_id,
        doctor_id: user.id,
        file_url,
        file_name: file_name || 'xray.jpg',
        xray_type: xray_type || 'panoramic',
      })
      .select()
      .single()

    if (xrayError) {
      return NextResponse.json({ error: `Eroare salvare radiografie: ${xrayError.message}` }, { status: 500 })
    }

    const { data: diagnosis, error: diagError } = await supabaseAdmin
      .from('diagnoses')
      .insert({
        xray_id: xray.id,
        patient_id,
        doctor_id: user.id,
        overall_assessment: analysis.overall_assessment,
        confidence_score: analysis.confidence_score,
        odontal_findings: analysis.odontal_findings || [],
        parodontal_findings: analysis.parodontal_findings || [],
        protetic_findings: analysis.protetic_findings || [],
        chirurgical_findings: analysis.chirurgical_findings || [],
        treatment_plan: analysis.treatment_plan || [],
        urgency_level: analysis.urgency_level || 'normal',
        raw_ai_response: analysis,
      })
      .select()
      .single()

    if (diagError) {
      return NextResponse.json({ error: `Eroare salvare diagnostic: ${diagError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      diagnosis_id: diagnosis.id,
      analysis,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare server'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
