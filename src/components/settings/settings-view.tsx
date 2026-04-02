'use client'

import { useState } from 'react'
import { Save, Plus, Trash2, GripVertical, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'
import type { StatusOption, PhaseOption, KeyItemType } from '@/types/schema'
import { getCurrentWeek } from '@/lib/week'

export function SettingsView() {
  const { projectData, setProjectData } = useProjectStore(
    useShallow((s) => ({
      projectData: s.projectData,
      setProjectData: s.setProjectData,
    })),
  )

  const [projectName, setProjectName] = useState(projectData?.projectName ?? '')
  const [currentWeek, setCurrentWeek] = useState(projectData?.currentWeek ?? '')
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>(
    projectData?.settings.statusOptions ?? [],
  )
  const [phaseOptions, setPhaseOptions] = useState<PhaseOption[]>(
    projectData?.settings.phaseOptions ?? [],
  )
  const [keyItemTypes, setKeyItemTypes] = useState<KeyItemType[]>(
    projectData?.settings.keyItemTypes ?? [],
  )
  const [saved, setSaved] = useState(false)

  if (!projectData) return null

  const handleSave = () => {
    setProjectData({
      ...projectData,
      projectName,
      currentWeek,
      lastUpdated: new Date().toISOString(),
      settings: {
        statusOptions,
        phaseOptions,
        keyItemTypes,
      },
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Status helpers
  const updateStatus = (index: number, updates: Partial<StatusOption>) => {
    setStatusOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...updates } : o)))
  }

  const addStatus = () => {
    setStatusOptions((prev) => [
      ...prev,
      { id: `status-${Date.now()}`, label: '新規ステータス', color: '#6b7280', icon: '⚪' },
    ])
  }

  const removeStatus = (index: number) => {
    setStatusOptions((prev) => prev.filter((_, i) => i !== index))
  }

  // Phase helpers
  const updatePhase = (index: number, updates: Partial<PhaseOption>) => {
    setPhaseOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...updates } : o)))
  }

  const addPhase = () => {
    const maxOrder = phaseOptions.reduce((max, p) => Math.max(max, p.order), 0)
    setPhaseOptions((prev) => [
      ...prev,
      { id: `phase-${Date.now()}`, label: '新規フェーズ', order: maxOrder + 1 },
    ])
  }

  const removePhase = (index: number) => {
    setPhaseOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const movePhase = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= phaseOptions.length) return
    setPhaseOptions((prev) => {
      const arr = [...prev]
      const temp = arr[index]
      arr[index] = arr[newIndex]
      arr[newIndex] = temp
      return arr.map((p, i) => ({ ...p, order: i + 1 }))
    })
  }

  // KeyItemType helpers
  const updateKeyItemType = (index: number, updates: Partial<KeyItemType>) => {
    setKeyItemTypes((prev) => prev.map((o, i) => (i === index ? { ...o, ...updates } : o)))
  }

  const addKeyItemType = () => {
    setKeyItemTypes((prev) => [
      ...prev,
      { id: `kit-${Date.now()}`, label: '新規タイプ', icon: '📌' },
    ])
  }

  const removeKeyItemType = (index: number) => {
    setKeyItemTypes((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">設定</h2>
        <Button onClick={handleSave}>
          <Save className="mr-1 h-4 w-4" />
          {saved ? '保存しました' : '保存'}
        </Button>
      </div>

      {/* プロジェクト基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">プロジェクト基本情報</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">プロジェクト名</label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">現在の週（金曜日の日付）</label>
            <div className="flex items-center gap-2">
              <Input
                value={currentWeek}
                onChange={(e) => setCurrentWeek(e.target.value)}
                placeholder="例: 2026/03/27"
                className="max-w-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(getCurrentWeek())}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                今週を取得
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ステータス設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">ステータス設定</CardTitle>
            <Button variant="outline" size="sm" onClick={addStatus}>
              <Plus className="mr-1 h-3 w-3" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {statusOptions.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  type="color"
                  value={opt.color}
                  onChange={(e) => updateStatus(i, { color: e.target.value })}
                  className="h-8 w-8 cursor-pointer rounded border p-0.5"
                />
                <Input
                  value={opt.label}
                  onChange={(e) => updateStatus(i, { label: e.target.value })}
                  className="max-w-[200px]"
                />
                <Input
                  value={opt.icon}
                  onChange={(e) => updateStatus(i, { icon: e.target.value })}
                  className="w-16"
                  placeholder="アイコン"
                />
                <Badge
                  variant="outline"
                  className="border-transparent"
                  style={{
                    backgroundColor: opt.color + '20',
                    color: opt.color,
                  }}
                >
                  {opt.label}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  onClick={() => removeStatus(i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* フェーズ設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">フェーズ設定</CardTitle>
            <Button variant="outline" size="sm" onClick={addPhase}>
              <Plus className="mr-1 h-3 w-3" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {phaseOptions.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-2">
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => movePhase(i, -1)}
                    disabled={i === 0}
                    className="h-4"
                  >
                    <GripVertical className="h-3 w-3 rotate-90" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => movePhase(i, 1)}
                    disabled={i === phaseOptions.length - 1}
                    className="h-4"
                  >
                    <GripVertical className="h-3 w-3 -rotate-90" />
                  </Button>
                </div>
                <span className="w-6 text-center text-xs text-muted-foreground">{opt.order}</span>
                <Input
                  value={opt.label}
                  onChange={(e) => updatePhase(i, { label: e.target.value })}
                  className="max-w-[200px]"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  onClick={() => removePhase(i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* キーアイテムタイプ設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">キーアイテムタイプ設定</CardTitle>
            <Button variant="outline" size="sm" onClick={addKeyItemType}>
              <Plus className="mr-1 h-3 w-3" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {keyItemTypes.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={opt.id}
                  onChange={(e) => updateKeyItemType(i, { id: e.target.value })}
                  className="w-28"
                  placeholder="ID"
                />
                <Input
                  value={opt.icon}
                  onChange={(e) => updateKeyItemType(i, { icon: e.target.value })}
                  className="w-16"
                  placeholder="アイコン"
                />
                <Input
                  value={opt.label}
                  onChange={(e) => updateKeyItemType(i, { label: e.target.value })}
                  className="max-w-[200px]"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  onClick={() => removeKeyItemType(i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        設定の変更は「保存」ボタンを押すまで反映されません。
      </p>
    </div>
  )
}
