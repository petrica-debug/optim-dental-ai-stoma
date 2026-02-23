'use client'

import { useState } from 'react'
import {
  Activity,
  Bone,
  Crown,
  Scissors,
  Stethoscope,
  ClipboardList,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TreatmentSection, TreatmentItem, Prioritization } from '@/types/database'

const tabs = [
  { key: 'odontal', label: 'Odontal', icon: Activity, color: 'text-blue-600 bg-blue-100' },
  { key: 'parodontal', label: 'Parodontal', icon: Bone, color: 'text-green-600 bg-green-100' },
  { key: 'protetic', label: 'Protetic', icon: Crown, color: 'text-purple-600 bg-purple-100' },
  { key: 'chirurgical', label: 'Chirurgical', icon: Scissors, color: 'text-red-600 bg-red-100' },
  { key: 'endodontic', label: 'Endodontic', icon: Stethoscope, color: 'text-orange-600 bg-orange-100' },
  { key: 'prioritizare', label: 'Prioritizare', icon: ClipboardList, color: 'text-indigo-600 bg-indigo-100' },
] as const

function TreatmentList({ section }: { section: TreatmentSection | null }) {
  if (!section || !section.tratamente || section.tratamente.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">
        Fără indicații la momentul actual
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {section.diagnostic_parodontal && (
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 mb-4">
          <span className="font-medium">Diagnostic: </span>
          {section.diagnostic_parodontal}
        </div>
      )}
      {section.tratamente.map((item: TreatmentItem, i: number) => (
        <div key={i} className="rounded-xl border border-gray-100 p-4 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {(item.dinte || item.zona) && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {item.dinte ? `Dinte ${item.dinte}` : item.zona}
                  </span>
                )}
                {item.urgenta && (
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      item.urgenta === 'urgent'
                        ? 'bg-red-100 text-red-700'
                        : item.urgenta === 'planificat'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                    )}
                  >
                    {item.urgenta}
                  </span>
                )}
              </div>
              <p className="font-medium text-gray-900 text-sm">{item.procedura}</p>
              {item.material_sugerat && (
                <p className="text-xs text-gray-500 mt-0.5">Material: {item.material_sugerat}</p>
              )}
              {item.tip_lucrare && (
                <p className="text-xs text-gray-500 mt-0.5">Tip: {item.tip_lucrare}</p>
              )}
              {item.indicatie && (
                <p className="text-xs text-gray-500 mt-0.5">Indicație: {item.indicatie}</p>
              )}
              {item.nr_canale_estimat && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Canale estimate: {item.nr_canale_estimat}
                </p>
              )}
              {item.frecventa && (
                <p className="text-xs text-gray-500 mt-0.5">Frecvență: {item.frecventa}</p>
              )}
              {item.observatii && (
                <p className="text-xs text-gray-600 mt-1 italic">{item.observatii}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PrioritizareView({ priority }: { priority: Prioritization | null }) {
  if (!priority) return <p className="text-sm text-gray-500 text-center py-6">Fără date de prioritizare</p>

  const sections = [
    { key: 'urgent', label: 'Urgent', color: 'border-l-red-500 bg-red-50/50', icon: '🔴', items: priority.urgent },
    { key: 'pe_termen_scurt', label: 'Termen scurt (1-3 luni)', color: 'border-l-orange-500 bg-orange-50/50', icon: '🟠', items: priority.pe_termen_scurt },
    { key: 'pe_termen_mediu', label: 'Termen mediu (3-6 luni)', color: 'border-l-yellow-500 bg-yellow-50/50', icon: '🟡', items: priority.pe_termen_mediu },
    { key: 'preventiv', label: 'Preventiv', color: 'border-l-green-500 bg-green-50/50', icon: '🟢', items: priority.preventiv },
  ]

  return (
    <div className="space-y-3">
      {sections.map((s) => (
        <div key={s.key} className={cn('rounded-xl border-l-4 p-4', s.color)}>
          <h4 className="font-semibold text-gray-900 text-sm mb-2">
            {s.icon} {s.label}
          </h4>
          {s.items && s.items.length > 0 ? (
            <ul className="space-y-1">
              {s.items.map((item, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Fără elemente</p>
          )}
        </div>
      ))}
    </div>
  )
}

interface TreatmentPlanTabsProps {
  planOdontal: TreatmentSection | null
  planParodontal: TreatmentSection | null
  planProtetic: TreatmentSection | null
  planChirurgical: TreatmentSection | null
  planEndodontic: TreatmentSection | null
  prioritizare: Prioritization | null
}

export function TreatmentPlanTabs({
  planOdontal,
  planParodontal,
  planProtetic,
  planChirurgical,
  planEndodontic,
  prioritizare,
}: TreatmentPlanTabsProps) {
  const [activeTab, setActiveTab] = useState<string>('odontal')

  const plans: Record<string, TreatmentSection | null> = {
    odontal: planOdontal,
    parodontal: planParodontal,
    protetic: planProtetic,
    chirurgical: planChirurgical,
    endodontic: planEndodontic,
  }

  const getCounts = (key: string) => {
    if (key === 'prioritizare') return null
    const plan = plans[key]
    return plan?.tratamente?.length ?? 0
  }

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 border-b border-gray-200">
        {tabs.map((tab) => {
          const count = getCounts(tab.key)
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {count !== null && count > 0 && (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="min-h-[200px]">
        {activeTab === 'prioritizare' ? (
          <PrioritizareView priority={prioritizare} />
        ) : (
          <TreatmentList section={plans[activeTab] ?? null} />
        )}
      </div>
    </div>
  )
}
