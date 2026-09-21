import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import RetirementDeductionPage from './RetirementDeductionPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <RetirementDeductionPage />
    </MemoryRouter>,
  )
}

function getExampleCard() {
  const heading = screen.getByRole('heading', {
    name: '計算例②：転職して前職の退職金を受け取っている場合',
  })
  const section = heading.closest('section')
  if (!section) {
    throw new Error('event section not found')
  }
  return within(section)
}

async function setPeriod(user: ReturnType<typeof userEvent.setup>, years: number, months: number) {
  const yearsInput = screen.getByLabelText('年')
  const monthsInput = screen.getByLabelText('か月')
  await user.clear(yearsInput)
  await user.type(yearsInput, String(years))
  await user.clear(monthsInput)
  await user.type(monthsInput, String(months))
}

describe('RetirementDeductionPage 計算例②の事例連動', () => {
  it('初期表示（20年6か月）で、シミュレーターと事例の両方に結果が表示される', () => {
    renderPage()
    const example = getExampleCard()

    // 21年扱い（20年6か月→切り上げ）: 800万円 + 70万円 ×（21年-20年）= 870万円
    expect(example.getByText('20年6か月')).toBeInTheDocument()
    expect(example.getByText('21年')).toBeInTheDocument()
    expect(example.getByText(/8,700,000円/)).toBeInTheDocument()
    // 固定値（前職の退職金100万円・相当する期間2年）
    expect(example.getByText('100万円')).toBeInTheDocument()
    expect(example.getAllByText('2年').length).toBeGreaterThan(0)
  })

  const periodCases = [
    { years: 10, months: 0, deductionYears: 10, deductionAmount: 4_000_000, adjusted: 3_200_000 },
    { years: 20, months: 0, deductionYears: 20, deductionAmount: 8_000_000, adjusted: 7_200_000 },
    { years: 30, months: 0, deductionYears: 30, deductionAmount: 15_000_000, adjusted: 14_200_000 },
  ].map((testCase) => ({ ...testCase, label: `${testCase.years}年${testCase.months}か月` }))

  it.each(periodCases)(
    '加入期間を$label に変更すると、事例側の結果も連動して更新される',
    async ({ years, months, deductionYears, deductionAmount, adjusted }) => {
      const user = userEvent.setup()
      renderPage()

      await setPeriod(user, years, months)

      const example = getExampleCard()

      expect(example.getByText(`${years}年${months}か月`)).toBeInTheDocument()
      expect(example.getByText(`${deductionYears}年`)).toBeInTheDocument()
      expect(
        example.getByText(`${deductionAmount.toLocaleString()}円（`, { exact: false }),
      ).toBeInTheDocument()
      expect(example.getByText(`${adjusted.toLocaleString()}円`)).toBeInTheDocument()

      // 前職の退職金額から導かれる固定値は加入期間を変えても変化しない
      expect(example.getByText('100万円')).toBeInTheDocument()
      expect(example.getAllByText('2年').length).toBeGreaterThan(0)
    },
  )

  it('無効な加入期間を入力すると、事例側はプレースホルダーを表示する', async () => {
    const user = userEvent.setup()
    renderPage()

    const monthsInput = screen.getByLabelText('か月')
    await user.clear(monthsInput)
    await user.type(monthsInput, '15')

    const example = getExampleCard()
    expect(
      example.getByText(
        '上のシミュレーターに有効な加入期間を入力すると、この事例の計算結果が表示されます。',
      ),
    ).toBeInTheDocument()
  })
})
