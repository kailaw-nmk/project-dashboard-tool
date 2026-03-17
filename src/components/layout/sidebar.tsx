'use client'

import { LayoutGrid, Monitor, History, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useActiveView } from '@/hooks/use-project'
import { useProjectStore } from '@/stores/project-store'
import type { ActiveView } from '@/stores/project-store'

const navItems: { view: ActiveView; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: '概要', icon: <LayoutGrid className="h-4 w-4" /> },
  { view: 'system', label: 'システム', icon: <Monitor className="h-4 w-4" /> },
  { view: 'history', label: '履歴', icon: <History className="h-4 w-4" /> },
]

const settingsItem = {
  view: 'settings' as ActiveView,
  label: '設定',
  icon: <Settings className="h-4 w-4" />,
}

export function Sidebar() {
  const activeView = useActiveView()
  const setActiveView = useProjectStore((s) => s.setActiveView)

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-white py-4">
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => (
          <Button
            key={item.view}
            variant="ghost"
            className={`justify-start gap-2 ${
              activeView === item.view
                ? 'bg-zinc-100 font-medium text-zinc-900'
                : 'text-zinc-600'
            }`}
            onClick={() => setActiveView(item.view)}
          >
            {item.icon}
            {item.label}
          </Button>
        ))}
        <Separator className="my-2" />
        <Button
          variant="ghost"
          className={`justify-start gap-2 ${
            activeView === settingsItem.view
              ? 'bg-zinc-100 font-medium text-zinc-900'
              : 'text-zinc-600'
          }`}
          onClick={() => setActiveView(settingsItem.view)}
        >
          {settingsItem.icon}
          {settingsItem.label}
        </Button>
      </nav>
    </aside>
  )
}
