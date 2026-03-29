'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Issue, KeyItem } from '@/types/schema'

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-blue-100', text: 'text-blue-700', label: '未対応' },
  'in-progress': { bg: 'bg-amber-100', text: 'text-amber-700', label: '対応中' },
  closed: { bg: 'bg-green-100', text: 'text-green-700', label: '完了' },
}

const priorityStyles: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-red-100', text: 'text-red-700', label: '高' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: '中' },
  low: { bg: 'bg-zinc-100', text: 'text-zinc-500', label: '低' },
}

const keyItemTypeLabels: Record<string, string> = {
  milestone: 'マイルストーン',
  risk: 'リスク',
  decision: '決定事項',
  dependency: '依存関係',
}

interface IssueCardProps {
  issue: Issue
  onClick: () => void
}

export function IssueCard({ issue, onClick }: IssueCardProps) {
  const status = statusStyles[issue.status]
  const priority = priorityStyles[issue.priority]

  return (
    <Card
      className="cursor-pointer p-3 transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-300 text-blue-600">
          Issue
        </Badge>
        {priority && (
          <Badge className={`text-[10px] px-1.5 py-0 ${priority.bg} ${priority.text} border-transparent`}>
            {priority.label}
          </Badge>
        )}
      </div>
      <p className="text-sm font-medium leading-tight mb-1.5 line-clamp-2">{issue.title}</p>
      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        {status && (
          <span className={`${status.text}`}>● {status.label}</span>
        )}
        {issue.assignee && <span className="truncate max-w-[100px]">{issue.assignee}</span>}
      </div>
    </Card>
  )
}

interface KeyItemCardProps {
  keyItem: KeyItem
  onClick: () => void
}

export function KeyItemCard({ keyItem, onClick }: KeyItemCardProps) {
  const status = statusStyles[keyItem.status]
  const typeLabel = keyItemTypeLabels[keyItem.type] ?? keyItem.type

  const typeBorderColor: Record<string, string> = {
    milestone: 'border-purple-300 text-purple-600',
    risk: 'border-red-300 text-red-600',
    decision: 'border-emerald-300 text-emerald-600',
    dependency: 'border-orange-300 text-orange-600',
  }

  return (
    <Card
      className="cursor-pointer p-3 transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${typeBorderColor[keyItem.type] ?? 'border-zinc-300 text-zinc-600'}`}
        >
          {typeLabel}
        </Badge>
      </div>
      <p className="text-sm font-medium leading-tight mb-1.5 line-clamp-2">{keyItem.title}</p>
      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        {status && (
          <span className={`${status.text}`}>● {status.label}</span>
        )}
        {keyItem.dueDate && <span>{keyItem.dueDate}</span>}
      </div>
    </Card>
  )
}
