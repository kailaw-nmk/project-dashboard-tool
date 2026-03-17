import { describe, it, expect } from 'vitest'
import { createSnapshot } from '@/lib/snapshot'
import type { System } from '@/types/schema'

const makeSystem = (overrides?: Partial<System>): System => ({
  id: 'sys-001',
  name: 'テスト',
  description: '',
  owner: '担当者',
  status: 'on-track',
  phase: 'design',
  comment: 'コメント',
  position: { x: 0, y: 0 },
  issues: [
    { id: 'i1', title: 'Open', status: 'open', priority: 'high', assignee: '', dueDate: '', description: '' },
    { id: 'i2', title: 'Closed', status: 'closed', priority: 'low', assignee: '', dueDate: '', description: '' },
  ],
  keyItems: [
    { id: 'k1', type: 'risk', title: 'リスク', description: '', status: 'open' },
    { id: 'k2', type: 'milestone', title: 'MS', description: '', status: 'closed' },
    { id: 'k3', type: 'risk', title: 'リスク2', description: '', status: 'in-progress' },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('createSnapshot', () => {
  it('スナップショットを正しく生成する', () => {
    const systems = [makeSystem()]
    const snapshot = createSnapshot(systems, '2026-W01', 'テストサマリー')

    expect(snapshot.week).toBe('2026-W01')
    expect(snapshot.summary).toBe('テストサマリー')
    expect(snapshot.systems).toHaveLength(1)
  })

  it('openIssuesをclosed以外でカウントする', () => {
    const systems = [makeSystem()]
    const snapshot = createSnapshot(systems, '2026-W01', '')
    expect(snapshot.systems[0].openIssues).toBe(1) // open: 1, closed: 1
  })

  it('openRisksをriskタイプかつclosed以外でカウントする', () => {
    const systems = [makeSystem()]
    const snapshot = createSnapshot(systems, '2026-W01', '')
    expect(snapshot.systems[0].openRisks).toBe(2) // risk open + risk in-progress
  })

  it('openKeyItemsをclosed以外でカウントする', () => {
    const systems = [makeSystem()]
    const snapshot = createSnapshot(systems, '2026-W01', '')
    expect(snapshot.systems[0].openKeyItems).toBe(2) // open + in-progress
  })

  it('複数システムを処理できる', () => {
    const systems = [
      makeSystem({ id: 'sys-001' }),
      makeSystem({ id: 'sys-002', status: 'at-risk' }),
    ]
    const snapshot = createSnapshot(systems, '2026-W01', '')
    expect(snapshot.systems).toHaveLength(2)
    expect(snapshot.systems[1].status).toBe('at-risk')
  })

  it('システムなしでも動作する', () => {
    const snapshot = createSnapshot([], '2026-W01', 'テスト')
    expect(snapshot.systems).toHaveLength(0)
    expect(snapshot.summary).toBe('テスト')
  })
})
