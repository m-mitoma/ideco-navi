import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import RetirementDeductionSimulator from './RetirementDeductionSimulator'

// startAge/endAgeは親コンポーネントが保持する制御コンポーネントのため、
// テストでも実際の使われ方に合わせてstateを持つラッパーで描画する。
function ControlledSimulator({ initialStartAge = 30, initialEndAge = 60 }) {
  const [startAge, setStartAge] = useState(initialStartAge)
  const [endAge, setEndAge] = useState(initialEndAge)
  return (
    <RetirementDeductionSimulator
      startAge={startAge}
      endAge={endAge}
      onStartAgeChange={setStartAge}
      onEndAgeChange={setEndAge}
    />
  )
}

describe('RetirementDeductionSimulator', () => {
  it('初期値の年齢から加入期間を自動計算して表示する', () => {
    render(<ControlledSimulator initialStartAge={30} initialEndAge={60} />)

    expect(screen.getByText('30年')).toBeInTheDocument()
  })

  it('加入期間そのものを入力するUIは存在しない', () => {
    render(<ControlledSimulator />)

    expect(screen.queryByLabelText('年')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('か月')).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  it('結果表示（あなたの退職所得控除額）はこのコンポーネントには含まれない', () => {
    render(<ControlledSimulator />)

    expect(screen.queryByText('あなたの退職所得控除額（目安）')).not.toBeInTheDocument()
  })

  it('加入開始年齢を変更すると加入期間が更新される', async () => {
    const user = userEvent.setup()
    render(<ControlledSimulator initialStartAge={30} initialEndAge={60} />)

    await user.selectOptions(screen.getByLabelText('iDeCoを何歳から始めましたか？'), '40')

    expect(screen.getByText('20年')).toBeInTheDocument()
  })

  it('受取予定年齢を変更すると加入期間が更新される', async () => {
    const user = userEvent.setup()
    render(<ControlledSimulator initialStartAge={40} initialEndAge={60} />)

    await user.selectOptions(screen.getByLabelText('何歳で受け取る予定ですか？'), '65')

    expect(screen.getByText('25年')).toBeInTheDocument()
  })

  it('加入開始年齢と受取予定年齢が同じ場合はエラーを表示し、加入期間は表示しない', async () => {
    const user = userEvent.setup()
    render(<ControlledSimulator initialStartAge={30} initialEndAge={60} />)

    await user.selectOptions(screen.getByLabelText('何歳で受け取る予定ですか？'), '30')

    expect(screen.getByRole('alert')).toHaveTextContent(
      '受取予定年齢は、加入開始年齢より後の年齢を選択してください。',
    )
    // エラー時は「加入期間」の自動計算結果を表示しない
    expect(screen.queryByText(/^\d+年$/)).not.toBeInTheDocument()
  })

  it('受取予定年齢が加入開始年齢より前の場合もエラーを表示する', async () => {
    const user = userEvent.setup()
    render(<ControlledSimulator initialStartAge={40} initialEndAge={60} />)

    await user.selectOptions(screen.getByLabelText('何歳で受け取る予定ですか？'), '35')

    expect(screen.getByRole('alert')).toHaveTextContent(
      '受取予定年齢は、加入開始年齢より後の年齢を選択してください。',
    )
  })
})
