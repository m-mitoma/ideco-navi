import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ContributionSimulatorPage from './ContributionSimulatorPage'

const sampleData = {
  sources: [],
  currentRules: {
    label: '現在の制度',
    effectiveFrom: '2024-12-01',
    categories: [
      {
        id: 'employee-no-pension',
        group: 'employee-no-pension',
        label: '会社員（企業年金なし）',
        monthlyLimit: 23000,
        note: '',
      },
      {
        id: 'employee-with-pension',
        group: 'employee-with-pension',
        label: '会社員（企業年金あり）',
        monthlyLimit: 20000,
        note: '',
      },
    ],
  },
  futureRules: {
    label: '2026年12月以降の制度',
    effectiveFrom: '2026-12-01',
    categories: [
      {
        id: 'employee-no-pension',
        group: 'employee-no-pension',
        label: '会社員（企業年金なし・将来）',
        monthlyLimit: 62000,
        note: '',
      },
      {
        id: 'employee-with-pension',
        group: 'employee-with-pension',
        label: '会社員（企業年金あり・将来）',
        monthlyLimit: 62000,
        note: '',
      },
    ],
  },
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ContributionSimulatorPage />
    </MemoryRouter>,
  )
}

describe('ContributionSimulatorPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('タイトルと掛金シミュレーションの見出しが表示される', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => sampleData }),
    )
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'iDeCoの掛金、いくらまで拠出できる？' }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: '掛金シミュレーション' })).toBeInTheDocument(),
    )
  })

  it('既存の計算ロジックがそのまま移植されており、入力して送信すると結果が表示される', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => sampleData }),
    )
    const user = userEvent.setup()
    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: '入力内容で確認する' })).toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: '入力内容で確認する' }))

    // デフォルト値（毎月2万円）での年間掛金 = 240,000円（SimulatorSectionの既存ロジックのまま）
    expect(screen.getByText('240,000円')).toBeInTheDocument()
    expect(screen.getByText('会社員（企業年金なし） / 月額23,000円')).toBeInTheDocument()
  })

  it('データ取得に失敗した場合はエラー表示になる', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    renderPage()

    await waitFor(() =>
      expect(screen.getByText('制度データの取得に失敗しました')).toBeInTheDocument(),
    )
  })

  it('退職所得控除シミュレーター・トップページへ戻るリンクがある', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => sampleData }),
    )
    renderPage()

    expect(screen.getByRole('link', { name: '退職所得控除シミュレーターを見る' })).toHaveAttribute(
      'href',
      '/retirement-deduction',
    )
    expect(screen.getByRole('link', { name: 'トップページへ戻る' })).toHaveAttribute('href', '/')
  })
})
