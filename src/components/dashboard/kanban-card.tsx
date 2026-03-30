'use client'

import { Flame, StickyNote } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentWeek } from '@/lib/week'
import type { Issue, KeyItem } from '@/types/schema'

function isOverdue(dueDate: string | undefined, status: string): boolean {
  if (!dueDate || status === 'closed') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  return due < today
}

const statusStyles: Record<string, { text: string; label: string }> = {
  open: { text: 'text-blue-600 dark:text-blue-400', label: '未対応' },
  'in-progress': { text: 'text-amber-600 dark:text-amber-400', label: '対応中' },
  closed: { text: 'text-green-600 dark:text-green-400', label: '完了' },
}

const priorityStyles: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', label: '高' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', label: '中' },
  low: { bg: 'bg-muted', text: 'text-muted-foreground', label: '低' },
}

const priorityCardStyle: Record<string, React.CSSProperties> = {
  high: { backgroundColor: 'var(--priority-high-bg)' },
  medium: { backgroundColor: 'var(--priority-medium-bg)' },
  low: {},
}

const keyItemTypeLabels: Record<string, string> = {
  milestone: 'マイルストーン',
  risk: 'リスク',
  decision: '決定事項',
  dependency: '依存関係',
}

function UpdateIcon({ hasUpdate, onClick }: { hasUpdate: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      className={`p-0.5 rounded hover:bg-accent ${hasUpdate ? 'text-blue-500 dark:text-blue-400' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
      onClick={onClick}
      title="週次アップデート"
    >
      <StickyNote className="h-3.5 w-3.5" />
    </button>
  )
}

interface IssueCardProps {
  issue: Issue
  onClick: () => void
  onUpdateClick?: () => void
}

export function IssueCard({ issue, onClick, onUpdateClick }: IssueCardProps) {
  const status = statusStyles[issue.status]
  const priority = priorityStyles[issue.priority]
  const cardStyle = priorityCardStyle[issue.priority] ?? {}
  const hasUpdate = (issue.weeklyUpdates ?? []).some((u) => u.week === getCurrentWeek())
  const overdue = isOverdue(issue.dueDate, issue.status)

  return (
    <Card
      className="cursor-pointer p-3 transition-shadow hover:shadow-md"
      style={cardStyle}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400">
            Issue
          </Badge>
          {priority && (
            <Badge className={`text-[10px] px-1.5 py-0 ${priority.bg} ${priority.text} border-transparent`}>
              {priority.label}
            </Badge>
          )}
        </div>
        {onUpdateClick && (
          <UpdateIcon hasUpdate={hasUpdate} onClick={(e) => { e.stopPropagation(); onUpdateClick() }} />
        )}
      </div>
      <p className="text-sm font-medium leading-tight mb-1.5 line-clamp-2">{issue.title}</p>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {status && (
            <span className={`${status.text}`}>● {status.label}</span>
          )}
          {overdue && (
            <span className="flex items-center gap-0.5 text-red-500 dark:text-red-400" title="期限超過">
              <Flame className="h-3 w-3" />
              <span className="text-[10px]">{issue.dueDate}</span>
            </span>
          )}
        </div>
        {issue.assignee && <span className="truncate max-w-[100px]">{issue.assignee}</span>}
      </div>
    </Card>
  )
}

interface KeyItemCardProps {
  keyItem: KeyItem
  onClick: () => void
  onUpdateClick?: () => void
}

export function KeyItemCard({ keyItem, onClick, onUpdateClick }: KeyItemCardProps) {
  const status = statusStyles[keyItem.status]
  const typeLabel = keyItemTypeLabels[keyItem.type] ?? keyItem.type
  const hasUpdate = (keyItem.weeklyUpdates ?? []).some((u) => u.week === getCurrentWeek())
  const overdue = isOverdue(keyItem.dueDate, keyItem.status)

  const typeBorderColor: Record<string, string> = {
    milestone: 'border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400',
    risk: 'border-red-300 dark:border-red-700 text-red-600 dark:text-red-400',
    decision: 'border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400',
    dependency: 'border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400',
  }

  return (
    <Card
      className="cursor-pointer p-3 transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${typeBorderColor[keyItem.type] ?? 'border-border text-muted-foreground'}`}
          >
            {typeLabel}
          </Badge>
        </div>
        {onUpdateClick && (
          <UpdateIcon hasUpdate={hasUpdate} onClick={(e) => { e.stopPropagation(); onUpdateClick() }} />
        )}
      </div>
      <p className="text-sm font-medium leading-tight mb-1.5 line-clamp-2">{keyItem.title}</p>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {status && (
            <span className={`${status.text}`}>● {status.label}</span>
          )}
          {overdue && (
            <span className="flex items-center gap-0.5 text-red-500 dark:text-red-400" title="期限超過">
              <Flame className="h-3 w-3" />
            </span>
          )}
        </div>
        {keyItem.dueDate && <span>{keyItem.dueDate}</span>}
      </div>
    </Card>
  )
}
