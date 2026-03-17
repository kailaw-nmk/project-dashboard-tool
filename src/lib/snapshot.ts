import type { System, WeeklySnapshot, WeeklySystemSnapshot } from '@/types/schema'

export function createSnapshot(
  systems: System[],
  currentWeek: string,
  summary: string,
): WeeklySnapshot {
  const systemSnapshots: WeeklySystemSnapshot[] = systems.map((s) => ({
    systemId: s.id,
    status: s.status,
    phase: s.phase,
    comment: s.comment,
    openIssues: s.issues.filter((i) => i.status !== 'closed').length,
    openRisks: s.keyItems.filter((k) => k.type === 'risk' && k.status !== 'closed').length,
    openKeyItems: s.keyItems.filter((k) => k.status !== 'closed').length,
  }))

  return {
    week: currentWeek,
    date: new Date().toISOString(),
    systems: systemSnapshots,
    summary,
  }
}
