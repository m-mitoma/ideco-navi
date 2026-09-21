import { afterEach, describe, expect, it, vi } from 'vitest'
import { getFaqs } from './microcms'

describe('getFaqs', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('APIレスポンスのcontentsを新しい順（逆順）にして返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        contents: [
          { id: '1', question: 'Q1', answer: 'A1' },
          { id: '2', question: 'Q2', answer: 'A2' },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getFaqs()

    expect(fetchMock).toHaveBeenCalledWith('/api/faqs')
    expect(result).toEqual([
      { id: '2', question: 'Q2', answer: 'A2' },
      { id: '1', question: 'Q1', answer: 'A1' },
    ])
  })

  it('レスポンスがエラーの場合は例外を投げる', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getFaqs()).rejects.toThrow('FAQ API request failed: 500')
  })
})
