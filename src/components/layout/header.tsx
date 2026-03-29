'use client'

import { useRef } from 'react'
import { LayoutDashboard, Upload, Download, Image, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ProjectData } from '@/types/schema'

interface HeaderProps {
  projectData: ProjectData | null
  onImport: (file: File) => void
  onExport: () => void
  onExportPng?: () => void
}

export function Header({ projectData, onImport, onExport, onExportPng }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { resolvedTheme, setTheme } = useTheme()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImport(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold">
          {projectData ? projectData.projectName : 'Project Dashboard'}
        </span>
        {projectData && (
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                />
              }
            >
              <Upload className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>JSONインポート</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExport}
                  disabled={!projectData}
                />
              }
            >
              <Download className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>JSONエクスポート</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExportPng}
                  disabled={!projectData || !onExportPng}
                />
              }
            >
              <Image className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>PNGエクスポート（サマリービュー）</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label={resolvedTheme === 'dark' ? 'ライトモード' : 'ダークモード'}
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </header>
  )
}
