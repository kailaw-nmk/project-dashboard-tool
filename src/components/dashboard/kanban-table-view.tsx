'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Flame } from 'lucide-react'
import { useProjectStore } from '@/stores/project-store'
import { IssueFormDialog } from '@/components/system/issue-form-dialog'
import { KeyItemFormDialog } from '@/components/system/key-item-form-dialog'
import { getCurrentWeek, getPreviousWeek } from '@/lib/week'
import type { System, Issue, KeyItem } from '@/types/schema'

type ItemCategory = string

const typeLabels: Record<string, string> = {
  issue: 'Issue',
  milestone: 'マイルストーン',
  risk: 'リスク',
  decision: '決定事項',
  dependency: '依存関係',
}

const typeColors: Record<string, string> = {
  issue: '#2563eb',
  milestone: '#9333ea',
  risk: '#dc2626',
  decision: '#059669',
  dependency: '#ea580c',
}

const statusLabels: Record<string, string> = {
  open: '未対応',
  'in-progress': '対応中',
  closed: '完了',
}

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const priorityColors: Record<string, string> = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#6b7280',
}

function isOverdue(dueDate: string | undefined, status: string): boolean {
  if (!dueDate || status === 'closed') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dueDate) < today
}

type FlatItem = {
  systemId: string
  systemName: string
  kind: 'issue' | 'keyItem'
  type: string
  issue?: Issue
  keyItem?: KeyItem
  id: string
  title: string
  status: string
  priority?: string
  assignee: string
  stakeholders: string
  dueDate: string
  weeklyComment: string
  lastWeekComment: string
}

function getWeeklyComment(updates: { week: string; content: string }[] | undefined, week: string): string {
  if (!updates) return ''
  return updates.find((u) => u.week === week)?.content ?? ''
}

function flattenItems(systems: System[], activeFilters: Set<ItemCategory>, selectedSystemId: string | null, statusFilter?: Set<string>): FlatItem[] {
  const targetSystems = selectedSystemId ? systems.filter((s) => s.id === selectedSystemId) : systems
  const items: FlatItem[] = []
  const currentWeek = getCurrentWeek()
  const previousWeek = getPreviousWeek()

  for (const sys of targetSystems) {
    if (activeFilters.size === 0 || activeFilters.has('issue')) {
      for (const issue of sys.issues) {
        items.push({
          systemId: sys.id, systemName: sys.name, kind: 'issue', type: 'issue', issue,
          id: issue.id, title: issue.title, status: issue.status, priority: issue.priority,
          assignee: issue.assignee, stakeholders: issue.stakeholders ?? '', dueDate: issue.dueDate,
          weeklyComment: getWeeklyComment(issue.weeklyUpdates, currentWeek),
          lastWeekComment: getWeeklyComment(issue.weeklyUpdates, previousWeek),
        })
      }
    }
    for (const ki of sys.keyItems) {
      const cat = ki.type as ItemCategory
      if (activeFilters.size > 0 && !activeFilters.has(cat)) continue
      items.push({
        systemId: sys.id, systemName: sys.name, kind: 'keyItem', type: ki.type, keyItem: ki,
        id: ki.id, title: ki.title, status: ki.status,
        assignee: ki.assignee ?? '', stakeholders: ki.stakeholders ?? '', dueDate: ki.dueDate ?? '',
        weeklyComment: getWeeklyComment(ki.weeklyUpdates, currentWeek),
        lastWeekComment: getWeeklyComment(ki.weeklyUpdates, previousWeek),
      })
    }
  }
  if (statusFilter && statusFilter.size > 0) {
    return items.filter((item) => statusFilter.has(item.status))
  }
  return items
}

// Column definitions
const columns = [
  { key: 'type', label: 'タイプ', defaultWidth: 100 },
  { key: 'title', label: 'タイトル', defaultWidth: 250 },
  { key: 'status', label: 'ステータス', defaultWidth: 80 },
  { key: 'priority', label: '優先度', defaultWidth: 60 },
  { key: 'assignee', label: '担当', defaultWidth: 120 },
  { key: 'dueDate', label: '期限', defaultWidth: 100 },
  { key: 'comment', label: '今週のコメント', defaultWidth: 200 },
  { key: 'lastWeekComment', label: '先週のコメント', defaultWidth: 200 },
]

interface KanbanTableViewProps {
  systems: System[]
  activeFilters: Set<ItemCategory>
  selectedSystemId: string | null
  statusFilter?: Set<string>
}

export function KanbanTableView({ systems, activeFilters, selectedSystemId, statusFilter }: KanbanTableViewProps) {
  const keyItemTypes = useProjectStore((s) => s.projectData?.settings.keyItemTypes ?? [])
  const dynamicTypeLabels: Record<string, string> = { issue: 'Issue' }
  for (const t of keyItemTypes) dynamicTypeLabels[t.id] = t.label

  const [editingIssue, setEditingIssue] = useState<{ systemId: string; issue: Issue } | null>(null)
  const [editingKeyItem, setEditingKeyItem] = useState<{ systemId: string; keyItem: KeyItem } | null>(null)
  const [colWidths, setColWidths] = useState(() => columns.map((c) => c.defaultWidth))

  const items = flattenItems(systems, activeFilters, selectedSystemId, statusFilter)

  const showSystemHeaders = !selectedSystemId
  const grouped = new Map<string, { name: string; items: FlatItem[] }>()
  for (const item of items) {
    if (!grouped.has(item.systemId)) {
      grouped.set(item.systemId, { name: item.systemName, items: [] })
    }
    grouped.get(item.systemId)!.items.push(item)
  }

  // Resize logic
  const resizingRef = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null)

  const onMouseDown = useCallback((colIndex: number, e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current = { colIndex, startX: e.clientX, startWidth: colWidths[colIndex] }

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const diff = ev.clientX - resizingRef.current.startX
      const newWidth = Math.max(40, resizingRef.current.startWidth + diff)
      setColWidths((prev) => prev.map((w, i) => (i === resizingRef.current!.colIndex ? newWidth : w)))
    }

    const onMouseUp = () => {
      resizingRef.current = null
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [colWidths])

  const handleRowClick = (item: FlatItem) => {
    if (item.kind === 'issue' && item.issue) {
      setEditingIssue({ systemId: item.systemId, issue: item.issue })
    } else if (item.kind === 'keyItem' && item.keyItem) {
      setEditingKeyItem({ systemId: item.systemId, keyItem: item.keyItem })
    }
  }

  const renderRow = (item: FlatItem) => {
    const overdue = isOverdue(item.dueDate, item.status)
    const tColor = typeColors[item.type] ?? '#6b7280'
    const pColor = item.priority ? priorityColors[item.priority] : undefined
    const cellStyle = (i: number): React.CSSProperties => ({ padding: '0.4em 0.6em', width: colWidths[i], maxWidth: colWidths[i], overflow: 'hidden' })

    return (
      <tr
        key={item.id}
        className="cursor-pointer hover:bg-accent/50 border-b border-border"
        onClick={() => handleRowClick(item)}
      >
        <td style={cellStyle(0)}>
          <span style={{ fontSize: '0.8em', padding: '0.1em 0.35em', border: `1px solid ${tColor}`, borderRadius: 3, color: tColor, whiteSpace: 'nowrap' }}>
            {dynamicTypeLabels[item.type] ?? typeLabels[item.type] ?? item.type}
          </span>
        </td>
        <td style={{ ...cellStyle(1), fontWeight: 500, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</td>
        <td style={{ ...cellStyle(2), fontSize: '0.85em' }}>{statusLabels[item.status] ?? item.status}</td>
        <td style={cellStyle(3)}>
          {item.priority && pColor && (
            <span style={{ fontSize: '0.8em', padding: '0.1em 0.35em', borderRadius: 3, color: '#fff', backgroundColor: pColor }}>
              {priorityLabels[item.priority]}
            </span>
          )}
        </td>
        <td style={{ ...cellStyle(4), fontSize: '0.85em' }}>
          {item.assignee && <span style={{ fontWeight: 700 }}>{item.assignee}</span>}
          {item.stakeholders && <span style={{ opacity: 0.6, marginLeft: '0.3em' }}>{item.stakeholders}</span>}
        </td>
        <td style={{ ...cellStyle(5), fontSize: '0.85em' }}>
          {item.dueDate && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2em', color: overdue ? '#dc2626' : undefined }}>
              {overdue && <Flame style={{ width: '1em', height: '1em' }} />}
              {item.dueDate}
            </span>
          )}
        </td>
        <td
          className="text-foreground"
          style={{ ...cellStyle(6), fontSize: '0.8em', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'visible' }}
        >
          {item.weeklyComment}
        </td>
        <td
          className="text-muted-foreground"
          style={{ ...cellStyle(7), fontSize: '0.8em', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'visible' }}
        >
          {item.lastWeekComment}
        </td>
      </tr>
    )
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground text-center py-8" style={{ fontSize: '0.9em' }}>アイテムなし</p>
  }

  const totalWidth = colWidths.reduce((a, b) => a + b, 0)

  return (
    <>
      <div className="rounded-lg border bg-card overflow-auto">
        <table style={{ width: totalWidth, tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: 'inherit' }}>
          <thead>
            <tr className="border-b border-border" style={{ fontSize: '0.8em' }}>
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  className="text-muted-foreground"
                  style={{ padding: '0.5em 0.6em', textAlign: 'left', fontWeight: 500, whiteSpace: 'nowrap', width: colWidths[i], position: 'relative', userSelect: 'none' }}
                >
                  {col.label}
                  <div
                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, cursor: 'col-resize', background: 'transparent' }}
                    onMouseDown={(e) => onMouseDown(i, e)}
                    className="hover:bg-primary/30"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showSystemHeaders
              ? Array.from(grouped.entries()).map(([sysId, group]) => (
                  <React.Fragment key={sysId}>
                    <tr>
                      <td
                        colSpan={columns.length}
                        style={{ padding: '0.5em 0.6em', fontWeight: 600, fontSize: '0.85em' }}
                        className="bg-muted"
                      >
                        {group.name}
                        <span className="text-muted-foreground" style={{ fontWeight: 400, marginLeft: '0.5em' }}>
                          ({group.items.length})
                        </span>
                      </td>
                    </tr>
                    {group.items.map(renderRow)}
                  </React.Fragment>
                ))
              : items.map(renderRow)
            }
          </tbody>
        </table>
      </div>

      {editingIssue && (
        <IssueFormDialog
          open={true}
          onOpenChange={(open) => { if (!open) setEditingIssue(null) }}
          systemId={editingIssue.systemId}
          editData={editingIssue.issue}
        />
      )}
      {editingKeyItem && (
        <KeyItemFormDialog
          open={true}
          onOpenChange={(open) => { if (!open) setEditingKeyItem(null) }}
          systemId={editingKeyItem.systemId}
          editData={editingKeyItem.keyItem}
        />
      )}
    </>
  )
}
