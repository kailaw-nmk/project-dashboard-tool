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
import { SystemFormSchema, type SystemFormData } from '@/types/form-schemas'
import type { System } from '@/types/schema'

interface SystemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: System | null
}

export function SystemFormDialog({ open, onOpenChange, editData }: SystemFormDialogProps) {
  const { addSystem, updateSystem } = useProjectStore(
    useShallow((s) => ({ addSystem: s.addSystem, updateSystem: s.updateSystem })),
  )
  const settings = useProjectStore((s) => s.projectData?.settings)

  const isEdit = !!editData
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SystemFormData>({
    resolver: zodResolver(SystemFormSchema),
  })

  useEffect(() => {
    if (open) {
      reset(
        editData
          ? {
              name: editData.name,
              description: editData.description,
              owner: editData.owner,
              status: editData.status,
              phase: editData.phase,
              comment: editData.comment,
            }
          : {
              name: '',
              description: '',
              owner: '',
              status: settings?.statusOptions[0]?.id ?? '',
              phase: settings?.phaseOptions[0]?.id ?? '',
              comment: '',
            },
      )
    }
  }, [open, editData, reset, settings])

  const onSubmit = (data: SystemFormData) => {
    if (isEdit) {
      updateSystem(editData.id, data)
    } else {
      const now = new Date().toISOString()
      const system: System = {
        id: crypto.randomUUID(),
        ...data,
        position: { x: Math.random() * 400, y: Math.random() * 300 },
        issues: [],
        keyItems: [],
        createdAt: now,
        updatedAt: now,
      }
      addSystem(system)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'システム編集' : 'システム追加'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'システム情報を編集します。' : '新しいシステムを追加します。'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium">システム名 *</label>
              <Input {...register('name')} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
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
              <label className="mb-1 block text-sm font-medium">担当者 *</label>
              <Input {...register('owner')} />
              {errors.owner && <p className="mt-1 text-xs text-red-500">{errors.owner.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">ステータス *</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => {
                  const selected = settings?.statusOptions.find((o) => o.id === field.value)
                  return (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {selected && (
                            <>
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: selected.color }}
                              />
                              {selected.label}
                            </>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {settings?.statusOptions.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: o.color }}
                            />
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }}
              />
              {errors.status && (
                <p className="mt-1 text-xs text-red-500">{errors.status.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">フェーズ *</label>
              <Controller
                name="phase"
                control={control}
                render={({ field }) => {
                  const selected = settings?.phaseOptions.find((o) => o.id === field.value)
                  return (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue>{selected?.label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {settings?.phaseOptions.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }}
              />
              {errors.phase && (
                <p className="mt-1 text-xs text-red-500">{errors.phase.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">コメント</label>
              <textarea
                {...register('comment')}
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
