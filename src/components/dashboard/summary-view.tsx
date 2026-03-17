'use client'

import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'
import { StatusSummary } from '@/components/dashboard/status-summary'
import { SystemCard } from '@/components/dashboard/system-card'

export function SummaryView() {
  const { systems, settings } = useProjectStore(
    useShallow((s) => ({
      systems: s.projectData?.systems ?? [],
      settings: s.projectData?.settings,
    })),
  )
  const setSelectedSystemId = useProjectStore((s) => s.setSelectedSystemId)

  if (!settings) return null

  return (
    <div className="flex flex-col gap-6">
      <StatusSummary systems={systems} statusOptions={settings.statusOptions} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {systems.map((system) => (
          <SystemCard
            key={system.id}
            system={system}
            statusOption={settings.statusOptions.find((o) => o.id === system.status)}
            phaseOption={settings.phaseOptions.find((o) => o.id === system.phase)}
            onClick={() => setSelectedSystemId(system.id)}
          />
        ))}
      </div>
    </div>
  )
}
