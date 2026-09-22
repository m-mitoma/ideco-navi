import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HomePage from './HomePage'

const sampleIdecoData = {
  sources: [],
  currentRules: { label: '現在の制度', effectiveFrom: '2024-12-01', categories: [] },
  futureRules: { label: '2026年12月以降の制度', effectiveFrom: '2026-12-01', categories: [] },
}

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/data/ideco.json')) {
        return Promise.resolve({ ok: true, json: async () => sampleIdecoData })
      }
      if (url.includes('/api/faqs')) {
        return Promise.resolve({ ok: true, json: async () => ({ contents: [] }) })
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`))
    }),
  )
}

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('掛金シミュレーションの入力フォームはHomePage本体には存在しない（別ページに移動済み）', async () => {
    stubFetch()
    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: '自分の場合を計算してみる' })).toBeInTheDocument(),
    )

    expect(screen.queryByRole('heading', { name: '掛金シミュレーション' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('毎月の掛金額（円）')).not.toBeInTheDocument()
  })

  it('掛金シミュレーションページへのリンクが表示される', async () => {
    stubFetch()
    renderPage()

    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: '掛金シミュレーションを見る' }),
      ).toHaveAttribute('href', '/contribution-simulator'),
    )
  })

  it('退職所得控除シミュレーターページへのリンクが表示される', async () => {
    stubFetch()
    renderPage()

    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: '退職所得控除シミュレーターを見る' }),
      ).toHaveAttribute('href', '/retirement-deduction'),
    )
  })

  it('Heroの「掛金シミュレーションを試す」は掛金シミュレーターページへのリンクになっている（ページ内アンカーではない）', () => {
    stubFetch()
    renderPage()

    const heroLink = screen.getByRole('link', { name: '掛金シミュレーションを試す' })
    expect(heroLink).toHaveAttribute('href', '/contribution-simulator')
  })
})
