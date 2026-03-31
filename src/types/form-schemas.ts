import { z } from 'zod'

export const SystemFormSchema = z.object({
  name: z.string().min(1, 'システム名は必須です'),
  description: z.string(),
  owner: z.string().min(1, '担当者は必須です'),
  status: z.string().min(1, 'ステータスは必須です'),
  phase: z.string().min(1, 'フェーズは必須です'),
  comment: z.string(),
})

export const IssueFormSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  status: z.enum(['open', 'in-progress', 'closed']),
  priority: z.enum(['high', 'medium', 'low']),
  assignee: z.string(),
  stakeholders: z.string(),
  dueDate: z.string(),
  description: z.string(),
  externalLink: z.string(),
})

export const KeyItemFormSchema = z.object({
  type: z.enum(['milestone', 'risk', 'decision', 'dependency']),
  title: z.string().min(1, 'タイトルは必須です'),
  assignee: z.string(),
  stakeholders: z.string(),
  description: z.string(),
  dueDate: z.string().optional(),
  status: z.enum(['open', 'in-progress', 'closed']),
  externalLink: z.string(),
})

export const DependencyFormSchema = z.object({
  sourceSystemId: z.string().min(1, 'ソースシステムは必須です'),
  targetSystemId: z.string().min(1, 'ターゲットシステムは必須です'),
  label: z.string(),
  type: z.enum(['api', 'data', 'event', 'other']),
  description: z.string(),
})

export type SystemFormData = z.infer<typeof SystemFormSchema>
export type IssueFormData = z.infer<typeof IssueFormSchema>
export type KeyItemFormData = z.infer<typeof KeyItemFormSchema>
export type DependencyFormData = z.infer<typeof DependencyFormSchema>
