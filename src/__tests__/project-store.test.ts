import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '@/stores/project-store'
import type { ProjectData, System, Issue, KeyItem, Dependency } from '@/types/schema'

const makeSampleData = (): ProjectData => ({
  version: '1.0',
  projectName: 'テストプロジェクト',
  lastUpdated: '2026-01-01T00:00:00Z',
  currentWeek: '2026-W01',
  settings: {
    statusOptions: [
      { id: 'on-track', label: '順調', color: '#22c55e', icon: 'circle-check' },
      { id: 'at-risk', label: '注意', color: '#f59e0b', icon: 'alert-triangle' },
    ],
    phaseOptions: [
      { id: 'design', label: '設計', order: 1 },
      { id: 'implementation', label: '実装', order: 2 },
    ],
    keyItemTypes: [
      { id: 'milestone', label: 'マイルストーン', icon: '📌' },
    ],
  },
  systems: [],
  dependencies: [],
  weeklySnapshots: [],
})

const makeSystem = (overrides?: Partial<System>): System => ({
  id: 'sys-001',
  name: 'テストシステム',
  description: '説明',
  owner: '担当者',
  status: 'on-track',
  phase: 'design',
  comment: '',
  position: { x: 0, y: 0 },
  issues: [],
  keyItems: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

const makeIssue = (overrides?: Partial<Issue>): Issue => ({
  id: 'issue-001',
  title: 'テストIssue',
  status: 'open',
  priority: 'medium',
  assignee: '担当者',
  dueDate: '2026-01-31',
  description: '',
  ...overrides,
})

const makeKeyItem = (overrides?: Partial<KeyItem>): KeyItem => ({
  id: 'ki-001',
  type: 'milestone',
  title: 'テストマイルストーン',
  description: '',
  status: 'open',
  ...overrides,
})

const makeDependency = (overrides?: Partial<Dependency>): Dependency => ({
  id: 'dep-001',
  sourceSystemId: 'sys-001',
  targetSystemId: 'sys-002',
  label: 'API連携',
  type: 'api',
  description: '',
  ...overrides,
})

describe('ProjectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projectData: null,
      selectedSystemId: null,
      activeView: 'dashboard',
    })
  })

  describe('setProjectData / clearProjectData', () => {
    it('データを設定できる', () => {
      const data = makeSampleData()
      useProjectStore.getState().setProjectData(data)
      const stored = useProjectStore.getState().projectData
      expect(stored).not.toBeNull()
      // currentWeek は自動設定されるため、それ以外のフィールドで比較
      expect(stored!.projectName).toEqual(data.projectName)
      expect(stored!.systems).toEqual(data.systems)
      expect(stored!.settings).toEqual(data.settings)
      expect(stored!.currentWeek).toBeTruthy()
    })

    it('データをクリアできる', () => {
      useProjectStore.getState().setProjectData(makeSampleData())
      useProjectStore.getState().clearProjectData()
      expect(useProjectStore.getState().projectData).toBeNull()
      expect(useProjectStore.getState().selectedSystemId).toBeNull()
    })
  })

  describe('System CRUD', () => {
    beforeEach(() => {
      useProjectStore.getState().setProjectData(makeSampleData())
    })

    it('システムを追加できる', () => {
      const system = makeSystem()
      useProjectStore.getState().addSystem(system)
      const systems = useProjectStore.getState().projectData!.systems
      expect(systems).toHaveLength(1)
      expect(systems[0].name).toBe('テストシステム')
    })

    it('システムを更新できる', () => {
      useProjectStore.getState().addSystem(makeSystem())
      useProjectStore.getState().updateSystem('sys-001', { name: '更新済み' })
      const system = useProjectStore.getState().projectData!.systems[0]
      expect(system.name).toBe('更新済み')
    })

    it('システムを削除できる', () => {
      useProjectStore.getState().addSystem(makeSystem())
      useProjectStore.getState().deleteSystem('sys-001')
      expect(useProjectStore.getState().projectData!.systems).toHaveLength(0)
    })

    it('システム削除時に関連する依存関係も削除される', () => {
      useProjectStore.getState().addSystem(makeSystem({ id: 'sys-001' }))
      useProjectStore.getState().addSystem(makeSystem({ id: 'sys-002', name: 'System2' }))
      useProjectStore.getState().addDependency(makeDependency())
      expect(useProjectStore.getState().projectData!.dependencies).toHaveLength(1)

      useProjectStore.getState().deleteSystem('sys-001')
      expect(useProjectStore.getState().projectData!.dependencies).toHaveLength(0)
    })
  })

  describe('Issue CRUD', () => {
    beforeEach(() => {
      useProjectStore.getState().setProjectData(makeSampleData())
      useProjectStore.getState().addSystem(makeSystem())
    })

    it('Issueを追加できる', () => {
      useProjectStore.getState().addIssue('sys-001', makeIssue())
      const issues = useProjectStore.getState().projectData!.systems[0].issues
      expect(issues).toHaveLength(1)
      expect(issues[0].title).toBe('テストIssue')
    })

    it('Issueを更新できる', () => {
      useProjectStore.getState().addIssue('sys-001', makeIssue())
      useProjectStore.getState().updateIssue('sys-001', 'issue-001', { status: 'closed' })
      const issue = useProjectStore.getState().projectData!.systems[0].issues[0]
      expect(issue.status).toBe('closed')
    })

    it('Issueを削除できる', () => {
      useProjectStore.getState().addIssue('sys-001', makeIssue())
      useProjectStore.getState().deleteIssue('sys-001', 'issue-001')
      expect(useProjectStore.getState().projectData!.systems[0].issues).toHaveLength(0)
    })
  })

  describe('KeyItem CRUD', () => {
    beforeEach(() => {
      useProjectStore.getState().setProjectData(makeSampleData())
      useProjectStore.getState().addSystem(makeSystem())
    })

    it('キーアイテムを追加できる', () => {
      useProjectStore.getState().addKeyItem('sys-001', makeKeyItem())
      const items = useProjectStore.getState().projectData!.systems[0].keyItems
      expect(items).toHaveLength(1)
    })

    it('キーアイテムを更新できる', () => {
      useProjectStore.getState().addKeyItem('sys-001', makeKeyItem())
      useProjectStore.getState().updateKeyItem('sys-001', 'ki-001', { status: 'closed' })
      expect(useProjectStore.getState().projectData!.systems[0].keyItems[0].status).toBe('closed')
    })

    it('キーアイテムを削除できる', () => {
      useProjectStore.getState().addKeyItem('sys-001', makeKeyItem())
      useProjectStore.getState().deleteKeyItem('sys-001', 'ki-001')
      expect(useProjectStore.getState().projectData!.systems[0].keyItems).toHaveLength(0)
    })
  })

  describe('Dependency CRUD', () => {
    beforeEach(() => {
      useProjectStore.getState().setProjectData(makeSampleData())
    })

    it('依存関係を追加できる', () => {
      useProjectStore.getState().addDependency(makeDependency())
      expect(useProjectStore.getState().projectData!.dependencies).toHaveLength(1)
    })

    it('依存関係を更新できる', () => {
      useProjectStore.getState().addDependency(makeDependency())
      useProjectStore.getState().updateDependency('dep-001', { label: '更新済み' })
      expect(useProjectStore.getState().projectData!.dependencies[0].label).toBe('更新済み')
    })

    it('依存関係を削除できる', () => {
      useProjectStore.getState().addDependency(makeDependency())
      useProjectStore.getState().deleteDependency('dep-001')
      expect(useProjectStore.getState().projectData!.dependencies).toHaveLength(0)
    })
  })

  describe('Snapshot', () => {
    beforeEach(() => {
      useProjectStore.getState().setProjectData(makeSampleData())
    })

    it('スナップショットを保存できる', () => {
      useProjectStore.getState().saveSnapshot({
        week: '2026-W01',
        date: '2026-01-01T00:00:00Z',
        systems: [],
        summary: 'テスト',
      })
      expect(useProjectStore.getState().projectData!.weeklySnapshots).toHaveLength(1)
    })

    it('同じ週のスナップショットは上書きされる', () => {
      useProjectStore.getState().saveSnapshot({
        week: '2026-W01',
        date: '2026-01-01T00:00:00Z',
        systems: [],
        summary: '1回目',
      })
      useProjectStore.getState().saveSnapshot({
        week: '2026-W01',
        date: '2026-01-02T00:00:00Z',
        systems: [],
        summary: '2回目',
      })
      const snaps = useProjectStore.getState().projectData!.weeklySnapshots
      expect(snaps).toHaveLength(1)
      expect(snaps[0].summary).toBe('2回目')
    })
  })

  describe('UI State', () => {
    it('selectedSystemIdを設定できる', () => {
      useProjectStore.getState().setSelectedSystemId('sys-001')
      expect(useProjectStore.getState().selectedSystemId).toBe('sys-001')
    })

    it('activeViewを設定できる', () => {
      useProjectStore.getState().setActiveView('settings')
      expect(useProjectStore.getState().activeView).toBe('settings')
    })
  })
})
