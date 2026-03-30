'use client'

import { ExternalLink, Flame, StickyNote } from 'lucide-react'
import { getCurrentWeek } from '@/lib/week'
import type { Issue, KeyItem } from '@/types/schema'

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
  linkMode?: boolean
  linkSelected?: boolean
  onLinkClick?: () => void
}

export function IssueCard({ issue, onClick, onUpdateClick, linkMode, linkSelected, onLinkClick }: IssueCardProps) {
  const statusInfo = statusLabels[issue.status]
  const priorityInfo = priorityConfig[issue.priority]
  const cardBg = priorityCardStyle[issue.priority] ?? {}
  const hasUpdate = (issue.weeklyUpdates ?? []).some((u) => u.week === getCurrentWeek())
  const overdue = isOverdue(issue.dueDate, issue.status)

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
          {issue.dueDate && (
            overdue ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2em', color: '#dc2626' }} title="期限超過">
                <Flame style={{ width: '1em', height: '1em' }} />
                <span>{issue.dueDate}</span>
              </span>
            ) : (
              <span>{issue.dueDate}</span>
            )
          )}
        </div>
        {issue.assignee && <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.assignee}</span>}
      </div>
    </div>
  )
}

interface KeyItemCardProps {
  keyItem: KeyItem
  onClick: () => void
  onUpdateClick?: () => void
  linkMode?: boolean
  linkSelected?: boolean
  onLinkClick?: () => void
}

export function KeyItemCard({ keyItem, onClick, onUpdateClick, linkMode, linkSelected, onLinkClick }: KeyItemCardProps) {
  const statusInfo = statusLabels[keyItem.status]
  const typeLabel = keyItemTypeLabels[keyItem.type] ?? keyItem.type
  const typeColor = keyItemTypeColors[keyItem.type] ?? '#6b7280'
  const hasUpdate = (keyItem.weeklyUpdates ?? []).some((u) => u.week === getCurrentWeek())
  const overdue = isOverdue(keyItem.dueDate, keyItem.status)

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
        {keyItem.dueDate && <span>{keyItem.dueDate}</span>}
      </div>
    </div>
  )
}
