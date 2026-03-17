'use client'

import type { System, StatusOption } from '@/types/schema'

interface StatusSummaryProps {
  systems: System[]
  statusOptions: StatusOption[]
}

export function StatusSummary({ systems, statusOptions }: StatusSummaryProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {statusOptions.map((opt) => {
        const count = systems.filter((s) => s.status === opt.id).length
        return (
          <div
            key={opt.id}
            className="rounded-lg border bg-white p-4 text-center"
          >
            <div className="mb-1 flex items-center justify-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: opt.color }}
              />
              <span className="text-sm text-zinc-600">{opt.label}</span>
            </div>
            <p className="text-3xl font-bold">{count}</p>
          </div>
        )
      })}
    </div>
  )
}
