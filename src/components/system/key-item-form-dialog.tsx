'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjectStore } from '@/stores/project-store'
import { ItemDependenciesSection } from './item-dependencies-section'
import { WeeklyUpdateSection } from './weekly-update-section'
import { useShallow } from 'zustand/react/shallow'
import { KeyItemFormSchema, type KeyItemFormData } from '@/types/form-schemas'
import type { KeyItem } from '@/types/schema'

interface KeyItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  systemId: string
  editData?: KeyItem | null
  defaultType?: string
}

const statusOptions = [
  { value: 'open', label: '未対応' },
  { value: 'in-progress', label: '対応中' },
  { value: 'closed', label: '完了' },
] as const

export function KeyItemFormDialog({
  open,
  onOpenChange,
  systemId,
  editData,
  defaultType = 'milestone',
}: KeyItemFormDialogProps) {
  const { addKeyItem, updateKeyItem, deleteKeyItem, keyItemTypes } = useProjectStore(
    useShallow((s) => ({ addKeyItem: s.addKeyItem, updateKeyItem: s.updateKeyItem, deleteKeyItem: s.deleteKeyItem, keyItemTypes: s.projectData?.settings.keyItemTypes ?? [] })),
  )

  const isEdit = !!editData
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<KeyItemFormData>({
    resolver: zodResolver(KeyItemFormSchema),
  })

  useEffect(() => {
    if (open) {
      reset(
        editData
          ? {
              type: editData.type,
              title: editData.title,
              assignee: editData.assignee ?? '',
              stakeholders: editData.stakeholders ?? '',
              description: editData.description,
              startDate: editData.startDate ?? '',
              dueDate: editData.dueDate ?? '',
              status: editData.status,
              externalLink: editData.externalLink ?? '',
            }
          : {
              type: defaultType,
              title: '',
              assignee: '',
              stakeholders: '',
              description: '',
              startDate: '',
              dueDate: '',
              status: 'open',
              externalLink: '',
            },
      )
    }
  }, [open, editData, defaultType, reset])

  const onSubmit = (data: KeyItemFormData) => {
    if (isEdit) {
      updateKeyItem(systemId, editData.id, data)
    } else {
      const keyItem: KeyItem = {
        id: crypto.randomUUID(),
        ...data,
        weeklyUpdates: [],
      }
      addKeyItem(systemId, keyItem)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'キーアイテム編集' : 'キーアイテム追加'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'キーアイテムの情報を編集します。' : '新しいキーアイテムを追加します。'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">タイプ</label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {keyItemTypes.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">ステータス</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">タイトル *</label>
              <Input {...register('title')} />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">主担当</label>
              <Input {...register('assignee')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">関係者</label>
              <Input {...register('stakeholders')} placeholder="カンマ区切りで複数入力可" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">説明</label>
              <textarea
                {...register('description')}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">開始日</label>
                <Input type="date" {...register('startDate')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">期限</label>
                <Input type="date" {...register('dueDate')} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">外部リンク</label>
              <Input {...register('externalLink')} placeholder="https://..." />
            </div>
            {isEdit && (
              <WeeklyUpdateSection
                systemId={systemId}
                itemId={editData.id}
                itemKind="keyItem"
                weeklyUpdates={editData.weeklyUpdates ?? []}
              />
            )}
            {isEdit && <ItemDependenciesSection itemId={editData.id} />}
          </div>
          <DialogFooter className="flex justify-between">
            {isEdit ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => { deleteKeyItem(systemId, editData.id); onOpenChange(false) }}
              >
                削除
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <DialogClose render={<Button variant="outline" />}>キャンセル</DialogClose>
              <Button type="submit">{isEdit ? '保存' : '追加'}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
