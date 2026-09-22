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

  describe('年齢・年収の入力UX', () => {
    it('年齢欄をDeleteで空にできる（0が残らない）', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const ageInput = screen.getByLabelText('年齢') as HTMLInputElement
      await user.clear(ageInput)

      expect(ageInput.value).toBe('')
    })

    it('空欄から数字を入力しても「0」の後ろに連結されない', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const ageInput = screen.getByLabelText('年齢') as HTMLInputElement
      await user.clear(ageInput)
      await user.type(ageInput, '4')

      expect(ageInput.value).toBe('4')
    })

    it('年収欄をDeleteで空にしてから入力すると、そのまま入力した値になる', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const incomeInput = screen.getByLabelText('年収（円）') as HTMLInputElement
      await user.clear(incomeInput)
      await user.type(incomeInput, '6000000')

      expect(incomeInput.value).toBe('6,000,000')
    })

    it('毎月の掛金額欄もカンマ区切りで表示される', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const amountInput = screen.getByLabelText('毎月の掛金額（円）') as HTMLInputElement
      await user.clear(amountInput)
      await user.type(amountInput, '123000')

      expect(amountInput.value).toBe('123,000')
    })

    it('カンマ区切り表示の年収・掛金額でも、送信時の計算結果は正しい値になる（表示のカンマが計算に影響しない）', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const incomeInput = screen.getByLabelText('年収（円）') as HTMLInputElement
      await user.clear(incomeInput)
      await user.type(incomeInput, '9000000')
      expect(incomeInput.value).toBe('9,000,000')

      const amountInput = screen.getByLabelText('毎月の掛金額（円）') as HTMLInputElement
      await user.clear(amountInput)
      await user.type(amountInput, '23000')
      expect(amountInput.value).toBe('23,000')

      await user.click(screen.getByRole('button', { name: '入力内容で確認する' }))

      // 年間掛金: 23,000円 × 12 = 276,000円
      expect(screen.getByText('276,000円')).toBeInTheDocument()
      // 年収900万円（800万円以上）は税率30%: 276,000円 × 0.3 = 82,800円
      expect(screen.getByText('年間 約82,800円')).toBeInTheDocument()
    })

    it('年齢欄に小数点や文字列を入力しても反映されない', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const ageInput = screen.getByLabelText('年齢') as HTMLInputElement
      await user.clear(ageInput)
      await user.type(ageInput, '3')
      await user.type(ageInput, '.')
      await user.type(ageInput, '5')
      await user.type(ageInput, 'a')

      expect(ageInput.value).toBe('35')
    })
  })

  describe('年齢・年収のバリデーション', () => {
    it('年齢にマイナス値を入力するとエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const ageInput = screen.getByLabelText('年齢')
      await user.clear(ageInput)
      await user.type(ageInput, '-10')

      expect(screen.getByRole('alert')).toHaveTextContent('年齢は0以上で入力してください。')
    })

    it('年収にマイナス値を入力するとエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const incomeInput = screen.getByLabelText('年収（円）')
      await user.clear(incomeInput)
      await user.type(incomeInput, '-1000000')

      expect(screen.getByRole('alert')).toHaveTextContent('年収は0円以上で入力してください。')
    })

    it('年齢が20歳未満だとiDeCoの加入可能年齢のエラーになる', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const ageInput = screen.getByLabelText('年齢')
      await user.clear(ageInput)
      await user.type(ageInput, '19')

      expect(screen.getByRole('alert')).toHaveTextContent('iDeCoは20歳以上の方が加入対象です。')
    })

    it('年齢が70歳以上だとエラーになるが、69歳まではエラーにならない（60歳以上を一律不可にしない）', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const ageInput = screen.getByLabelText('年齢')
      await user.clear(ageInput)
      await user.type(ageInput, '69')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      await user.clear(ageInput)
      await user.type(ageInput, '70')
      expect(screen.getByRole('alert')).toHaveTextContent('iDeCoは70歳未満の方が加入対象です。')
    })

    it('年齢が空欄だとエラーになり、送信しても計算が実行されない', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const ageInput = screen.getByLabelText('年齢')
      await user.clear(ageInput)

      await user.click(screen.getByRole('button', { name: '入力内容で確認する' }))

      expect(
        screen.getByText(
          '条件を入力して「入力内容で確認する」を押すと、ここに結果が表示されます。',
        ),
      ).toBeInTheDocument()
    })
  })

  describe('掛金額のバリデーション', () => {
    it('正常な掛金額（デフォルト値20,000円）ではエラーにならず、送信すると計算結果が表示される', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: '入力内容で確認する' }))

      expect(screen.getByText('240,000円')).toBeInTheDocument()
    })

    it('0円はエラーにならない', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const amountInput = screen.getByLabelText('毎月の掛金額（円）')
      await user.clear(amountInput)
      await user.type(amountInput, '0')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('マイナス値を入力するとエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const amountInput = screen.getByLabelText('毎月の掛金額（円）')
      await user.clear(amountInput)
      await user.type(amountInput, '-1000')

      expect(screen.getByRole('alert')).toHaveTextContent('掛金額は0円以上で入力してください。')
    })

    it('拠出限度額（企業年金なし・現在の制度: 月額23,000円）ちょうどはエラーにならない', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const amountInput = screen.getByLabelText('毎月の掛金額（円）')
      await user.clear(amountInput)
      await user.type(amountInput, '23000')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('拠出限度額を1円超えるとエラーメッセージが表示され、送信しても計算結果は表示されない', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const amountInput = screen.getByLabelText('毎月の掛金額（円）')
      await user.clear(amountInput)
      await user.type(amountInput, '23001')

      expect(screen.getByRole('alert')).toHaveTextContent(
        '掛金額は月額23,000円以下で入力してください。',
      )

      await user.click(screen.getByRole('button', { name: '入力内容で確認する' }))
      expect(
        screen.getByText(
          '条件を入力して「入力内容で確認する」を押すと、ここに結果が表示されます。',
        ),
      ).toBeInTheDocument()
    })

    it('企業年金の有無を切り替えると、拠出限度額（上限）の判定もそれに合わせて変わる', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const amountInput = screen.getByLabelText('毎月の掛金額（円）')
      await user.clear(amountInput)
      await user.type(amountInput, '21000')
      // 企業年金なし（現在の制度: 月額23,000円）の範囲内なのでエラーにならない
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      // 企業型DCありに切り替えると、現在の制度の上限が月額20,000円になり、21,000円は超過する
      await user.click(screen.getByLabelText('企業型DC（企業型確定拠出年金）がある'))
      expect(screen.getByRole('alert')).toHaveTextContent(
        '掛金額は月額20,000円以下で入力してください。',
      )
    })

    it('掛金額が空欄だとエラーになり、送信しても計算が実行されない', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const amountInput = screen.getByLabelText('毎月の掛金額（円）')
      await user.clear(amountInput)

      expect(screen.getByRole('alert')).toHaveTextContent('掛金額を入力してください。')

      await user.click(screen.getByRole('button', { name: '入力内容で確認する' }))
      expect(
        screen.getByText(
          '条件を入力して「入力内容で確認する」を押すと、ここに結果が表示されます。',
        ),
      ).toBeInTheDocument()
    })
  })

  describe('掛金額のバリデーション：2026年12月以降の制度を選んだ場合', () => {
    async function selectFuturePeriod(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByLabelText('2026年12月以降の制度'))
    }

    it('デフォルトでは「現在の制度」が選ばれている', () => {
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      expect(screen.getByLabelText('現在の制度')).toBeChecked()
      expect(screen.getByLabelText('2026年12月以降の制度')).not.toBeChecked()
    })

    it('2026年12月以降の制度 + 正常な掛金（50,000円）はエラーにならない', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      await selectFuturePeriod(user)
      const amountInput = screen.getByLabelText('毎月の掛金額（円）')
      await user.clear(amountInput)
      await user.type(amountInput, '50000')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('2026年12月以降の制度 + 新しい上限（月額62,000円）ちょうどはエラーにならない', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      await selectFuturePeriod(user)
      const amountInput = screen.getByLabelText('毎月の掛金額（円）')
      await user.clear(amountInput)
      await user.type(amountInput, '62000')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('2026年12月以降の制度 + 新しい上限を1円超えるとエラーになる', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      await selectFuturePeriod(user)
      const amountInput = screen.getByLabelText('毎月の掛金額（円）')
      await user.clear(amountInput)
      await user.type(amountInput, '62001')

      expect(screen.getByRole('alert')).toHaveTextContent(
        '掛金額は月額62,000円以下で入力してください。',
      )
    })

    it('現在の制度では上限超過でも、2026年12月以降の制度に切り替えるとエラーが解消される（同じ金額のまま）', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const amountInput = screen.getByLabelText('毎月の掛金額（円）')
      await user.clear(amountInput)
      await user.type(amountInput, '30000')
      // 現在の制度（企業年金なし・月額23,000円）では超過
      expect(screen.getByRole('alert')).toHaveTextContent(
        '掛金額は月額23,000円以下で入力してください。',
      )

      // 2026年12月以降の制度（月額62,000円）に切り替えると、同じ30,000円でもエラーが消える
      await selectFuturePeriod(user)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('2026年12月以降の制度を選んだ状態でも、マイナス値は変わらずエラーになる', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      await selectFuturePeriod(user)
      const amountInput = screen.getByLabelText('毎月の掛金額（円）')
      await user.clear(amountInput)
      await user.type(amountInput, '-1')

      expect(screen.getByRole('alert')).toHaveTextContent('掛金額は0円以上で入力してください。')
    })
  })

  describe('異常な入力値でのシミュレーション実行防止', () => {
    it('年齢がマイナスのまま送信しても計算結果は表示されない', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const ageInput = screen.getByLabelText('年齢')
      await user.clear(ageInput)
      await user.type(ageInput, '-5')

      await user.click(screen.getByRole('button', { name: '入力内容で確認する' }))

      expect(
        screen.getByText(
          '条件を入力して「入力内容で確認する」を押すと、ここに結果が表示されます。',
        ),
      ).toBeInTheDocument()
    })

    it('年収がマイナスのまま送信しても計算結果は表示されない', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const incomeInput = screen.getByLabelText('年収（円）')
      await user.clear(incomeInput)
      await user.type(incomeInput, '-1000000')

      await user.click(screen.getByRole('button', { name: '入力内容で確認する' }))

      expect(
        screen.getByText(
          '条件を入力して「入力内容で確認する」を押すと、ここに結果が表示されます。',
        ),
      ).toBeInTheDocument()
    })

    it('正常値に修正してから送信すると、通常どおり計算結果が表示される', async () => {
      const user = userEvent.setup()
      render(<SimulatorSection data={sampleData} isLoading={false} error={null} />)

      const ageInput = screen.getByLabelText('年齢')
      await user.clear(ageInput)
      await user.type(ageInput, '-5')
      await user.clear(ageInput)
      await user.type(ageInput, '45')

      await user.click(screen.getByRole('button', { name: '入力内容で確認する' }))

      expect(screen.getByText('240,000円')).toBeInTheDocument()
      expect(screen.getByText('年間 約48,000円')).toBeInTheDocument()
    })
  })
})
