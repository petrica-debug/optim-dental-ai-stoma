'use client'

import { useState } from 'react'
import { ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CLASS_LABELS_RO } from '@/lib/ai/roboflow'

interface Prediction {
  class: string
  confidence: number
  x: number
  y: number
  width: number
  height: number
}

interface DetectionData {
  predictions: Prediction[]
  imageWidth: number
  imageHeight: number
}

const CLASS_COLORS: Record<string, string> = {
  'Bone Loss': '#ef4444',
  'Caries': '#f59e0b',
  'Crown': '#3b82f6',
  'Filling': '#22c55e',
  'Implant': '#8b5cf6',
  'Missing teeth': '#6b7280',
  'Periapical lesion': '#ec4899',
  'Root Canal Treatment': '#06b6d4',
  'Root Piece': '#f97316',
  'Impacted tooth': '#a855f7',
}

export function XrayAnnotated({
  imageUrl,
  detections,
}: {
  imageUrl: string
  detections: DetectionData | null
}) {
  const [showDetections, setShowDetections] = useState(true)
  const [zoom, setZoom] = useState(1)

  const predictions = detections?.predictions ?? []
  const imgW = detections?.imageWidth || 1
  const imgH = detections?.imageHeight || 1

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetections(!showDetections)}
          >
            {showDetections ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDetections ? 'Ascunde detecții' : 'Arată detecții'}
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(3, zoom + 0.25))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-900 overflow-auto max-h-[600px]">
        <div
          className="relative inline-block"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          <img src={imageUrl} alt="Radiografie dentară" className="block max-w-full" />
          {showDetections &&
            predictions.map((p, i) => {
              const left = ((p.x - p.width / 2) / imgW) * 100
              const top = ((p.y - p.height / 2) / imgH) * 100
              const width = (p.width / imgW) * 100
              const height = (p.height / imgH) * 100
              const color = CLASS_COLORS[p.class] || '#ffffff'

              return (
                <div
                  key={i}
                  className="absolute border-2 pointer-events-none"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                    borderColor: color,
                  }}
                >
                  <span
                    className="absolute -top-5 left-0 text-[10px] font-bold px-1 py-0.5 rounded whitespace-nowrap"
                    style={{ backgroundColor: color, color: '#fff' }}
                  >
                    {CLASS_LABELS_RO[p.class] || p.class} {Math.round(p.confidence * 100)}%
                  </span>
                </div>
              )
            })}
        </div>
      </div>

      {predictions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(
            predictions.reduce(
              (acc, p) => {
                acc[p.class] = (acc[p.class] || 0) + 1
                return acc
              },
              {} as Record<string, number>
            )
          ).map(([cls, count]) => (
            <span
              key={cls}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
              style={{ borderColor: CLASS_COLORS[cls] || '#ccc', color: CLASS_COLORS[cls] || '#666' }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: CLASS_COLORS[cls] || '#ccc' }}
              />
              {CLASS_LABELS_RO[cls] || cls}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
