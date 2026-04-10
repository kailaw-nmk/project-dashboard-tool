'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Flame, ExternalLink, List, Users } from 'lucide-react'
import { useProjectStore } from '@/stores/project-store'
import { IssueFormDialog } from '@/components/system/issue-form-dialog'
import { KeyItemFormDialog } from '@/components/system/key-item-form-dialog'
import { getCurrentWeek, getPreviousWeek } from '@/lib/week'
import type { System, Issue, KeyItem, Action, ActionStatus } from '@/types/schema'

// --- 列幅 localStorage 永続化 ---
function loadColWidths(key: string, defaults: number[]): number[] {
  if (typeof window === 'undefined') return defaults
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as number[]
    if (!Array.isArray(parsed) || parsed.length !== defaults.length) return defaults
    return parsed.map((n, i) => (typeof n === 'number' && n > 0 ? n : defaults[i]))
  } catch {
    return defaults
  }
}
function saveColWidths(key: string, widths: number[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(widths))
  } catch {
    // ignore
  }
}

function usePersistentColWidths(storageKey: string, defaults: number[]) {
  const [widths, setWidths] = useState<number[]>(() => loadColWidths(storageKey, defaults))
  useEffect(() => {
    saveColWidths(storageKey, widths)
  }, [storageKey, widths])
  return [widths, setWidths] as const
}

const ITEM_COL_STORAGE_KEY = 'project-dashboard-item-col-widths'
const ACTION_COL_STORAGE_KEY = 'project-dashboard-action-col-widths-v2'

const actionStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '未着手', color: '#6b7280' },
  'in-progress': { label: '対応中', color: '#d97706' },
  completed: { label: '完了', color: '#16a34a' },
  'on-hold': { label: '保留', color: '#9333ea' },
}

type ViewMode = 'items' | 'actions'
type ActionGroupMode = 'none' | 'owner'

type FlatAction = {
  action: Action
  systemId: string
  systemName: string
  parentId: string
  parentTitle: string
  parentType: string
  parentKind: 'issue' | 'keyItem'
  issue?: Issue
  keyItem?: KeyItem
  weeklyComment: string
  lastWeekComment: string
}

function flattenActions(
  systems: System[],
  selectedSystemId: string | null,
): FlatAction[] {
  const targets = selectedSystemId ? systems.filter((s) => s.id === selectedSystemId) : systems
  const result: FlatAction[] = []
  const currentWeek = getCurrentWeek()
  const previousWeek = getPreviousWeek()
  for (const sys of targets) {
    for (const issue of sys.issues) {
      for (const a of issue.actions ?? []) {
        result.push({
          action: a,
          systemId: sys.id,
          systemName: sys.name,
          parentId: issue.id,
          parentTitle: issue.title,
          parentType: 'issue',
          parentKind: 'issue',
          issue,
          weeklyComment: getWeeklyComment(issue.weeklyUpdates, currentWeek),
          lastWeekComment: getWeeklyComment(issue.weeklyUpdates, previousWeek),
        })
      }
    }
    for (const ki of sys.keyItems) {
      for (const a of ki.actions ?? []) {
        result.push({
          action: a,
          systemId: sys.id,
          systemName: sys.name,
          parentId: ki.id,
          parentTitle: ki.title,
          parentType: ki.type,
          parentKind: 'keyItem',
          keyItem: ki,
          weeklyComment: getWeeklyComment(ki.weeklyUpdates, currentWeek),
          lastWeekComment: getWeeklyComment(ki.weeklyUpdates, previousWeek),
        })
      }
    }
  }
  return result
}

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
  actions: Action[]
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
          actions: issue.actions ?? [],
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
        actions: ki.actions ?? [],
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
  { key: 'actions', label: 'アクション', defaultWidth: 200 },
  { key: 'comment', label: '今週のコメント', defaultWidth: 200 },
  { key: 'lastWeekComment', label: '先週のコメント', defaultWidth: 200 },
]

type ActionSortKey = 'owner' | 'status' | 'dueDate' | 'systemName'

const actionColumns: { key: string; label: string; defaultWidth: number; sortKey?: ActionSortKey }[] = [
  { key: 'parent', label: '親アイテム', defaultWidth: 220 },
  { key: 'owner', label: '担当者', defaultWidth: 100, sortKey: 'owner' },
  { key: 'description', label: '内容', defaultWidth: 280 },
  { key: 'status', label: 'ステータス', defaultWidth: 90, sortKey: 'status' },
  { key: 'dueDate', label: '期限', defaultWidth: 100, sortKey: 'dueDate' },
  { key: 'system', label: 'システム', defaultWidth: 120, sortKey: 'systemName' },
  { key: 'link', label: '', defaultWidth: 30 },
  { key: 'comment', label: '今週のコメント', defaultWidth: 200 },
  { key: 'lastWeekComment', label: '先週のコメント', defaultWidth: 200 },
]

const actionStatusOrder: Record<string, number> = {
  'in-progress': 0,
  pending: 1,
  'on-hold': 2,
  completed: 3,
}

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
  const [colWidths, setColWidths] = usePersistentColWidths(
    ITEM_COL_STORAGE_KEY,
    columns.map((c) => c.defaultWidth),
  )
  const [actionColWidths, setActionColWidths] = usePersistentColWidths(
    ACTION_COL_STORAGE_KEY,
    actionColumns.map((c) => c.defaultWidth),
  )
  const [viewMode, setViewMode] = useState<ViewMode>('items')
  const [groupMode, setGroupMode] = useState<ActionGroupMode>('none')
  const [actionStatusFilterSet, setActionStatusFilterSet] = useState<Set<ActionStatus>>(new Set())
  const [actionSort, setActionSort] = useState<{ key: ActionSortKey; dir: 'asc' | 'desc' } | null>(null)

  const items = flattenItems(systems, activeFilters, selectedSystemId, statusFilter)

  const showSystemHeaders = !selectedSystemId
  const grouped = new Map<string, { name: string; items: FlatItem[] }>()
  for (const item of items) {
    if (!grouped.has(item.systemId)) {
      grouped.set(item.systemId, { name: item.systemName, items: [] })
    }
    grouped.get(item.systemId)!.items.push(item)
  }

  // Resize logic (generic)
  const resizingRef = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null)

  const makeMouseDown = useCallback(
    (
      widths: number[],
      setWidths: React.Dispatch<React.SetStateAction<number[]>>,
    ) =>
    (colIndex: number, e: React.MouseEvent) => {
      e.preventDefault()
      resizingRef.current = { colIndex, startX: e.clientX, startWidth: widths[colIndex] }

      const onMouseMove = (ev: MouseEvent) => {
        if (!resizingRef.current) return
        const diff = ev.clientX - resizingRef.current.startX
        const newWidth = Math.max(40, resizingRef.current.startWidth + diff)
        setWidths((prev) => prev.map((w, i) => (i === resizingRef.current!.colIndex ? newWidth : w)))
      }

      const onMouseUp = () => {
        resizingRef.current = null
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [],
  )

  const onMouseDown = makeMouseDown(colWidths, setColWidths)
  const onActionMouseDown = makeMouseDown(actionColWidths, setActionColWidths)

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
    const wrapCell = (i: number): React.CSSProperties => ({ padding: '0.4em 0.6em', width: colWidths[i], maxWidth: colWidths[i], whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'visible' })

    return (
      <tr
        key={item.id}
        className="cursor-pointer hover:bg-accent/50 border-b border-border"
        onClick={() => handleRowClick(item)}
      >
        <td style={wrapCell(0)}>
          <span style={{ fontSize: '0.8em', padding: '0.1em 0.35em', border: `1px solid ${tColor}`, borderRadius: 3, color: tColor }}>
            {dynamicTypeLabels[item.type] ?? typeLabels[item.type] ?? item.type}
          </span>
        </td>
        <td style={{ ...wrapCell(1), fontWeight: 500 }}>{item.title}</td>
        <td style={{ ...wrapCell(2), fontSize: '0.85em' }}>{statusLabels[item.status] ?? item.status}</td>
        <td style={wrapCell(3)}>
          {item.priority && pColor && (
            <span style={{ fontSize: '0.8em', padding: '0.1em 0.35em', borderRadius: 3, color: '#fff', backgroundColor: pColor }}>
              {priorityLabels[item.priority]}
            </span>
          )}
        </td>
        <td style={{ ...wrapCell(4), fontSize: '0.85em' }}>
          {item.assignee && <span style={{ fontWeight: 700 }}>{item.assignee}</span>}
          {item.stakeholders && <span style={{ opacity: 0.6, marginLeft: '0.3em' }}>{item.stakeholders}</span>}
        </td>
        <td style={{ ...wrapCell(5), fontSize: '0.85em' }}>
          {item.dueDate && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2em', color: overdue ? '#dc2626' : undefined }}>
              {overdue && <Flame style={{ width: '1em', height: '1em' }} />}
              {item.dueDate}
            </span>
          )}
        </td>
        <td style={{ ...wrapCell(6), fontSize: '0.8em' }}>
          {item.actions.length > 0 && (() => {
            const incomplete = item.actions.filter((a) => a.status !== 'completed').length
            const owners = Array.from(new Set(item.actions.filter((a) => a.status !== 'completed').map((a) => a.owner).filter(Boolean)))
            const allDone = incomplete === 0
            return (
              <span>
                <span style={{ fontWeight: 600, color: allDone ? '#16a34a' : '#d97706' }}>
                  {incomplete}/{item.actions.length}
                </span>
                {owners.length > 0 && (
                  <span style={{ opacity: 0.7, marginLeft: '0.3em' }}>
                    {owners.join(', ')}
                  </span>
                )}
              </span>
            )
          })()}
        </td>
        <td
          className="text-foreground"
          style={{ ...wrapCell(7), fontSize: '0.8em' }}
        >
          {item.weeklyComment}
        </td>
        <td
          className="text-muted-foreground"
          style={{ ...wrapCell(8), fontSize: '0.8em' }}
        >
          {item.lastWeekComment}
        </td>
      </tr>
    )
  }

  const totalWidth = colWidths.reduce((a, b) => a + b, 0)
  const actionTotalWidth = actionColWidths.reduce((a, b) => a + b, 0)

  // --- Action view data ---
  const allActions = flattenActions(systems, selectedSystemId)

  // status filter
  const filteredActions0 =
    actionStatusFilterSet.size === 0
      ? allActions
      : allActions.filter((fa) => actionStatusFilterSet.has(fa.action.status))

  // sort
  const filteredActions = actionSort
    ? [...filteredActions0].sort((a, b) => {
        const key = actionSort.key
        let av: string | number = ''
        let bv: string | number = ''
        if (key === 'owner') {
          av = a.action.owner ?? ''
          bv = b.action.owner ?? ''
        } else if (key === 'status') {
          av = actionStatusOrder[a.action.status] ?? 99
          bv = actionStatusOrder[b.action.status] ?? 99
        } else if (key === 'dueDate') {
          // 空の期限は末尾に送る
          av = a.action.dueDate || '9999-12-31'
          bv = b.action.dueDate || '9999-12-31'
        } else if (key === 'systemName') {
          av = a.systemName ?? ''
          bv = b.systemName ?? ''
        }
        if (av < bv) return actionSort.dir === 'asc' ? -1 : 1
        if (av > bv) return actionSort.dir === 'asc' ? 1 : -1
        return 0
      })
    : filteredActions0

  const actionsGrouped = new Map<string, FlatAction[]>()
  if (viewMode === 'actions' && groupMode === 'owner') {
    for (const fa of filteredActions) {
      const key = fa.action.owner || '(未設定)'
      if (!actionsGrouped.has(key)) actionsGrouped.set(key, [])
      actionsGrouped.get(key)!.push(fa)
    }
  }

  const toggleActionSort = (key: ActionSortKey) => {
    setActionSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  const toggleStatusFilter = (s: ActionStatus) => {
    setActionStatusFilterSet((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const openParent = (fa: FlatAction) => {
    if (fa.parentKind === 'issue' && fa.issue) {
      setEditingIssue({ systemId: fa.systemId, issue: fa.issue })
    } else if (fa.parentKind === 'keyItem' && fa.keyItem) {
      setEditingKeyItem({ systemId: fa.systemId, keyItem: fa.keyItem })
    }
  }

  const actionWrapCell = (i: number): React.CSSProperties => ({
    padding: '0.4em 0.6em',
    width: actionColWidths[i],
    maxWidth: actionColWidths[i],
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflow: 'visible',
  })

  const renderActionRow = (fa: FlatAction) => {
    const a = fa.action
    const s = actionStatusLabels[a.status] ?? { label: a.status, color: '#6b7280' }
    const overdue = isOverdue(a.dueDate, a.status === 'completed' ? 'closed' : 'open')
    const parentTypeLabel = dynamicTypeLabels[fa.parentType] ?? typeLabels[fa.parentType] ?? fa.parentType
    const parentColor = typeColors[fa.parentType] ?? '#6b7280'
    return (
      <tr
        key={`${fa.parentId}-${a.id}`}
        className="cursor-pointer hover:bg-accent/50 border-b border-border"
        onClick={() => openParent(fa)}
      >
        {/* 親アイテム (左端) */}
        <td style={{ ...actionWrapCell(0), fontSize: '0.8em' }}>
          <span
            style={{
              fontSize: '0.9em',
              padding: '0.1em 0.35em',
              border: `1px solid ${parentColor}`,
              borderRadius: 3,
              color: parentColor,
              marginRight: '0.4em',
            }}
          >
            {parentTypeLabel}
          </span>
          <span style={{ fontWeight: 500 }}>{fa.parentTitle}</span>
        </td>
        {/* 担当者 */}
        <td style={{ ...actionWrapCell(1), fontSize: '0.85em', fontWeight: 600 }}>
          {a.owner || <span className="text-muted-foreground">(未設定)</span>}
        </td>
        {/* 内容 */}
        <td
          className="text-foreground"
          style={{ ...actionWrapCell(2), fontSize: '0.85em' }}
        >
          {a.description}
        </td>
        {/* ステータス */}
        <td style={{ ...actionWrapCell(3), fontSize: '0.8em' }}>
          <span style={{ color: s.color, fontWeight: 600 }}>● {s.label}</span>
        </td>
        {/* 期限 */}
        <td style={{ ...actionWrapCell(4), fontSize: '0.85em' }}>
          {a.dueDate && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2em', color: overdue ? '#dc2626' : undefined }}>
              {overdue && <Flame style={{ width: '1em', height: '1em' }} />}
              {a.dueDate}
            </span>
          )}
        </td>
        {/* システム */}
        <td
          style={{ ...actionWrapCell(5), fontSize: '0.8em' }}
          className="text-muted-foreground"
        >
          {fa.systemName}
        </td>
        {/* リンク */}
        <td style={{ ...actionWrapCell(6), fontSize: '0.85em' }}>
          {a.externalLink && (
            <a
              href={a.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-500 hover:text-blue-600"
              title={a.externalLink}
            >
              <ExternalLink style={{ width: '1em', height: '1em' }} />
            </a>
          )}
        </td>
        {/* 今週のコメント */}
        <td
          className="text-foreground"
          style={{ ...actionWrapCell(7), fontSize: '0.8em' }}
        >
          {fa.weeklyComment}
        </td>
        {/* 先週のコメント */}
        <td
          className="text-muted-foreground"
          style={{ ...actionWrapCell(8), fontSize: '0.8em' }}
        >
          {fa.lastWeekComment}
        </td>
      </tr>
    )
  }

  const actionTableHeader = (
    <thead>
      <tr className="border-b border-border" style={{ fontSize: '0.8em' }}>
        {actionColumns.map((col, i) => {
          const isSorted = actionSort?.key === col.sortKey
          const sortIcon =
            isSorted && actionSort
              ? actionSort.dir === 'asc'
                ? <ArrowUp className="h-3 w-3" />
                : <ArrowDown className="h-3 w-3" />
              : col.sortKey
                ? <ArrowUpDown className="h-3 w-3 opacity-40" />
                : null
          return (
            <th
              key={col.key}
              className="text-muted-foreground"
              style={{
                padding: '0.5em 0.6em',
                textAlign: 'left',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                width: actionColWidths[i],
                position: 'relative',
                userSelect: 'none',
                cursor: col.sortKey ? 'pointer' : 'default',
              }}
              onClick={() => col.sortKey && toggleActionSort(col.sortKey)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25em' }}>
                {col.label}
                {sortIcon}
              </span>
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  cursor: 'col-resize',
                  background: 'transparent',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  onActionMouseDown(i, e)
                }}
                className="hover:bg-primary/30"
              />
            </th>
          )
        })}
      </tr>
    </thead>
  )

  const toggleBar = (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex rounded-md border overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setViewMode('items')}
          className={`flex items-center gap-1 px-2.5 py-1 ${viewMode === 'items' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
        >
          <List className="h-3.5 w-3.5" />
          アイテム
        </button>
        <button
          type="button"
          onClick={() => setViewMode('actions')}
          className={`flex items-center gap-1 px-2.5 py-1 border-l ${viewMode === 'actions' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
        >
          <Users className="h-3.5 w-3.5" />
          アクション
        </button>
      </div>
      {viewMode === 'actions' && (
        <>
          <div className="flex rounded-md border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setGroupMode('none')}
              className={`px-2.5 py-1 ${groupMode === 'none' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            >
              全件
            </button>
            <button
              type="button"
              onClick={() => setGroupMode('owner')}
              className={`px-2.5 py-1 border-l ${groupMode === 'owner' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            >
              担当別
            </button>
          </div>
          <div className="flex items-center gap-1">
            {(['pending', 'in-progress', 'completed', 'on-hold'] as ActionStatus[]).map((s) => {
              const info = actionStatusLabels[s]
              const active = actionStatusFilterSet.has(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatusFilter(s)}
                  className={`px-2 py-1 rounded-md border text-xs ${active ? '' : 'opacity-50 hover:opacity-80'}`}
                  style={{
                    borderColor: info.color,
                    color: active ? '#fff' : info.color,
                    backgroundColor: active ? info.color : 'transparent',
                  }}
                >
                  {info.label}
                </button>
              )
            })}
            {actionStatusFilterSet.size > 0 && (
              <button
                type="button"
                onClick={() => setActionStatusFilterSet(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
              >
                クリア
              </button>
            )}
          </div>
          {actionSort && (
            <button
              type="button"
              onClick={() => setActionSort(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              ソート解除
            </button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{filteredActions.length} 件</span>
        </>
      )}
    </div>
  )

  const dialogs = (
    <>
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

  if (viewMode === 'actions') {
    if (filteredActions.length === 0) {
      return (
        <>
          {toggleBar}
          <p className="text-muted-foreground text-center py-8" style={{ fontSize: '0.9em' }}>
            アクションはありません
          </p>
          {dialogs}
        </>
      )
    }
    return (
      <>
        {toggleBar}
        <div className="rounded-lg border bg-card overflow-auto">
          <table
            style={{
              width: actionTotalWidth,
              tableLayout: 'fixed',
              borderCollapse: 'collapse',
              fontSize: 'inherit',
            }}
          >
            {actionTableHeader}
            <tbody>
              {groupMode === 'owner'
                ? Array.from(actionsGrouped.entries())
                    .sort((a, b) => a[0].localeCompare(b[0], 'ja'))
                    .map(([owner, list]) => (
                      <React.Fragment key={owner}>
                        <tr>
                          <td
                            colSpan={actionColumns.length}
                            style={{ padding: '0.5em 0.6em', fontWeight: 600, fontSize: '0.85em' }}
                            className="bg-muted"
                          >
                            {owner}
                            <span className="text-muted-foreground" style={{ fontWeight: 400, marginLeft: '0.5em' }}>
                              ({list.length})
                            </span>
                          </td>
                        </tr>
                        {list.map(renderActionRow)}
                      </React.Fragment>
                    ))
                : filteredActions.map(renderActionRow)}
            </tbody>
          </table>
        </div>
        {dialogs}
      </>
    )
  }

  if (items.length === 0) {
    return (
      <>
        {toggleBar}
        <p className="text-muted-foreground text-center py-8" style={{ fontSize: '0.9em' }}>アイテムなし</p>
        {dialogs}
      </>
    )
  }

  return (
    <>
      {toggleBar}
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
      {dialogs}
    </>
  )
}
