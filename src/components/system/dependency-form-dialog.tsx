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
import { useShallow } from 'zustand/react/shallow'
import { DependencyFormSchema, type DependencyFormData } from '@/types/form-schemas'
import type { Dependency } from '@/types/schema'

interface DependencyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: Dependency | null
}

const typeOptions = [
  { value: 'api', label: 'API' },
  { value: 'data', label: 'データ' },
  { value: 'event', label: 'イベント' },
  { value: 'other', label: 'その他' },
] as const

export function DependencyFormDialog({
  open,
  onOpenChange,
  editData,
}: DependencyFormDialogProps) {
  const { addDependency, updateDependency } = useProjectStore(
    useShallow((s) => ({
      addDependency: s.addDependency,
      updateDependency: s.updateDependency,
    })),
  )
  const systems = useProjectStore((s) => s.projectData?.systems ?? [])

  const isEdit = !!editData
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DependencyFormData>({
    resolver: zodResolver(DependencyFormSchema),
  })

  useEffect(() => {
    if (open) {
      reset(
        editData
          ? {
              sourceSystemId: editData.sourceSystemId,
              targetSystemId: editData.targetSystemId,
              label: editData.label,
              type: editData.type,
              description: editData.description,
            }
          : {
              sourceSystemId: '',
              targetSystemId: '',
              label: '',
              type: 'api',
              description: '',
            },
      )
    }
  }, [open, editData, reset])

  const onSubmit = (data: DependencyFormData) => {
    if (isEdit) {
      updateDependency(editData.id, data)
    } else {
      const dependency: Dependency = {
        id: crypto.randomUUID(),
        ...data,
      }
      addDependency(dependency)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? '依存関係編集' : '依存関係追加'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? '依存関係の情報を編集します。'
                : '新しい依存関係を追加します。'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium">ソースシステム *</label>
              <Controller
                name="sourceSystemId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {systems.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.sourceSystemId && (
                <p className="mt-1 text-xs text-red-500">{errors.sourceSystemId.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">ターゲットシステム *</label>
              <Controller
                name="targetSystemId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {systems.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.targetSystemId && (
                <p className="mt-1 text-xs text-red-500">{errors.targetSystemId.message}</p>
              )}
            </div>
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
                      {typeOptions.map((o) => (
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
              <label className="mb-1 block text-sm font-medium">ラベル</label>
              <Input {...register('label')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">説明</label>
              <textarea
                {...register('description')}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>キャンセル</DialogClose>
            <Button type="submit">{isEdit ? '保存' : '追加'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
