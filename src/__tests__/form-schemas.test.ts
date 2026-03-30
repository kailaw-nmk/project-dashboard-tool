import { describe, it, expect } from 'vitest'
import {
  SystemFormSchema,
  IssueFormSchema,
  KeyItemFormSchema,
  DependencyFormSchema,
} from '@/types/form-schemas'

describe('SystemFormSchema', () => {
  it('有効なデータを受け付ける', () => {
    const result = SystemFormSchema.safeParse({
      name: 'テスト',
      description: '説明',
      owner: '担当者',
      status: 'on-track',
      phase: 'design',
      comment: '',
    })
    expect(result.success).toBe(true)
  })

  it('名前が空の場合はエラー', () => {
    const result = SystemFormSchema.safeParse({
      name: '',
      description: '',
      owner: '担当者',
      status: 'on-track',
      phase: 'design',
      comment: '',
    })
    expect(result.success).toBe(false)
  })

  it('担当者が空の場合はエラー', () => {
    const result = SystemFormSchema.safeParse({
      name: 'テスト',
      description: '',
      owner: '',
      status: 'on-track',
      phase: 'design',
      comment: '',
    })
    expect(result.success).toBe(false)
  })

  it('ステータスが空の場合はエラー', () => {
    const result = SystemFormSchema.safeParse({
      name: 'テスト',
      description: '',
      owner: '担当者',
      status: '',
      phase: 'design',
      comment: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('IssueFormSchema', () => {
  it('有効なデータを受け付ける', () => {
    const result = IssueFormSchema.safeParse({
      title: 'テストIssue',
      status: 'open',
      priority: 'high',
      assignee: '',
      dueDate: '',
      description: '',
      externalLink: '',
    })
    expect(result.success).toBe(true)
  })

  it('タイトルが空の場合はエラー', () => {
    const result = IssueFormSchema.safeParse({
      title: '',
      status: 'open',
      priority: 'medium',
      assignee: '',
      dueDate: '',
      description: '',
    })
    expect(result.success).toBe(false)
  })

  it('無効なステータスはエラー', () => {
    const result = IssueFormSchema.safeParse({
      title: 'テスト',
      status: 'invalid',
      priority: 'medium',
      assignee: '',
      dueDate: '',
      description: '',
    })
    expect(result.success).toBe(false)
  })

  it('無効な優先度はエラー', () => {
    const result = IssueFormSchema.safeParse({
      title: 'テスト',
      status: 'open',
      priority: 'critical',
      assignee: '',
      dueDate: '',
      description: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('KeyItemFormSchema', () => {
  it('有効なデータを受け付ける', () => {
    const result = KeyItemFormSchema.safeParse({
      type: 'milestone',
      title: 'テスト',
      description: '',
      status: 'open',
      externalLink: '',
    })
    expect(result.success).toBe(true)
  })

  it('dueDateはオプション', () => {
    const result = KeyItemFormSchema.safeParse({
      type: 'risk',
      title: 'テスト',
      description: '',
      dueDate: '2026-03-01',
      status: 'in-progress',
      externalLink: '',
    })
    expect(result.success).toBe(true)
  })

  it('無効なタイプはエラー', () => {
    const result = KeyItemFormSchema.safeParse({
      type: 'invalid',
      title: 'テスト',
      description: '',
      status: 'open',
    })
    expect(result.success).toBe(false)
  })
})

describe('DependencyFormSchema', () => {
  it('有効なデータを受け付ける', () => {
    const result = DependencyFormSchema.safeParse({
      sourceSystemId: 'sys-001',
      targetSystemId: 'sys-002',
      label: 'API連携',
      type: 'api',
      description: '',
    })
    expect(result.success).toBe(true)
  })

  it('ソースシステムIDが空の場合はエラー', () => {
    const result = DependencyFormSchema.safeParse({
      sourceSystemId: '',
      targetSystemId: 'sys-002',
      label: '',
      type: 'api',
      description: '',
    })
    expect(result.success).toBe(false)
  })

  it('無効なタイプはエラー', () => {
    const result = DependencyFormSchema.safeParse({
      sourceSystemId: 'sys-001',
      targetSystemId: 'sys-002',
      label: '',
      type: 'invalid',
      description: '',
    })
    expect(result.success).toBe(false)
  })
})
