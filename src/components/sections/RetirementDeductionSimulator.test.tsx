import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import RetirementDeductionSimulator from './RetirementDeductionSimulator'

// years/monthsは親コンポーネントが保持する制御コンポーネントのため、
// テストでも実際の使われ方に合わせてstateを持つラッパーで描画する。
function ControlledSimulator({ initialYears = 20, initialMonths = 6 }) {
  const [years, setYears] = useState(initialYears)
  const [months, setMonths] = useState(initialMonths)
  return (
    <RetirementDeductionSimulator
      years={years}
      months={months}
      onYearsChange={setYears}
      onMonthsChange={setMonths}
    />
  )
}

describe('RetirementDeductionSimulator', () => {
  it('初期値の加入期間から計算結果を表示する', () => {
    render(<ControlledSimulator initialYears={10} initialMonths={0} />)

    expect(screen.getByText('4,000,000円')).toBeInTheDocument()
    expect(screen.getByText('40万円 × 10年')).toBeInTheDocument()
  })

  it('年数を入力すると結果が再計算される', async () => {
    const user = userEvent.setup()
    render(<ControlledSimulator initialYears={10} initialMonths={0} />)

    const yearsInput = screen.getByLabelText('年')
    await user.clear(yearsInput)
    await user.type(yearsInput, '30')

    expect(screen.getByText('15,000,000円')).toBeInTheDocument()
    expect(screen.getByText('800万円 + 70万円 ×（30年 − 20年）')).toBeInTheDocument()
  })

  it('不正な入力ではエラーメッセージを表示し、結果は表示しない', async () => {
    const user = userEvent.setup()
    render(<ControlledSimulator initialYears={10} initialMonths={0} />)

    const monthsInput = screen.getByLabelText('か月')
    await user.clear(monthsInput)
    await user.type(monthsInput, '15')

    expect(screen.getByRole('alert')).toHaveTextContent('月数は0〜11の範囲で入力してください。')
    expect(
      screen.getByText('加入期間を入力すると、ここに退職所得控除額の目安が表示されます。'),
    ).toBeInTheDocument()
  })
})
