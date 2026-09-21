import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { IdecoData } from '../../types/ideco'
import SimulatorSection from './SimulatorSection'

const sampleData: IdecoData = {
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
        note: '事業主の掛金相当額との合計が月5.5万円以内であることが必要です。',
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

describe('SimulatorSection', () => {
  it('isLoadingがtrueのときはローディング表示になる', () => {
    render(<SimulatorSection data={null} isLoading={true} error={null} />)
    expect(screen.getByText('制度データを読み込んでいます…')).toBeInTheDocument()
  })

  it('errorがあるときはエラー表示になる', () => {
    render(<SimulatorSection data={null} isLoading={false} error="取得に失敗しました" />)
    expect(screen.getByText('取得に失敗しました')).toBeInTheDocument()
  })

  it('送信前はプレースホルダーを表示する', () => {
    render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)
    expect(
      screen.getByText('条件を入力して「入力内容で確認する」を押すと、ここに結果が表示されます。'),
    ).toBeInTheDocument()
  })

  it('デフォルト値のまま送信すると、企業年金なし区分の結果が表示される', async () => {
    const user = userEvent.setup()
    render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

    await user.click(screen.getByRole('button', { name: '入力内容で確認する' }))

    expect(screen.getByText('240,000円')).toBeInTheDocument()
    expect(screen.getByText('会社員（企業年金なし） / 月額23,000円')).toBeInTheDocument()
    expect(screen.getByText('会社員（企業年金なし・将来） / 月額62,000円')).toBeInTheDocument()
    expect(screen.getByText('年間 約48,000円')).toBeInTheDocument()
  })

  it('企業型DCありにチェックし、掛金を変更して送信すると、企業年金あり区分の結果になる', async () => {
    const user = userEvent.setup()
    render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

    await user.click(screen.getByLabelText('企業型DC（企業型確定拠出年金）がある'))

    const amountInput = screen.getByLabelText('毎月の掛金額（円）')
    await user.clear(amountInput)
    await user.type(amountInput, '12000')

    await user.click(screen.getByRole('button', { name: '入力内容で確認する' }))

    expect(screen.getByText('144,000円')).toBeInTheDocument()
    expect(screen.getByText('会社員（企業年金あり） / 月額20,000円')).toBeInTheDocument()
    expect(
      screen.getByText('事業主の掛金相当額との合計が月5.5万円以内であることが必要です。'),
    ).toBeInTheDocument()
  })
})
