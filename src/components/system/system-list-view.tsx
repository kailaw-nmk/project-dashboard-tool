'use client'

import { useState } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'
import { SystemFormDialog } from './system-form-dialog'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'
import type { System } from '@/types/schema'

export function SystemListView() {
  const { systems, settings } = useProjectStore(
    useShallow((s) => ({
      systems: s.projectData?.systems ?? [],
      settings: s.projectData?.settings,
    })),
  )
  const { setSelectedSystemId, deleteSystem, updateSystem } = useProjectStore(
    useShallow((s) => ({
      setSelectedSystemId: s.setSelectedSystemId,
      deleteSystem: s.deleteSystem,
      updateSystem: s.updateSystem,
    })),
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editingSystem, setEditingSystem] = useState<System | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<System | null>(null)

  const getStatusOption = (id: string) => settings?.statusOptions.find((o) => o.id === id)
  const getPhaseLabel = (id: string) =>
    settings?.phaseOptions.find((o) => o.id === id)?.label ?? id

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">システム管理</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditingSystem(null)
            setFormOpen(true)
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          システム追加
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>システム名</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>フェーズ</TableHead>
              <TableHead className="text-center">Issue</TableHead>
              <TableHead>担当者</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {systems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-zinc-400">
                  システムが登録されていません
                </TableCell>
              </TableRow>
            ) : (
              systems.map((system) => {
                const statusOpt = getStatusOption(system.status)
                const openIssues = system.issues.filter((i) => i.status !== 'closed').length
                return (
                  <TableRow
                    key={system.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedSystemId(system.id)}
                  >
                    <TableCell className="font-medium">{system.name}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={system.status}
                        onValueChange={(value) => { if (value) updateSystem(system.id, { status: value }) }}
                      >
                        <SelectTrigger className="h-7 w-auto min-w-[100px] border-none bg-transparent px-2">
                          {statusOpt ? (
                            <span className="flex items-center gap-1.5">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: statusOpt.color }}
                              />
                              {statusOpt.label}
                            </span>
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {settings?.statusOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="inline-block h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: opt.color }}
                                />
                                {opt.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{getPhaseLabel(system.phase)}</TableCell>
                    <TableCell className="text-center">
                      {openIssues > 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          {openIssues}
                        </Badge>
                      ) : (
                        <span className="text-zinc-400">0</span>
                      )}
                    </TableCell>
                    <TableCell>{system.owner}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" />}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              setSelectedSystemId(system.id)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            詳細
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              setEditingSystem(system)
                              setFormOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            編集
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              setDeleteTarget(system)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <SystemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editData={editingSystem}
      />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="システムを削除"
        description={`「${deleteTarget?.name}」を削除しますか？関連する依存関係も削除されます。この操作は取り消せません。`}
        onConfirm={() => {
          if (deleteTarget) {
            deleteSystem(deleteTarget.id)
            setDeleteTarget(null)
          }
        }}
      />
    </div>
  )
}
