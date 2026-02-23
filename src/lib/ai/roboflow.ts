import { DetectionResult } from './types'

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY
const MODEL_ID = process.env.ROBOFLOW_MODEL_ID || 'dental-x-ray-panoramic-95iwh'
const MODEL_VERSION = process.env.ROBOFLOW_MODEL_VERSION || '1'

export const CLASS_LABELS_RO: Record<string, string> = {
  'Bone Loss': 'Pierdere osoasă',
  'Caries': 'Carie',
  'Crown': 'Coroană',
  'Filling': 'Obturație',
  'Implant': 'Implant',
  'Missing teeth': 'Dinte lipsă',
  'Periapical lesion': 'Leziune periapicală',
  'Root Canal Treatment': 'Tratament de canal',
  'Root Piece': 'Rest radicular',
  'Impacted tooth': 'Dinte inclus',
}

export function isRoboflowConfigured(): boolean {
  return !!ROBOFLOW_API_KEY
}

export async function detectDentalConditions(
  imageBase64: string
): Promise<DetectionResult | null> {
  if (!ROBOFLOW_API_KEY) return null

  try {
    const response = await fetch(
      `https://detect.roboflow.com/${MODEL_ID}/${MODEL_VERSION}?api_key=${ROBOFLOW_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: imageBase64,
      }
    )

    if (!response.ok) {
      console.error('Roboflow detection failed:', response.statusText)
      return null
    }

    const data = await response.json()

    return {
      predictions: (data.predictions || []).map((p: any) => ({
        class: p.class,
        confidence: p.confidence,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
      })),
      imageWidth: data.image?.width || 0,
      imageHeight: data.image?.height || 0,
    }
  } catch (error) {
    console.error('Roboflow error:', error)
    return null
  }
}
