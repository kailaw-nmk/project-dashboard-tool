'use client'

import { CheckSquare, ExternalLink, Flame, StickyNote } from 'lucide-react'
import { useProjectStore } from '@/stores/project-store'
import { getCurrentWeek } from '@/lib/week'
import type { Issue, KeyItem, KeyItemType } from '@/types/schema'

function isOverdue(dueDate: string | undefined, status: string): boolean {
  if (!dueDate || status === 'closed') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  return due < today
}

const statusLabels: Record<string, { color: string; darkColor: string; label: string }> = {
  open: { color: '#2563eb', darkColor: '#60a5fa', label: '未対応' },
  'in-progress': { color: '#d97706', darkColor: '#fbbf24', label: '対応中' },
  closed: { color: '#16a34a', darkColor: '#4ade80', label: '完了' },
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  high: { color: '#dc2626', label: '高' },
  medium: { color: '#d97706', label: '中' },
  low: { color: '#6b7280', label: '低' },
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

const keyItemTypeColors: Record<string, string> = {
  milestone: '#9333ea',
  risk: '#dc2626',
  decision: '#059669',
  dependency: '#ea580c',
}

/** インラインタグ */
function Tag({ label, borderColor, textColor }: { label: string; borderColor: string; textColor: string }) {
  return (
    <span
      style={{
        fontSize: '0.75em',
        lineHeight: 1,
        padding: '0.15em 0.4em',
        border: `1px solid ${borderColor}`,
        borderRadius: '0.25em',
        color: textColor,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

function UpdateIcon({ hasUpdate, onClick }: { hasUpdate: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      style={{ padding: 2, borderRadius: 3, display: 'flex', alignItems: 'center' }}
      className={`hover:bg-accent ${hasUpdate ? 'text-blue-500 dark:text-blue-400' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
      onClick={onClick}
      title="週次アップデート"
    >
      <StickyNote style={{ width: '1.1em', height: '1.1em' }} />
    </button>
  )
}

function ActionIcon({
  total,
  incomplete,
  onClick,
}: {
  total: number
  incomplete: number
  onClick: (e: React.MouseEvent) => void
}) {
  if (total === 0) {
    return (
      <button
        style={{ padding: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}
        className="hover:bg-accent text-muted-foreground/40 hover:text-muted-foreground"
        onClick={onClick}
        title="アクション (0件)"
      >
        <CheckSquare style={{ width: '1.1em', height: '1.1em' }} />
      </button>
    )
  }
  const allDone = incomplete === 0
  return (
    <button
      style={{ padding: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}
      className={`hover:bg-accent ${allDone ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
      onClick={onClick}
      title={`アクション ${incomplete}/${total} 未完了`}
    >
      <CheckSquare style={{ width: '1.1em', height: '1.1em' }} />
      <span style={{ fontSize: '0.7em', fontWeight: 600 }}>
        {incomplete}/{total}
      </span>
    </button>
  )
}

function LinkIcon({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ padding: 2, borderRadius: 3, display: 'flex', alignItems: 'center' }}
      className="hover:bg-accent text-blue-500 dark:text-blue-400 hover:text-blue-600"
      onClick={(e) => e.stopPropagation()}
      title={href}
    >
      <ExternalLink style={{ width: '1.1em', height: '1.1em' }} />
    </a>
  )
}

interface IssueCardProps {
  issue: Issue
  onClick: () => void
  onUpdateClick?: () => void
  onActionClick?: () => void
  linkMode?: boolean
  linkSelected?: boolean
  onLinkClick?: () => void
}

export function IssueCard({ issue, onClick, onUpdateClick, onActionClick, linkMode, linkSelected, onLinkClick }: IssueCardProps) {
  const statusInfo = statusLabels[issue.status]
  const priorityInfo = priorityConfig[issue.priority]
  const cardBg = priorityCardStyle[issue.priority] ?? {}
  const hasUpdate = (issue.weeklyUpdates ?? []).some((u) => u.week === getCurrentWeek())
  const overdue = isOverdue(issue.dueDate, issue.status)
  const totalActions = (issue.actions ?? []).length
  const incompleteActions = (issue.actions ?? []).filter((a) => a.status !== 'completed').length

  const ringClass = linkSelected
    ? 'ring-2 ring-emerald-500'
    : linkMode
      ? 'ring-2 ring-blue-400/50 hover:ring-blue-500'
      : ''

  return (
    <div
      className={`cursor-pointer rounded-lg bg-card ring-1 ring-foreground/10 p-2.5 transition-shadow hover:shadow-md ${ringClass}`}
      style={{ ...cardBg, fontSize: 'inherit' }}
      onClick={linkMode ? onLinkClick : onClick}
    >
      {/* Row 1: tags + icons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3em' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3em' }}>
          <Tag label="Issue" borderColor="#93c5fd" textColor="#2563eb" />
          {priorityInfo && (
            <Tag label={priorityInfo.label} borderColor={priorityInfo.color} textColor={priorityInfo.color} />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.15em' }}>
          {!linkMode && issue.externalLink && <LinkIcon href={issue.externalLink} />}
          {!linkMode && onActionClick && (
            <ActionIcon
              total={totalActions}
              incomplete={incompleteActions}
              onClick={(e) => { e.stopPropagation(); onActionClick() }}
            />
          )}
          {!linkMode && onUpdateClick && (
            <UpdateIcon hasUpdate={hasUpdate} onClick={(e) => { e.stopPropagation(); onUpdateClick() }} />
          )}
        </div>
      </div>

      {/* Row 2: title */}
      <p style={{ fontSize: '0.9em', fontWeight: 500, lineHeight: 1.3, marginBottom: '0.3em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {issue.title}
      </p>

      {/* Row 3: status + date + assignee */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75em' }} className="text-muted-foreground">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
          {statusInfo && (
            <span style={{ color: statusInfo.color }}>● {statusInfo.label}</span>
          )}
          {(issue.startDate || issue.dueDate) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2em', color: overdue ? '#dc2626' : undefined }}>
              {overdue && <Flame style={{ width: '1em', height: '1em' }} />}
              {issue.startDate && issue.dueDate
                ? `${issue.startDate} 〜 ${issue.dueDate}`
                : issue.dueDate || issue.startDate}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3em', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {issue.assignee && <span style={{ fontWeight: 700 }}>{issue.assignee}</span>}
          {issue.stakeholders && <span style={{ opacity: 0.7 }}>{issue.stakeholders}</span>}
        </div>
      </div>
    </div>
  )
}

interface KeyItemCardProps {
  keyItem: KeyItem
  onClick: () => void
  onUpdateClick?: () => void
  onActionClick?: () => void
  linkMode?: boolean
  linkSelected?: boolean
  onLinkClick?: () => void
}

export function KeyItemCard({ keyItem, onClick, onUpdateClick, onActionClick, linkMode, linkSelected, onLinkClick }: KeyItemCardProps) {
  const keyItemTypes = useProjectStore((s) => s.projectData?.settings.keyItemTypes)
  const statusInfo = statusLabels[keyItem.status]
  const customType = keyItemTypes?.find((t) => t.id === keyItem.type)
  const typeLabel = customType?.label ?? keyItemTypeLabels[keyItem.type] ?? keyItem.type
  const typeColor = keyItemTypeColors[keyItem.type] ?? '#6b7280'
  const hasUpdate = (keyItem.weeklyUpdates ?? []).some((u) => u.week === getCurrentWeek())
  const overdue = isOverdue(keyItem.dueDate, keyItem.status)
  const totalActions = (keyItem.actions ?? []).length
  const incompleteActions = (keyItem.actions ?? []).filter((a) => a.status !== 'completed').length

  const ringClass = linkSelected
    ? 'ring-2 ring-emerald-500'
    : linkMode
      ? 'ring-2 ring-blue-400/50 hover:ring-blue-500'
      : ''

  return (
    <div
      className={`cursor-pointer rounded-lg bg-card ring-1 ring-foreground/10 p-2.5 transition-shadow hover:shadow-md ${ringClass}`}
      style={{ fontSize: 'inherit' }}
      onClick={linkMode ? onLinkClick : onClick}
    >
      {/* Row 1: tags + icons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3em' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3em' }}>
          <Tag label={typeLabel} borderColor={typeColor} textColor={typeColor} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.15em' }}>
          {!linkMode && keyItem.externalLink && <LinkIcon href={keyItem.externalLink} />}
          {!linkMode && onActionClick && (
            <ActionIcon
              total={totalActions}
              incomplete={incompleteActions}
              onClick={(e) => { e.stopPropagation(); onActionClick() }}
            />
          )}
          {!linkMode && onUpdateClick && (
            <UpdateIcon hasUpdate={hasUpdate} onClick={(e) => { e.stopPropagation(); onUpdateClick() }} />
          )}
        </div>
      </div>

      {/* Row 2: title */}
      <p style={{ fontSize: '0.9em', fontWeight: 500, lineHeight: 1.3, marginBottom: '0.3em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {keyItem.title}
      </p>

      {/* Row 3: status + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75em' }} className="text-muted-foreground">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
          {statusInfo && (
            <span style={{ color: statusInfo.color }}>● {statusInfo.label}</span>
          )}
          {overdue && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2em', color: '#dc2626' }} title="期限超過">
              <Flame style={{ width: '1em', height: '1em' }} />
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3em' }}>
          {(keyItem.startDate || keyItem.dueDate) && (
            <span>
              {keyItem.startDate && keyItem.dueDate
                ? `${keyItem.startDate} 〜 ${keyItem.dueDate}`
                : keyItem.dueDate || keyItem.startDate}
            </span>
          )}
        </div>
      </div>
      {/* Row 4: assignee + stakeholders */}
      {(keyItem.assignee || keyItem.stakeholders) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3em', fontSize: '0.75em', marginTop: '0.2em' }} className="text-muted-foreground">
          {keyItem.assignee && <span style={{ fontWeight: 700 }}>{keyItem.assignee}</span>}
          {keyItem.stakeholders && <span style={{ opacity: 0.7 }}>{keyItem.stakeholders}</span>}
        </div>
      )}
    </div>
  )
}
