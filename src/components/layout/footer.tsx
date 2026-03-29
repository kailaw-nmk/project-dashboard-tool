'use client'

import type { ProjectData } from '@/types/schema'

interface FooterProps {
  projectData: ProjectData
}

export function Footer({ projectData }: FooterProps) {
  return (
    <footer className="flex h-10 shrink-0 items-center justify-between border-t bg-background px-4 text-xs text-muted-foreground">
      <span>
        最終更新: {new Date(projectData.lastUpdated).toLocaleDateString('ja-JP')}{' '}
        {new Date(projectData.lastUpdated).toLocaleTimeString('ja-JP')}
      </span>
      <span>v{projectData.version}</span>
    </footer>
  )
}
