import OpenAI from 'openai'
import { DENTAL_ANALYSIS_SYSTEM_PROMPT, buildUserPrompt } from './dental-prompt'
import { AnalysisResult } from './types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function generateTreatmentPlan(
  imageBase64: string,
  detectionResults: string | null,
  xrayType: string,
  mimeType: string = 'image/jpeg'
): Promise<AnalysisResult> {
  const models = ['gpt-4o', 'gpt-4o-mini']
  let lastError: unknown = null

  for (const model of models) {
    try {
      const response = await openai.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: DENTAL_ANALYSIS_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: buildUserPrompt(detectionResults, xrayType),
              },
            ],
          },
        ],
      })

      const content = response.choices[0].message.content
      if (!content) throw new Error('Empty response from AI')

      let jsonStr = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (jsonMatch) jsonStr = jsonMatch[0]

      return JSON.parse(jsonStr) as AnalysisResult
    } catch (e) {
      lastError = e
      if (model === models[models.length - 1]) throw e
    }
  }

  throw lastError ?? new Error('No AI model available')
}
