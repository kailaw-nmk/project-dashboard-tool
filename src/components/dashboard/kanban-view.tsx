'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Filter, Layers, Monitor, Plus } from 'lucide-react'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IssueCard, KeyItemCard } from '@/components/dashboard/kanban-card'
import { IssueFormDialog } from '@/components/system/issue-form-dialog'
import { KeyItemFormDialog } from '@/components/system/key-item-form-dialog'
import type { System, Issue, KeyItem } from '@/types/schema'

type ItemCategory = 'issue' | 'milestone' | 'risk' | 'decision' | 'dependency'

const categoryLabels: Record<ItemCategory, string> = {
  issue: 'Issue',
  milestone: 'マイルストーン',
  risk: 'リスク',
  decision: '決定事項',
  dependency: '依存関係',
}

type KanbanItem =
  | { kind: 'issue'; data: Issue }
  | { kind: 'keyItem'; data: KeyItem }

function getItemCategory(item: KanbanItem): ItemCategory {
  if (item.kind === 'issue') return 'issue'
  return item.data.type
}

function groupByStatus(system: System, activeFilters: Set<ItemCategory>) {
  const allItems: KanbanItem[] = [
    ...system.issues.map((i) => ({ kind: 'issue' as const, data: i })),
    ...system.keyItems.map((k) => ({ kind: 'keyItem' as const, data: k })),
  ]

  const items = activeFilters.size === 0
    ? allItems
    : allItems.filter((item) => activeFilters.has(getItemCategory(item)))

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

type AddItemType = 'issue' | 'milestone' | 'risk' | 'decision' | 'dependency'

function SystemColumn({ system, statusOption, onClick, activeFilters }: {
  system: System
  statusOption: { label: string; color: string } | undefined
  onClick: () => void
  activeFilters: Set<ItemCategory>
}) {
  const [closedOpen, setClosedOpen] = useState(false)
  const [issueFormOpen, setIssueFormOpen] = useState(false)
  const [keyItemFormOpen, setKeyItemFormOpen] = useState(false)
  const [keyItemDefaultType, setKeyItemDefaultType] = useState<'milestone' | 'risk' | 'decision' | 'dependency'>('milestone')
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [editingKeyItem, setEditingKeyItem] = useState<KeyItem | null>(null)
  const groups = groupByStatus(system, activeFilters)
  const hasItems = groups.open.length > 0 || groups['in-progress'].length > 0 || groups.closed.length > 0

  const handleAddItem = (type: AddItemType) => {
    if (type === 'issue') {
      setIssueFormOpen(true)
    } else {
      setKeyItemDefaultType(type)
      setKeyItemFormOpen(true)
    }
  }

  return (
    <div className="flex flex-col w-[290px] min-w-[290px] bg-muted rounded-lg border">
      {/* Column header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-70"
          onClick={onClick}
        >
          <span className="font-medium text-sm truncate">{system.name}</span>
          {statusOption && (
            <Badge
              variant="outline"
              className="border-transparent text-xs shrink-0"
              style={{ backgroundColor: statusOption.color + '20', color: statusOption.color }}
            >
              {statusOption.label}
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" />}
          >
            <Plus className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAddItem('issue')}>
              Issue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddItem('milestone')}>
              マイルストーン
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddItem('risk')}>
              リスク
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddItem('decision')}>
              決定事項
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddItem('dependency')}>
              依存関係
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {!hasItems && (
          <p className="text-xs text-muted-foreground text-center py-4">アイテムなし</p>
        )}

        {(['open', 'in-progress'] as const).map((status) => {
          const items = groups[status]
          if (items.length === 0) return null
          return (
            <div key={status}>
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {statusSectionLabels[status]}
                </span>
                <span className="text-[11px] text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-1.5">
                {items.map((item) =>
                  item.kind === 'issue' ? (
                    <IssueCard key={item.data.id} issue={item.data} onClick={() => { setEditingIssue(item.data); setIssueFormOpen(true) }} />
                  ) : (
                    <KeyItemCard key={item.data.id} keyItem={item.data} onClick={() => { setEditingKeyItem(item.data); setKeyItemFormOpen(true) }} />
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
              className="flex items-center gap-1 px-1 mb-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
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
              <span className="text-muted-foreground">{groups.closed.length}</span>
            </button>
            {closedOpen && (
              <div className="space-y-1.5">
                {groups.closed.map((item) =>
                  item.kind === 'issue' ? (
                    <IssueCard key={item.data.id} issue={item.data} onClick={() => { setEditingIssue(item.data); setIssueFormOpen(true) }} />
                  ) : (
                    <KeyItemCard key={item.data.id} keyItem={item.data} onClick={() => { setEditingKeyItem(item.data); setKeyItemFormOpen(true) }} />
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form dialogs */}
      <IssueFormDialog
        open={issueFormOpen}
        onOpenChange={(open) => { setIssueFormOpen(open); if (!open) setEditingIssue(null) }}
        systemId={system.id}
        editData={editingIssue}
      />
      <KeyItemFormDialog
        open={keyItemFormOpen}
        onOpenChange={(open) => { setKeyItemFormOpen(open); if (!open) setEditingKeyItem(null) }}
        systemId={system.id}
        editData={editingKeyItem}
        defaultType={keyItemDefaultType}
      />
    </div>
  )
}

const allCategories: ItemCategory[] = ['issue', 'milestone', 'risk', 'decision', 'dependency']

/** 個別システムビュー: ステータス別3カラム */
function SingleSystemKanban({ system, activeFilters }: {
  system: System
  activeFilters: Set<ItemCategory>
}) {
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [editingKeyItem, setEditingKeyItem] = useState<KeyItem | null>(null)
  const [issueFormOpen, setIssueFormOpen] = useState(false)
  const [keyItemFormOpen, setKeyItemFormOpen] = useState(false)
  const [keyItemDefaultType, setKeyItemDefaultType] = useState<'milestone' | 'risk' | 'decision' | 'dependency'>('milestone')

  const groups = groupByStatus(system, activeFilters)

  const handleAddItem = (type: AddItemType) => {
    if (type === 'issue') {
      setIssueFormOpen(true)
    } else {
      setKeyItemDefaultType(type)
      setKeyItemFormOpen(true)
    }
  }

  const renderItems = (items: KanbanItem[]) => (
    <div className="space-y-1.5">
      {items.map((item) =>
        item.kind === 'issue' ? (
          <IssueCard key={item.data.id} issue={item.data} onClick={() => { setEditingIssue(item.data); setIssueFormOpen(true) }} />
        ) : (
          <KeyItemCard key={item.data.id} keyItem={item.data} onClick={() => { setEditingKeyItem(item.data); setKeyItemFormOpen(true) }} />
        ),
      )}
    </div>
  )

  return (
    <>
      {/* Add button */}
      <div className="flex justify-end mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" className="h-7" />}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            追加
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAddItem('issue')}>Issue</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddItem('milestone')}>マイルストーン</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddItem('risk')}>リスク</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddItem('decision')}>決定事項</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddItem('dependency')}>依存関係</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 3-column status board */}
      <div className="grid grid-cols-3 gap-3">
        {(['open', 'in-progress', 'closed'] as const).map((status) => {
          const items = groups[status]
          return (
            <div key={status} className="flex flex-col bg-muted rounded-lg border min-h-[200px]">
              <div className="flex items-center gap-2 p-3 border-b">
                <span className="text-sm font-medium">{statusSectionLabels[status]}</span>
                <Badge variant="secondary" className="text-xs">{items.length}</Badge>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">アイテムなし</p>
                ) : (
                  renderItems(items)
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Form dialogs */}
      <IssueFormDialog
        open={issueFormOpen}
        onOpenChange={(open) => { setIssueFormOpen(open); if (!open) setEditingIssue(null) }}
        systemId={system.id}
        editData={editingIssue}
      />
      <KeyItemFormDialog
        open={keyItemFormOpen}
        onOpenChange={(open) => { setKeyItemFormOpen(open); if (!open) setEditingKeyItem(null) }}
        systemId={system.id}
        editData={editingKeyItem}
        defaultType={keyItemDefaultType}
      />
    </>
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
  const [activeFilters, setActiveFilters] = useState<Set<ItemCategory>>(new Set())
  const [selectedSystemForKanban, setSelectedSystemForKanban] = useState<string | null>(null)

  const toggleFilter = (category: ItemCategory) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  if (!settings) return null

  const selectedSystem = selectedSystemForKanban
    ? systems.find((s) => s.id === selectedSystemForKanban)
    : null

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar: view switch + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 border rounded-md p-0.5">
          <Button
            variant={selectedSystemForKanban === null ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setSelectedSystemForKanban(null)}
          >
            <Layers className="h-3.5 w-3.5" />
            全システム
          </Button>
          <Select
            value={selectedSystemForKanban ?? ''}
            onValueChange={(value) => { if (value) setSelectedSystemForKanban(value) }}
          >
            <SelectTrigger
              className={`h-7 text-xs border-none gap-1 min-w-[140px] ${selectedSystemForKanban ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <Monitor className="h-3.5 w-3.5 shrink-0" />
              {selectedSystem ? selectedSystem.name : 'システム選択'}
            </SelectTrigger>
            <SelectContent>
              {systems.map((sys) => (
                <SelectItem key={sys.id} value={sys.id}>{sys.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-border" />

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {allCategories.map((cat) => {
            const isActive = activeFilters.has(cat)
            return (
              <Button
                key={cat}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => toggleFilter(cat)}
              >
                {categoryLabels[cat]}
              </Button>
            )
          })}
          {activeFilters.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setActiveFilters(new Set())}
            >
              クリア
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {selectedSystem ? (
        /* Single system kanban: 3-column status board */
        <SingleSystemKanban
          key={selectedSystem.id}
          system={selectedSystem}
          activeFilters={activeFilters}
        />
      ) : (
        /* All systems: horizontal columns */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-min">
            {systems.map((system) => (
              <SystemColumn
                key={system.id}
                system={system}
                statusOption={settings.statusOptions.find((o) => o.id === system.status)}
                onClick={() => setSelectedSystemId(system.id)}
                activeFilters={activeFilters}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
