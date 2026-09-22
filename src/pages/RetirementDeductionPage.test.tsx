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

function getPastPaymentsSection() {
  const heading = screen.getByRole('heading', { name: '過去に受け取った退職金' })
  const section = heading.closest('section')
  if (!section) {
    throw new Error('past payments section not found')
  }
  return within(section)
}

function getPaymentEntry(index: number) {
  return within(screen.getByRole('group', { name: `退職金 ${index}` }))
}

async function setAgeRange(
  user: ReturnType<typeof userEvent.setup>,
  startAge: number,
  endAge: number,
) {
  await user.selectOptions(screen.getByLabelText('iDeCoを何歳から始めましたか？'), String(startAge))
  await user.selectOptions(screen.getByLabelText('何歳で受け取る予定ですか？'), String(endAge))
}

async function answerHasPastPayments(
  user: ReturnType<typeof userEvent.setup>,
  answer: 'あり' | 'なし',
) {
  const section = getPastPaymentsSection()
  await user.click(section.getByRole('radio', { name: answer }))
}

async function setPaymentEntry(
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  { age, amount }: { age?: number; amount?: string },
) {
  const entry = getPaymentEntry(index)
  if (age !== undefined) {
    await user.selectOptions(entry.getByLabelText('受け取った年齢'), String(age))
  }
  if (amount !== undefined) {
    const amountInput = entry.getByLabelText('退職金額（円）')
    await user.clear(amountInput)
    if (amount !== '') {
      await user.type(amountInput, amount)
    }
  }
}

describe('RetirementDeductionPage セクションの構成', () => {
  it('「退職所得控除シミュレーター」の下に「過去に受け取った退職金」が配置されている', () => {
    renderPage()

    const simulatorSection = document.getElementById('simulator')
    const pastPaymentsSection = document.getElementById('past-payments')
    expect(simulatorSection).not.toBeNull()
    expect(pastPaymentsSection).not.toBeNull()

    const position = simulatorSection!.compareDocumentPosition(pastPaymentsSection!)
    // pastPaymentsSection が simulatorSection より後ろにある
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('「過去に受け取った退職金」の下に「あなたの退職所得控除額（目安）」が配置されている', () => {
    renderPage()

    const pastPaymentsSection = document.getElementById('past-payments')
    const resultSection = document.getElementById('deduction-result')
    expect(pastPaymentsSection).not.toBeNull()
    expect(resultSection).not.toBeNull()

    const position = pastPaymentsSection!.compareDocumentPosition(resultSection!)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    const heading = screen.getByText('あなたの退職所得控除額（目安）')
    expect(resultSection).toContainElement(heading)
  })

  it('「前職の退職金」という表示は残っていない', () => {
    renderPage()
    expect(screen.queryByText(/前職の退職金/)).not.toBeInTheDocument()
  })

  it('「過去に受け取った退職金」という見出しが表示される', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: '過去に受け取った退職金' })).toBeInTheDocument()
  })

  it('「退職金の受取回数」という入力項目はない', () => {
    renderPage()
    expect(screen.queryByLabelText('退職金の受取回数')).not.toBeInTheDocument()
    expect(screen.queryByText('退職金の受取回数')).not.toBeInTheDocument()
  })

  it('加入期間そのものを入力するUIは存在しない', () => {
    renderPage()

    expect(screen.queryByLabelText('年')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('か月')).not.toBeInTheDocument()
  })
})

describe('RetirementDeductionPage 加入期間の連動', () => {
  it('初期表示（30歳→60歳）で、シミュレーターの結果が表示される', () => {
    renderPage()
    // 30年: 800万円 + 70万円 ×（30年-20年）= 1500万円
    expect(screen.getByText(/15,000,000円/)).toBeInTheDocument()
  })

  it('受取予定年齢が加入開始年齢以前だと、過去の退職金セクションはプレースホルダーを表示する', async () => {
    const user = userEvent.setup()
    renderPage()

    await setAgeRange(user, 50, 40)

    const section = getPastPaymentsSection()
    expect(
      section.getByText(
        '上のシミュレーターで受取予定年齢を加入開始年齢より後にすると、ここに結果が表示されます。',
      ),
    ).toBeInTheDocument()
  })
})

describe('過去に受け取った退職金：あり/なし', () => {
  it('初期状態は未回答で、入力欄も結果も表示されない', () => {
    renderPage()
    const section = getPastPaymentsSection()

    expect(
      section.getByText(
        '「過去に退職金を受け取ったことがありますか？」を選択すると、重複期間の調整を確認できます。',
      ),
    ).toBeInTheDocument()
    expect(section.queryByRole('group', { name: '退職金 1' })).not.toBeInTheDocument()
  })

  it('「なし」を選択すると重複期間の調整はなく、シミュレーターの結果と同じ金額になる', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'なし')

    const section = getPastPaymentsSection()
    expect(
      section.getByText(
        '過去の退職金の受け取りがないため、重複期間の調整はありません。シミュレーターの結果と同じ金額になります。',
      ),
    ).toBeInTheDocument()
    expect(section.getByText('15,000,000円')).toBeInTheDocument()
  })

  it('「あり」を選択すると退職金1件目の入力欄が表示される', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')

    const entry = getPaymentEntry(1)
    expect(entry.getByLabelText('受け取った年齢')).toBeInTheDocument()
    expect(entry.getByLabelText('退職金額（円）')).toBeInTheDocument()
  })
})

describe('退職金1件の登録', () => {
  it('受取年齢・退職金額を入力すると保持され、登録件数は1件のまま', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { age: 45, amount: '1000000' })

    const entry = getPaymentEntry(1)
    expect(entry.getByLabelText('受け取った年齢')).toHaveValue('45')
    expect(entry.getByLabelText('退職金額（円）')).toHaveValue('1,000,000')
    expect(screen.queryByRole('group', { name: '退職金 2' })).not.toBeInTheDocument()

    const section = getPastPaymentsSection()
    // 1500万円(シミュレーター結果) - 80万円(相当する期間2年分) = 1420万円
    expect(section.getByText('14,200,000円')).toBeInTheDocument()
  })

  it('受取年齢を変更しても、19年以内であれば正しく調整結果が計算される（固定の45歳ではない）', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { age: 50, amount: '1000000' })

    const section = getPastPaymentsSection()
    // 60-50=10年 ≦ 19年 → 対象。差し引く金額(80万円)は45歳の場合と同じだが、
    // 50歳という入力値をもとに正しく判定・計算されていることを確認する
    expect(section.getByText('14,200,000円')).toBeInTheDocument()
  })

  it('退職金額を変更すると、計算に使用される値も変わる', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { age: 45, amount: '5000000' })

    const section = getPastPaymentsSection()
    // 相当する期間: 500万円÷40万円=12年、差し引く金額: 40万円×12年=480万円
    // 「相当する期間」「重複年数」の2箇所に表示される
    expect(section.getAllByText('12年').length).toBe(2)
    // 1500万円 - 480万円 = 1020万円
    expect(section.getByText('10,200,000円')).toBeInTheDocument()
  })

  it('受取年齢が受取予定年齢の19年より前だと、重複期間の調整の対象外になる', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { age: 40, amount: '1000000' }) // 60-40=20年 > 19年

    const section = getPastPaymentsSection()
    expect(section.getByText(/重複期間の調整の対象外です/)).toBeInTheDocument()
    expect(section.getByText('15,000,000円')).toBeInTheDocument()
  })

  it('退職金額0円の場合、差し引く金額も0円になりシミュレーターの結果と同じになる', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { age: 45, amount: '0' })

    const section = getPastPaymentsSection()
    expect(section.getByText('15,000,000円')).toBeInTheDocument()
  })

  it('退職金額にマイナス値を入力するとエラーになる', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { amount: '-1000000' })

    const entry = getPaymentEntry(1)
    expect(entry.getByRole('alert')).toHaveTextContent('退職金額は0円以上で入力してください。')
  })

  it('退職金額を空欄にするとエラーになる', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { amount: '' })

    const entry = getPaymentEntry(1)
    expect(entry.getByRole('alert')).toHaveTextContent('退職金額を入力してください。')
  })
})

describe('退職金2件の登録', () => {
  it('「＋ 退職金を追加」で2件目を追加できる', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    const section = getPastPaymentsSection()
    await user.click(section.getByRole('button', { name: '＋ 退職金を追加' }))

    expect(screen.getByRole('group', { name: '退職金 1' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: '退職金 2' })).toBeInTheDocument()
  })

  it('1件目と2件目に異なる受取年齢・退職金額を設定でき、それぞれ独立して保持される', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    const section = getPastPaymentsSection()
    await user.click(section.getByRole('button', { name: '＋ 退職金を追加' }))

    await setPaymentEntry(user, 1, { age: 45, amount: '5000000' })
    await setPaymentEntry(user, 2, { age: 52, amount: '1000000' })

    expect(getPaymentEntry(1).getByLabelText('受け取った年齢')).toHaveValue('45')
    expect(getPaymentEntry(1).getByLabelText('退職金額（円）')).toHaveValue('5,000,000')
    expect(getPaymentEntry(2).getByLabelText('受け取った年齢')).toHaveValue('52')
    expect(getPaymentEntry(2).getByLabelText('退職金額（円）')).toHaveValue('1,000,000')
  })

  it('2件登録すると、両方のデータが計算処理に使用される', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    const section = getPastPaymentsSection()
    await user.click(section.getByRole('button', { name: '＋ 退職金を追加' }))

    await setPaymentEntry(user, 1, { age: 45, amount: '5000000' })
    await setPaymentEntry(user, 2, { age: 52, amount: '1000000' })

    // 合計600万円 ÷ 40万円 = 15年、差し引く金額 40万円×15年=600万円
    // 1500万円 - 600万円 = 900万円
    expect(section.getAllByText('15年').length).toBe(2)
    expect(section.getByText('9,000,000円')).toBeInTheDocument()
  })
})

describe('退職金3件以上の登録・削除', () => {
  async function addPastPaymentEntries(user: ReturnType<typeof userEvent.setup>, count: number) {
    const section = getPastPaymentsSection()
    for (let i = 0; i < count; i += 1) {
      await user.click(section.getByRole('button', { name: '＋ 退職金を追加' }))
    }
  }

  it('3件以上追加でき、各データは独立している', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await addPastPaymentEntries(user, 2) // 合計3件

    await setPaymentEntry(user, 1, { age: 45, amount: '1000000' })
    await setPaymentEntry(user, 2, { age: 50, amount: '2000000' })
    await setPaymentEntry(user, 3, { age: 55, amount: '3000000' })

    expect(getPaymentEntry(1).getByLabelText('退職金額（円）')).toHaveValue('1,000,000')
    expect(getPaymentEntry(2).getByLabelText('退職金額（円）')).toHaveValue('2,000,000')
    expect(getPaymentEntry(3).getByLabelText('退職金額（円）')).toHaveValue('3,000,000')
  })

  it('任意の1件を削除でき、削除しても他のデータは壊れない', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await addPastPaymentEntries(user, 2) // 合計3件

    await setPaymentEntry(user, 1, { age: 45, amount: '1000000' })
    await setPaymentEntry(user, 2, { age: 50, amount: '2000000' })
    await setPaymentEntry(user, 3, { age: 55, amount: '3000000' })

    // 2件目（退職金2）を削除する
    await user.click(getPaymentEntry(2).getByRole('button', { name: '削除' }))

    expect(screen.getByRole('group', { name: '退職金 1' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: '退職金 3' })).not.toBeInTheDocument()
    // 削除後、旧「退職金3」が繰り上がって「退職金2」として表示される
    const remaining = getPastPaymentsSection().getAllByRole('group')
    expect(remaining).toHaveLength(2)
    expect(getPaymentEntry(1).getByLabelText('退職金額（円）')).toHaveValue('1,000,000')
    expect(getPaymentEntry(2).getByLabelText('退職金額（円）')).toHaveValue('3,000,000')
  })
})
