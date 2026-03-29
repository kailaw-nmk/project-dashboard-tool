'use client'

import { create } from 'zustand'
import type {
  ProjectData,
  System,
  Issue,
  KeyItem,
  Dependency,
  WeeklySnapshot,
} from '@/types/schema'
import { getCurrentWeek } from '@/lib/week'

export type ActiveView = 'dashboard' | 'system' | 'history' | 'settings'

interface ProjectState {
  // Data
  projectData: ProjectData | null
  // UI
  selectedSystemId: string | null
  activeView: ActiveView

  // Data actions
  setProjectData: (data: ProjectData) => void
  clearProjectData: () => void

  // System CRUD
  addSystem: (system: System) => void
  updateSystem: (systemId: string, updates: Partial<System>) => void
  deleteSystem: (systemId: string) => void

  // Issue CRUD
  addIssue: (systemId: string, issue: Issue) => void
  updateIssue: (systemId: string, issueId: string, updates: Partial<Issue>) => void
  deleteIssue: (systemId: string, issueId: string) => void

  // KeyItem CRUD
  addKeyItem: (systemId: string, keyItem: KeyItem) => void
  updateKeyItem: (systemId: string, keyItemId: string, updates: Partial<KeyItem>) => void
  deleteKeyItem: (systemId: string, keyItemId: string) => void

  // Dependency CRUD
  addDependency: (dependency: Dependency) => void
  updateDependency: (dependencyId: string, updates: Partial<Dependency>) => void
  deleteDependency: (dependencyId: string) => void

  // Snapshot
  saveSnapshot: (snapshot: WeeklySnapshot) => void

  // UI actions
  setSelectedSystemId: (id: string | null) => void
  setActiveView: (view: ActiveView) => void
}

function now() {
  return new Date().toISOString()
}

function updateProjectTimestamp(data: ProjectData): ProjectData {
  return { ...data, lastUpdated: now() }
}

function updateSystemInList(
  systems: System[],
  systemId: string,
  updater: (system: System) => System,
): System[] {
  return systems.map((s) => (s.id === systemId ? updater(s) : s))
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projectData: null,
  selectedSystemId: null,
  activeView: 'dashboard',

  setProjectData: (data) => set({ projectData: { ...data, currentWeek: getCurrentWeek() } }),
  clearProjectData: () => set({ projectData: null, selectedSystemId: null }),

  // System CRUD
  addSystem: (system) =>
    set((state) => {
      if (!state.projectData) return state
      return {
        projectData: updateProjectTimestamp({
          ...state.projectData,
          systems: [...state.projectData.systems, system],
        }),
      }
    }),

  updateSystem: (systemId, updates) =>
    set((state) => {
      if (!state.projectData) return state
      return {
        projectData: updateProjectTimestamp({
          ...state.projectData,
          systems: updateSystemInList(state.projectData.systems, systemId, (s) => ({
            ...s,
            ...updates,
            updatedAt: now(),
          })),
        }),
      }
    }),

  deleteSystem: (systemId) =>
    set((state) => {
      if (!state.projectData) return state
      return {
        projectData: updateProjectTimestamp({
          ...state.projectData,
          systems: state.projectData.systems.filter((s) => s.id !== systemId),
          dependencies: state.projectData.dependencies.filter(
            (d) => d.sourceSystemId !== systemId && d.targetSystemId !== systemId,
          ),
        }),
      }
    }),

  // Issue CRUD
  addIssue: (systemId, issue) =>
    set((state) => {
      if (!state.projectData) return state
      return {
        projectData: updateProjectTimestamp({
          ...state.projectData,
          systems: updateSystemInList(state.projectData.systems, systemId, (s) => ({
            ...s,
            issues: [...s.issues, issue],
            updatedAt: now(),
          })),
        }),
      }
    }),

  updateIssue: (systemId, issueId, updates) =>
    set((state) => {
      if (!state.projectData) return state
      return {
        projectData: updateProjectTimestamp({
          ...state.projectData,
          systems: updateSystemInList(state.projectData.systems, systemId, (s) => ({
            ...s,
            issues: s.issues.map((i) => (i.id === issueId ? { ...i, ...updates } : i)),
            updatedAt: now(),
          })),
        }),
      }
    }),

  deleteIssue: (systemId, issueId) =>
    set((state) => {
      if (!state.projectData) return state
      return {
        projectData: updateProjectTimestamp({
          ...state.projectData,
          systems: updateSystemInList(state.projectData.systems, systemId, (s) => ({
            ...s,
            issues: s.issues.filter((i) => i.id !== issueId),
            updatedAt: now(),
          })),
        }),
      }
    }),

  // KeyItem CRUD
  addKeyItem: (systemId, keyItem) =>
    set((state) => {
      if (!state.projectData) return state
      return {
        projectData: updateProjectTimestamp({
          ...state.projectData,
          systems: updateSystemInList(state.projectData.systems, systemId, (s) => ({
            ...s,
            keyItems: [...s.keyItems, keyItem],
            updatedAt: now(),
          })),
        }),
      }
    }),

  updateKeyItem: (systemId, keyItemId, updates) =>
    set((state) => {
      if (!state.projectData) return state
      return {
        projectData: updateProjectTimestamp({
          ...state.projectData,
          systems: updateSystemInList(state.projectData.systems, systemId, (s) => ({
            ...s,
            keyItems: s.keyItems.map((k) => (k.id === keyItemId ? { ...k, ...updates } : k)),
            updatedAt: now(),
          })),
        }),
      }
    }),

  deleteKeyItem: (systemId, keyItemId) =>
    set((state) => {
      if (!state.projectData) return state
      return {
        projectData: updateProjectTimestamp({
          ...state.projectData,
          systems: updateSystemInList(state.projectData.systems, systemId, (s) => ({
            ...s,
            keyItems: s.keyItems.filter((k) => k.id !== keyItemId),
            updatedAt: now(),
          })),
        }),
      }
    }),

  // Dependency CRUD
  addDependency: (dependency) =>
    set((state) => {
      if (!state.projectData) return state
      return {
        projectData: updateProjectTimestamp({
          ...state.projectData,
          dependencies: [...state.projectData.dependencies, dependency],
        }),
      }
    }),

  updateDependency: (dependencyId, updates) =>
    set((state) => {
      if (!state.projectData) return state
      return {
        projectData: updateProjectTimestamp({
          ...state.projectData,
          dependencies: state.projectData.dependencies.map((d) =>
            d.id === dependencyId ? { ...d, ...updates } : d,
          ),
        }),
      }
    }),

  deleteDependency: (dependencyId) =>
    set((state) => {
      if (!state.projectData) return state
      return {
        projectData: updateProjectTimestamp({
          ...state.projectData,
          dependencies: state.projectData.dependencies.filter((d) => d.id !== dependencyId),
        }),
      }
    }),

  // Snapshot
  saveSnapshot: (snapshot) =>
    set((state) => {
      if (!state.projectData) return state
      const existing = state.projectData.weeklySnapshots.findIndex(
        (s) => s.week === snapshot.week,
      )
      const weeklySnapshots =
        existing >= 0
          ? state.projectData.weeklySnapshots.map((s, i) => (i === existing ? snapshot : s))
          : [...state.projectData.weeklySnapshots, snapshot]
      return {
        projectData: updateProjectTimestamp({
          ...state.projectData,
          weeklySnapshots,
        }),
      }
    }),

  // UI actions
  setSelectedSystemId: (id) => set({ selectedSystemId: id }),
  setActiveView: (view) => set({ activeView: view }),
}))
