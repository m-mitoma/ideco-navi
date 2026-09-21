import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useIdecoRules } from './useIdecoRules'

const sampleData = {
  sources: [],
  currentRules: { label: '現在', effectiveFrom: '2024-12-01', categories: [] },
  futureRules: { label: '未来', effectiveFrom: '2026-12-01', categories: [] },
}

describe('useIdecoRules', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('取得に成功するとdataが入りisLoadingがfalseになる', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => sampleData,
      }),
    )

    const { result } = renderHook(() => useIdecoRules())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(sampleData)
    expect(result.current.error).toBeNull()
  })

  it('取得に失敗するとerrorが入りisLoadingがfalseになる', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    )

    const { result } = renderHook(() => useIdecoRules())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('制度データの取得に失敗しました')
  })
})
