import { z } from 'zod'

// --- Option schemas (settings) ---

export const StatusOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string(),
  icon: z.string(),
})

export const PhaseOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  order: z.number(),
})

export const KeyItemTypeSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
})

export const SettingsSchema = z.object({
  statusOptions: z.array(StatusOptionSchema),
  phaseOptions: z.array(PhaseOptionSchema),
  keyItemTypes: z.array(KeyItemTypeSchema),
})

// --- Position ---

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

// --- Issue ---

export const IssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['open', 'in-progress', 'closed']),
  priority: z.enum(['high', 'medium', 'low']),
  assignee: z.string(),
  dueDate: z.string(),
  description: z.string(),
})

// --- KeyItem ---

export const KeyItemSchema = z.object({
  id: z.string(),
  type: z.enum(['milestone', 'risk', 'decision', 'dependency']),
  title: z.string(),
  description: z.string(),
  dueDate: z.string().optional(),
  status: z.enum(['open', 'in-progress', 'closed']),
})

// --- System ---

export const SystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  owner: z.string(),
  status: z.string(),
  phase: z.string(),
  comment: z.string(),
  position: PositionSchema,
  issues: z.array(IssueSchema),
  keyItems: z.array(KeyItemSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// --- Dependency ---

export const DependencySchema = z.object({
  id: z.string(),
  sourceSystemId: z.string(),
  targetSystemId: z.string(),
  label: z.string(),
  description: z.string(),
  type: z.enum(['api', 'data', 'event', 'other']),
})

// --- Weekly Snapshot ---

export const WeeklySystemSnapshotSchema = z.object({
  systemId: z.string(),
  status: z.string(),
  phase: z.string(),
  comment: z.string(),
  openIssues: z.number(),
  openRisks: z.number(),
  openKeyItems: z.number(),
})

export const WeeklySnapshotSchema = z.object({
  week: z.string(),
  date: z.string(),
  systems: z.array(WeeklySystemSnapshotSchema),
  summary: z.string(),
})

// --- Project Data (root) ---

export const ProjectDataSchema = z.object({
  version: z.string(),
  projectName: z.string(),
  lastUpdated: z.string(),
  currentWeek: z.string(),
  settings: SettingsSchema,
  systems: z.array(SystemSchema),
  dependencies: z.array(DependencySchema),
  weeklySnapshots: z.array(WeeklySnapshotSchema),
})

// --- Inferred types ---

export type StatusOption = z.infer<typeof StatusOptionSchema>
export type PhaseOption = z.infer<typeof PhaseOptionSchema>
export type KeyItemType = z.infer<typeof KeyItemTypeSchema>
export type Settings = z.infer<typeof SettingsSchema>
export type Position = z.infer<typeof PositionSchema>
export type Issue = z.infer<typeof IssueSchema>
export type KeyItem = z.infer<typeof KeyItemSchema>
export type System = z.infer<typeof SystemSchema>
export type Dependency = z.infer<typeof DependencySchema>
export type WeeklySystemSnapshot = z.infer<typeof WeeklySystemSnapshotSchema>
export type WeeklySnapshot = z.infer<typeof WeeklySnapshotSchema>
export type ProjectData = z.infer<typeof ProjectDataSchema>
