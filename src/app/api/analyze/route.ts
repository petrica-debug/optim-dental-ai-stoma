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

const DENTAL_ANALYSIS_PROMPT = `You are a dental radiology AI assistant integrated into a professional dental clinic software used exclusively by licensed dentists (medici stomatologi). Your role is to assist the dentist by providing a preliminary radiographic interpretation of dental X-rays (OPG, periapical, bitewing, CBCT, etc.).

CONTEXT: This is a clinical decision-support tool. The dentist will always review and validate your findings before any treatment. Your analysis helps speed up the diagnostic workflow. You MUST analyze every dental X-ray image provided — even if image quality is not perfect, provide your best assessment based on what is visible. Licensed dentists rely on this preliminary analysis.

CRITICAL RULES:
1. You MUST always provide a thorough analysis. Never refuse to analyze a dental X-ray.
2. Even with suboptimal image quality, identify everything you can see.
3. Respond ONLY with valid JSON — no text before or after.
4. All text content must be in Romanian language.
5. Be specific: use FDI tooth numbering, describe exact locations, name specific conditions.
6. If you see dental restorations (fillings, crowns, bridges, implants), report their condition.
7. Look carefully at bone levels, periapical areas, and tooth structures.

Required JSON structure:

{
  "overall_assessment": "Evaluare generală detaliată a stării dentare observate pe radiografie, inclusiv calitatea imaginii și ce se poate observa",
  "confidence_score": 0.85,
  "urgency_level": "normal|high|urgent",

  "odontal_findings": [
    {
      "tooth_number": "Număr dinte FDI (ex: 16, 21, 36, 48)",
      "condition": "Carie / Fractură / Leziune periapicală / Resorbție / Tratament endodontic / Restaurare existentă / etc.",
      "severity": "mild|moderate|severe",
      "description": "Descriere detaliată a ceea ce se observă radiologic",
      "recommended_treatment": "Tratamentul recomandat"
    }
  ],

  "parodontal_findings": [
    {
      "area": "Zona afectată (sextant / localizare specifică)",
      "condition": "Pierdere osoasă orizontală/verticală / Buzunar parodontal / Tartru / etc.",
      "severity": "mild|moderate|severe",
      "description": "Descriere detaliată a modificărilor parodontale",
      "recommended_treatment": "Tratament parodontal recomandat"
    }
  ],

  "protetic_findings": [
    {
      "area": "Zona/dinții afectați",
      "type": "Coroană / Punte / Implant / Proteză parțială / Proteză totală / etc.",
      "description": "Descriere a lucrărilor protetice existente sau necesare",
      "recommendation": "Recomandare protetică detaliată",
      "priority": "low|medium|high"
    }
  ],

  "chirurgical_findings": [
    {
      "area": "Zona care necesită intervenție chirurgicală",
      "procedure": "Extracție / Extracție chirurgicală / Rezecție apicală / Inserare implant / Adiție osoasă / etc.",
      "description": "Descriere și indicație chirurgicală",
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
      "notes": "Note adiționale pentru medicul stomatolog"
    }
  ]
}

ANALYZE THE X-RAY SYSTEMATICALLY:
1. ODONTAL: Examine each visible tooth for caries (incipient, medium, deep), fractures, periapical lesions/radiolucencies, root resorption, endodontic treatments, existing restorations (amalgam, composite, inlay/onlay), root canal fillings quality, posts
2. PARODONTAL: Assess marginal bone levels around each tooth, look for horizontal/vertical bone loss, infrabony defects, calculus deposits, furcation involvement, widened periodontal ligament spaces
3. PROTETIC: Identify missing teeth (edentulous areas), existing prosthetic work (crowns, bridges, implants — assess their fit and condition), areas needing prosthetic rehabilitation
4. CHIRURGICAL: Look for impacted/semi-impacted teeth, retained roots, cysts, pathological lesions requiring surgical intervention, implant site evaluation

TREATMENT PLAN REQUIREMENTS:
- Order chronologically (urgent/emergency first, then systematic treatment)
- Be realistic and follow dental treatment standards
- Include estimated number of sessions per procedure
- Provide detailed notes for each step`

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

    const models = ['gpt-4o', 'gpt-4o-mini']
    let completion = null
    let lastError = null

    for (const model of models) {
      try {
        completion = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: DENTAL_ANALYSIS_PROMPT,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${image_base64}`,
                    detail: 'high',
                  },
                },
                {
                  type: 'text',
                  text: `This is a ${xray_type} dental X-ray from a dental clinic. Analyze it thoroughly and provide the complete JSON diagnosis as instructed. Examine every tooth, bone level, existing restorations, and pathology visible on this radiograph. Respond in Romanian.`,
                },
              ],
            },
          ],
          max_tokens: 4096,
          temperature: 0.2,
        })
        break
      } catch (e) {
        lastError = e
        if (model === models[models.length - 1]) throw e
      }
    }

    if (!completion) throw lastError ?? new Error('No AI model available')

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
