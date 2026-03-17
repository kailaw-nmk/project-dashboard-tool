'use client'

import { useRef, useState } from 'react'
import { Database, Download, FileUp } from 'lucide-react'
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
import { AppShell } from '@/components/layout/app-shell'
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs'
import { SystemDetailSheet } from '@/components/system/system-detail-sheet'
import { SystemListView } from '@/components/system/system-list-view'
import { HistoryTabs } from '@/components/history/history-tabs'
import { useActiveView } from '@/hooks/use-project'

export default function Home() {
  const projectData = useProjectStore((s) => s.projectData)
  const setProjectData = useProjectStore((s) => s.setProjectData)
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

  return (
    <AppShell>
      <MainContent />
      <SystemDetailSheet />
    </AppShell>
  )
}

function MainContent() {
  const activeView = useActiveView()

  switch (activeView) {
    case 'dashboard':
      return <DashboardTabs />
    case 'system':
      return <SystemListView />
    case 'history':
      return <HistoryTabs />
    case 'settings':
      return (
        <div className="flex items-center justify-center py-20 text-zinc-400">
          設定 — 準備中
        </div>
      )
    default:
      return <DashboardTabs />
  }
}
