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
import { IssueFormSchema, type IssueFormData } from '@/types/form-schemas'
import type { Issue } from '@/types/schema'

interface IssueFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  systemId: string
  editData?: Issue | null
}

const statusOptions = [
  { value: 'open', label: '未対応' },
  { value: 'in-progress', label: '対応中' },
  { value: 'closed', label: '完了' },
] as const

const priorityOptions = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
] as const

export function IssueFormDialog({ open, onOpenChange, systemId, editData }: IssueFormDialogProps) {
  const { addIssue, updateIssue, deleteIssue } = useProjectStore(
    useShallow((s) => ({ addIssue: s.addIssue, updateIssue: s.updateIssue, deleteIssue: s.deleteIssue })),
  )

  const isEdit = !!editData
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IssueFormData>({
    resolver: zodResolver(IssueFormSchema),
  })

  useEffect(() => {
    if (open) {
      reset(
        editData
          ? {
              title: editData.title,
              status: editData.status,
              priority: editData.priority,
              assignee: editData.assignee,
              stakeholders: editData.stakeholders ?? '',
              dueDate: editData.dueDate,
              description: editData.description,
              externalLink: editData.externalLink ?? '',
            }
          : {
              title: '',
              status: 'open',
              priority: 'medium',
              assignee: '',
              stakeholders: '',
              dueDate: '',
              description: '',
              externalLink: '',
            },
      )
    }
  }, [open, editData, reset])

  const onSubmit = (data: IssueFormData) => {
    if (isEdit) {
      updateIssue(systemId, editData.id, data)
    } else {
      const issue: Issue = {
        id: crypto.randomUUID(),
        ...data,
        weeklyUpdates: [],
      }
      addIssue(systemId, issue)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Issue 編集' : 'Issue 追加'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Issueの情報を編集します。' : '新しいIssueを追加します。'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium">タイトル *</label>
              <Input {...register('title')} />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="mb-1 block text-sm font-medium">優先度</label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((o) => (
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
              <label className="mb-1 block text-sm font-medium">主担当</label>
              <Input {...register('assignee')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">関係者</label>
              <Input {...register('stakeholders')} placeholder="カンマ区切りで複数入力可" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">期限</label>
              <Input type="date" {...register('dueDate')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">説明</label>
              <textarea
                {...register('description')}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">外部リンク</label>
              <Input {...register('externalLink')} placeholder="https://..." />
            </div>
            {isEdit && (
              <WeeklyUpdateSection
                systemId={systemId}
                itemId={editData.id}
                itemKind="issue"
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
                onClick={() => { deleteIssue(systemId, editData.id); onOpenChange(false) }}
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
