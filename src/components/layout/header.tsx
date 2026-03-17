'use client'

import { useRef } from 'react'
import { LayoutDashboard, Upload, Download, Image } from 'lucide-react'
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
}

export function Header({ projectData, onImport, onExport }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-blue-600" />
        <span className="text-lg font-semibold">
          {projectData ? projectData.projectName : 'Project Dashboard'}
        </span>
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
                <Button variant="ghost" size="icon" disabled />
              }
            >
              <Image className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>PNGエクスポート（準備中）</TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
