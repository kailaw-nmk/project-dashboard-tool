'use client'

import { useState } from 'react'
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSelectedSystem } from '@/hooks/use-project'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'
import { SystemFormDialog } from './system-form-dialog'
import { IssueFormDialog } from './issue-form-dialog'
import { KeyItemFormDialog } from './key-item-form-dialog'
import { DependencyFormDialog } from './dependency-form-dialog'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'
import type { Issue, KeyItem, Dependency } from '@/types/schema'

export function SystemDetailSheet() {
  const selectedSystem = useSelectedSystem()
  const { setSelectedSystemId, deleteSystem, deleteIssue, deleteKeyItem, deleteDependency } =
    useProjectStore(
      useShallow((s) => ({
        setSelectedSystemId: s.setSelectedSystemId,
        deleteSystem: s.deleteSystem,
        deleteIssue: s.deleteIssue,
        deleteKeyItem: s.deleteKeyItem,
        deleteDependency: s.deleteDependency,
      })),
    )
  const { dependencies, settings } = useProjectStore(
    useShallow((s) => ({
      dependencies: s.projectData?.dependencies ?? [],
      settings: s.projectData?.settings,
    })),
  )
  const systems = useProjectStore((s) => s.projectData?.systems ?? [])

  const open = selectedSystem !== null

  // Dialog states
  const [systemFormOpen, setSystemFormOpen] = useState(false)
  const [systemDeleteOpen, setSystemDeleteOpen] = useState(false)
  const [issueFormOpen, setIssueFormOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [keyItemFormOpen, setKeyItemFormOpen] = useState(false)
  const [editingKeyItem, setEditingKeyItem] = useState<KeyItem | null>(null)
  const [dependencyFormOpen, setDependencyFormOpen] = useState(false)
  const [editingDependency, setEditingDependency] = useState<Dependency | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'issue' | 'keyItem' | 'dependency'
    id: string
    name: string
  } | null>(null)

  const statusOption = settings?.statusOptions.find((o) => o.id === selectedSystem?.status)
  const phaseOption = settings?.phaseOptions.find((o) => o.id === selectedSystem?.phase)

  const relatedDeps = dependencies.filter(
    (d) =>
      d.sourceSystemId === selectedSystem?.id || d.targetSystemId === selectedSystem?.id,
  )

  const getSystemName = (id: string) => systems.find((s) => s.id === id)?.name ?? id

  const sortedIssues = [...(selectedSystem?.issues ?? [])].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const keyItemsByType = (selectedSystem?.keyItems ?? []).reduce(
    (acc, item) => {
      const group = acc[item.type] ?? []
      group.push(item)
      acc[item.type] = group
      return acc
    },
    {} as Record<string, NonNullable<typeof selectedSystem>['keyItems']>,
  )

  const keyItemTypeLabel: Record<string, string> = {
    milestone: 'マイルストーン',
    risk: 'リスク',
    decision: '決定事項',
    dependency: '依存関係',
  }

  const issueStatusLabel: Record<string, string> = {
    open: '未対応',
    'in-progress': '対応中',
    closed: '完了',
  }

  const priorityLabel: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget || !selectedSystem) return
    switch (deleteTarget.type) {
      case 'issue':
        deleteIssue(selectedSystem.id, deleteTarget.id)
        break
      case 'keyItem':
        deleteKeyItem(selectedSystem.id, deleteTarget.id)
        break
      case 'dependency':
        deleteDependency(deleteTarget.id)
        break
    }
    setDeleteTarget(null)
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedSystemId(null)
        }}
      >
        <SheetContent side="right" className="w-[400px] sm:max-w-[400px]">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <SheetTitle className="flex-1">{selectedSystem?.name}</SheetTitle>
              {statusOption && (
                <Badge
                  variant="outline"
                  className="border-transparent"
                  style={{
                    backgroundColor: statusOption.color + '20',
                    color: statusOption.color,
                  }}
                >
                  {statusOption.label}
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon-sm" />}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setSystemFormOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                    編集
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setSystemDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <SheetDescription>{selectedSystem?.description}</SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 px-4">
            <div className="flex flex-col gap-4 pb-4">
              {/* 基本情報 */}
              <section>
                <h3 className="mb-2 text-sm font-medium">基本情報</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-zinc-500">フェーズ</dt>
                  <dd>{phaseOption?.label ?? selectedSystem?.phase}</dd>
                  <dt className="text-zinc-500">担当者</dt>
                  <dd>{selectedSystem?.owner}</dd>
                </dl>
                {selectedSystem?.comment && (
                  <p className="mt-2 text-sm text-zinc-600">{selectedSystem.comment}</p>
                )}
              </section>

              <Separator />

              {/* 依存関係 */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">依存関係 ({relatedDeps.length})</h3>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEditingDependency(null)
                      setDependencyFormOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {relatedDeps.length > 0 && (
                  <ul className="flex flex-col gap-1 text-sm">
                    {relatedDeps.map((dep) => (
                      <li
                        key={dep.id}
                        className="flex items-center gap-2 rounded border p-2"
                      >
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {dep.type}
                        </Badge>
                        <span className="flex-1 truncate">
                          {getSystemName(dep.sourceSystemId)} →{' '}
                          {getSystemName(dep.targetSystemId)}
                          {dep.label && (
                            <span className="text-zinc-400"> ({dep.label})</span>
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0"
                          onClick={() => {
                            setEditingDependency(dep)
                            setDependencyFormOpen(true)
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-destructive"
                          onClick={() =>
                            setDeleteTarget({
                              type: 'dependency',
                              id: dep.id,
                              name: `${getSystemName(dep.sourceSystemId)} → ${getSystemName(dep.targetSystemId)}`,
                            })
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <Separator />

              {/* Issue一覧 */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Issue ({sortedIssues.length})</h3>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEditingIssue(null)
                      setIssueFormOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {sortedIssues.length > 0 && (
                  <ul className="flex flex-col gap-2 text-sm">
                    {sortedIssues.map((issue) => (
                      <li
                        key={issue.id}
                        className="flex cursor-pointer items-start justify-between rounded border p-2 transition-colors hover:bg-zinc-50"
                        onClick={() => {
                          setEditingIssue(issue)
                          setIssueFormOpen(true)
                        }}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{issue.title}</p>
                          <p className="text-xs text-zinc-500">
                            {priorityLabel[issue.priority] ?? issue.priority} /{' '}
                            {issueStatusLabel[issue.status] ?? issue.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant={
                              issue.status === 'closed'
                                ? 'secondary'
                                : issue.priority === 'high'
                                  ? 'destructive'
                                  : 'outline'
                            }
                            className="text-xs"
                          >
                            {issueStatusLabel[issue.status] ?? issue.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget({
                                type: 'issue',
                                id: issue.id,
                                name: issue.title,
                              })
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <Separator />

              {/* キーアイテム一覧 */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    キーアイテム ({selectedSystem?.keyItems.length ?? 0})
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEditingKeyItem(null)
                      setKeyItemFormOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {Object.entries(keyItemsByType).map(([type, items]) => (
                  <div key={type} className="mb-3">
                    <h4 className="mb-1 text-xs font-medium text-zinc-500">
                      {keyItemTypeLabel[type] ?? type}
                    </h4>
                    <ul className="flex flex-col gap-1 text-sm">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="flex cursor-pointer items-center justify-between rounded border p-2 transition-colors hover:bg-zinc-50"
                          onClick={() => {
                            setEditingKeyItem(item)
                            setKeyItemFormOpen(true)
                          }}
                        >
                          <span className="flex-1">{item.title}</span>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {issueStatusLabel[item.status] ?? item.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="shrink-0 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteTarget({
                                  type: 'keyItem',
                                  id: item.id,
                                  name: item.title,
                                })
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Form dialogs */}
      {selectedSystem && (
        <>
          <SystemFormDialog
            open={systemFormOpen}
            onOpenChange={setSystemFormOpen}
            editData={selectedSystem}
          />
          <IssueFormDialog
            open={issueFormOpen}
            onOpenChange={setIssueFormOpen}
            systemId={selectedSystem.id}
            editData={editingIssue}
          />
          <KeyItemFormDialog
            open={keyItemFormOpen}
            onOpenChange={setKeyItemFormOpen}
            systemId={selectedSystem.id}
            editData={editingKeyItem}
          />
          <DependencyFormDialog
            open={dependencyFormOpen}
            onOpenChange={setDependencyFormOpen}
            editData={editingDependency}
          />
        </>
      )}

      {/* Delete dialogs */}
      <ConfirmDeleteDialog
        open={systemDeleteOpen}
        onOpenChange={setSystemDeleteOpen}
        title="システムを削除"
        description={`「${selectedSystem?.name}」を削除しますか？関連する依存関係も削除されます。この操作は取り消せません。`}
        onConfirm={() => {
          if (selectedSystem) {
            deleteSystem(selectedSystem.id)
            setSelectedSystemId(null)
          }
        }}
      />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={
          deleteTarget?.type === 'issue'
            ? 'Issueを削除'
            : deleteTarget?.type === 'keyItem'
              ? 'キーアイテムを削除'
              : '依存関係を削除'
        }
        description={`「${deleteTarget?.name}」を削除しますか？この操作は取り消せません。`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
