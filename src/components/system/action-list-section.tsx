'use client'

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, ExternalLink } from 'lucide-react'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Action, ActionStatus } from '@/types/schema'

interface ActionListSectionProps {
  systemId: string
  itemId: string
  itemKind: 'issue' | 'keyItem'
  actions: Action[]
}

export interface ActionListSectionHandle {
  save: () => void
}

const statusOptions: { value: ActionStatus; label: string; color: string }[] = [
  { value: 'pending', label: '未着手', color: '#6b7280' },
  { value: 'in-progress', label: '対応中', color: '#d97706' },
  { value: 'completed', label: '完了', color: '#16a34a' },
  { value: 'on-hold', label: '保留', color: '#9333ea' },
]

function emptyAction(): Action {
  const nowStr = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    owner: '',
    description: '',
    status: 'pending',
    dueDate: '',
    externalLink: '',
    createdAt: nowStr,
    updatedAt: nowStr,
    history: [],
  }
}

export const ActionListSection = forwardRef<ActionListSectionHandle, ActionListSectionProps>(
  function ActionListSection({ systemId, itemId, itemKind, actions }, ref) {
    const { upsertAction, deleteAction } = useProjectStore(
      useShallow((s) => ({ upsertAction: s.upsertAction, deleteAction: s.deleteAction })),
    )

    // ローカル編集バッファ（保存ボタンで一括反映）
    const [draft, setDraft] = useState<Action[]>(actions ?? [])
    const [historyOpen, setHistoryOpen] = useState<Record<string, boolean>>({})
    const [saved, setSaved] = useState(false)

    useEffect(() => {
      setDraft(actions ?? [])
      setSaved(false)
    }, [actions])

    const handleAdd = () => {
      setDraft((prev) => [...prev, emptyAction()])
      setSaved(false)
    }

    const handleChange = <K extends keyof Action>(id: string, field: K, value: Action[K]) => {
      setDraft((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)))
      setSaved(false)
    }

    const handleDelete = (id: string) => {
      const exists = (actions ?? []).some((a) => a.id === id)
      setDraft((prev) => prev.filter((a) => a.id !== id))
      if (exists) {
        deleteAction(systemId, itemId, itemKind, id)
      }
    }

    const handleSave = () => {
      for (const a of draft) {
        upsertAction(systemId, itemId, itemKind, a)
      }
      // 削除されたアクション(draftにあってactionsにあるが、UI上で消されたもの)はhandleDeleteで即時処理
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }

    useImperativeHandle(ref, () => ({ save: handleSave }))

    const total = draft.length
    const incomplete = draft.filter((a) => a.status !== 'completed').length

    return (
      <div className="border-t pt-3 mt-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">
            アクション {total > 0 && <span>({incomplete}/{total} 未完了)</span>}
          </p>
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
            onClick={handleAdd}
          >
            <Plus className="h-3 w-3" />
            追加
          </button>
        </div>

        {draft.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic">アクションはまだありません</p>
        ) : (
          <div className="space-y-2">
            {draft.map((a) => {
              const statusInfo = statusOptions.find((s) => s.value === a.status)
              const isHistoryOpen = historyOpen[a.id] ?? false
              return (
                <div key={a.id} className="rounded border p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={a.owner}
                      onChange={(e) => handleChange(a.id, 'owner', e.target.value)}
                      placeholder="担当者"
                      className="h-7 text-xs flex-1"
                    />
                    <Select
                      value={a.status}
                      onValueChange={(v) => handleChange(a.id, 'status', v as ActionStatus)}
                    >
                      <SelectTrigger className="h-7 text-xs w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s.value} value={s.value} className="text-xs">
                            <span style={{ color: s.color }}>● </span>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      title="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={a.description}
                    onChange={(e) => handleChange(a.id, 'description', e.target.value)}
                    placeholder="アクション内容"
                    rows={1}
                    className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="date"
                      value={a.dueDate}
                      onChange={(e) => handleChange(a.id, 'dueDate', e.target.value)}
                      className="h-7 text-xs w-[140px]"
                    />
                    <Input
                      value={a.externalLink}
                      onChange={(e) => handleChange(a.id, 'externalLink', e.target.value)}
                      placeholder="リンク (https://...)"
                      className="h-7 text-xs flex-1"
                    />
                    {a.externalLink && (
                      <a
                        href={a.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600"
                        title={a.externalLink}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  {(a.history ?? []).length > 0 && (
                    <div>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          setHistoryOpen((prev) => ({ ...prev, [a.id]: !isHistoryOpen }))
                        }
                      >
                        {isHistoryOpen ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        履歴 ({(a.history ?? []).length})
                      </button>
                      {isHistoryOpen && (
                        <div className="mt-1 space-y-0.5 pl-3">
                          {(a.history ?? []).map((h, i) => {
                            const info = statusOptions.find((s) => s.value === h.status)
                            return (
                              <div key={i} className="text-[10px] text-muted-foreground">
                                <span style={{ color: info?.color }}>●</span>{' '}
                                {info?.label ?? h.status} —{' '}
                                {new Date(h.changedAt).toLocaleString('ja-JP')}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {statusInfo && (
                    <div className="text-[10px] text-muted-foreground">
                      最終更新: {new Date(a.updatedAt).toLocaleString('ja-JP')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <button
          type="button"
          className="mt-2 text-xs font-medium text-primary hover:underline"
          onClick={handleSave}
        >
          {saved ? '保存しました' : 'アクションを保存'}
        </button>
      </div>
    )
  },
)
