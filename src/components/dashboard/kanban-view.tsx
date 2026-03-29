'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'
import { Badge } from '@/components/ui/badge'
import { IssueCard, KeyItemCard } from '@/components/dashboard/kanban-card'
import type { System, Issue, KeyItem } from '@/types/schema'

type KanbanItem =
  | { kind: 'issue'; data: Issue }
  | { kind: 'keyItem'; data: KeyItem }

function groupByStatus(system: System) {
  const items: KanbanItem[] = [
    ...system.issues.map((i) => ({ kind: 'issue' as const, data: i })),
    ...system.keyItems.map((k) => ({ kind: 'keyItem' as const, data: k })),
  ]

  const groups: Record<string, KanbanItem[]> = {
    open: [],
    'in-progress': [],
    closed: [],
  }

  for (const item of items) {
    const status = item.data.status
    if (groups[status]) {
      groups[status].push(item)
    }
  }

  return groups
}

const statusSectionLabels: Record<string, string> = {
  open: '未対応',
  'in-progress': '対応中',
  closed: '完了',
}

function SystemColumn({ system, statusOption, onClick }: {
  system: System
  statusOption: { label: string; color: string } | undefined
  onClick: () => void
}) {
  const [closedOpen, setClosedOpen] = useState(false)
  const groups = groupByStatus(system)
  const hasItems = system.issues.length > 0 || system.keyItems.length > 0

  return (
    <div className="flex flex-col w-[290px] min-w-[290px] bg-zinc-50 rounded-lg border">
      {/* Column header */}
      <div
        className="flex items-center justify-between p-3 border-b cursor-pointer hover:bg-zinc-100"
        onClick={onClick}
      >
        <span className="font-medium text-sm truncate">{system.name}</span>
        {statusOption && (
          <Badge
            variant="outline"
            className="border-transparent text-xs shrink-0 ml-2"
            style={{ backgroundColor: statusOption.color + '20', color: statusOption.color }}
          >
            {statusOption.label}
          </Badge>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {!hasItems && (
          <p className="text-xs text-zinc-400 text-center py-4">アイテムなし</p>
        )}

        {(['open', 'in-progress'] as const).map((status) => {
          const items = groups[status]
          if (items.length === 0) return null
          return (
            <div key={status}>
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <span className="text-[11px] font-medium text-zinc-500">
                  {statusSectionLabels[status]}
                </span>
                <span className="text-[11px] text-zinc-400">{items.length}</span>
              </div>
              <div className="space-y-1.5">
                {items.map((item) =>
                  item.kind === 'issue' ? (
                    <IssueCard key={item.data.id} issue={item.data} onClick={onClick} />
                  ) : (
                    <KeyItemCard key={item.data.id} keyItem={item.data} onClick={onClick} />
                  ),
                )}
              </div>
            </div>
          )
        })}

        {/* Closed section - collapsible */}
        {groups.closed.length > 0 && (
          <div>
            <button
              className="flex items-center gap-1 px-1 mb-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-600"
              onClick={(e) => {
                e.stopPropagation()
                setClosedOpen(!closedOpen)
              }}
            >
              {closedOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {statusSectionLabels.closed}
              <span className="text-zinc-400">{groups.closed.length}</span>
            </button>
            {closedOpen && (
              <div className="space-y-1.5">
                {groups.closed.map((item) =>
                  item.kind === 'issue' ? (
                    <IssueCard key={item.data.id} issue={item.data} onClick={onClick} />
                  ) : (
                    <KeyItemCard key={item.data.id} keyItem={item.data} onClick={onClick} />
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function KanbanView() {
  const { systems, settings } = useProjectStore(
    useShallow((s) => ({
      systems: s.projectData?.systems ?? [],
      settings: s.projectData?.settings,
    })),
  )
  const setSelectedSystemId = useProjectStore((s) => s.setSelectedSystemId)

  if (!settings) return null

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-min">
        {systems.map((system) => (
          <SystemColumn
            key={system.id}
            system={system}
            statusOption={settings.statusOptions.find((o) => o.id === system.status)}
            onClick={() => setSelectedSystemId(system.id)}
          />
        ))}
      </div>
    </div>
  )
}
