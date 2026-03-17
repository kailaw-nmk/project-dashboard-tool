'use client'

import { useProjectStore } from '@/stores/project-store'
import { useShallow } from 'zustand/react/shallow'

export function useProject() {
  return useProjectStore()
}

export function useProjectData() {
  return useProjectStore((state) => state.projectData)
}

export function useSelectedSystem() {
  return useProjectStore(
    useShallow((state) => {
      if (!state.projectData || !state.selectedSystemId) return null
      return state.projectData.systems.find((s) => s.id === state.selectedSystemId) ?? null
    }),
  )
}

export function useActiveView() {
  return useProjectStore((state) => state.activeView)
}
