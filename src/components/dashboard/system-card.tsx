'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { System, StatusOption, PhaseOption } from '@/types/schema'

interface SystemCardProps {
  system: System
  statusOption: StatusOption | undefined
  phaseOption: PhaseOption | undefined
  onClick: () => void
}

export function SystemCard({ system, statusOption, phaseOption, onClick }: SystemCardProps) {
  const openIssues = system.issues.filter((i) => i.status !== 'closed').length
  const openRisks = system.keyItems.filter(
    (k) => k.type === 'risk' && k.status !== 'closed',
  ).length

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="font-medium">{system.name}</span>
          {statusOption && (
            <Badge
              variant="outline"
              className="border-transparent"
              style={{ backgroundColor: statusOption.color + '20', color: statusOption.color }}
            >
              {statusOption.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          {phaseOption && <span>フェーズ: {phaseOption.label}</span>}
          <span>担当: {system.owner}</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {openIssues > 0 && (
            <span className="text-amber-600">Issue: {openIssues}件</span>
          )}
          {openRisks > 0 && (
            <span className="text-red-600">リスク: {openRisks}件</span>
          )}
        </div>
        {system.comment && (
          <p className="line-clamp-2 text-xs text-zinc-500">{system.comment}</p>
        )}
      </CardContent>
    </Card>
  )
}
