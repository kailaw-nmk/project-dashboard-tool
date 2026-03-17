'use client'

import { useRef, useState } from 'react'
import { Database, Download, FileUp, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useProjectStore } from '@/stores/project-store'
import { loadSampleData } from '@/lib/sample-data'
import { importProjectData } from '@/lib/import'
import { exportProjectDataAsJson } from '@/lib/export'

export default function Home() {
  const { projectData, setProjectData, clearProjectData } = useProjectStore()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLoadSample = () => {
    try {
      const data = loadSampleData()
      setProjectData(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'サンプルデータの読み込みに失敗しました。')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await importProjectData(file)
      setProjectData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました。')
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExport = () => {
    if (projectData) {
      exportProjectDataAsJson(projectData)
    }
  }

  const handleClear = () => {
    clearProjectData()
    setError(null)
  }

  if (!projectData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">プロジェクトダッシュボード</CardTitle>
            <CardDescription>
              Systems of Systems の開発状況を一元管理・可視化するツール
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={handleLoadSample} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              サンプルデータを読み込む
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="mr-2 h-4 w-4" />
              JSONファイルをインポート
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            {error && (
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const systemCount = projectData.systems.length
  const openIssueCount = projectData.systems.reduce(
    (sum, s) => sum + s.issues.filter((i) => i.status !== 'closed').length,
    0,
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{projectData.projectName}</CardTitle>
          <CardDescription>
            Week: {projectData.currentWeek} / 最終更新:{' '}
            {new Date(projectData.lastUpdated).toLocaleDateString('ja-JP')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{systemCount}</p>
              <p className="text-sm text-zinc-600">システム数</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{openIssueCount}</p>
              <p className="text-sm text-zinc-600">オープンIssue</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              データをエクスポート
            </Button>
            <Button onClick={handleClear} variant="destructive" className="flex-1">
              <Trash2 className="mr-2 h-4 w-4" />
              データをクリア
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
