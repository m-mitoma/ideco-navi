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

function getDeductionResultSection() {
  const section = document.getElementById('deduction-result')
  if (!section) {
    throw new Error('deduction-result section not found')
  }
  return within(section)
}

function getTaxableIncomeSection() {
  const section = document.getElementById('taxable-income')
  if (!section) {
    throw new Error('taxable-income section not found')
  }
  return within(section)
}

function getPaymentEntry(index: number) {
  return within(screen.getByRole('group', { name: `退職金 ${index}` }))
}

async function setIdecoLumpSumAmount(user: ReturnType<typeof userEvent.setup>, amount: string) {
  const input = getTaxableIncomeSection().getByLabelText('iDeCo一時金の受取額（円）')
  await user.clear(input)
  if (amount !== '') {
    await user.type(input, amount)
  }
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
  { age, amount, serviceYears }: { age?: number; amount?: string; serviceYears?: number },
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
  if (serviceYears !== undefined) {
    await user.selectOptions(entry.getByLabelText('対応する勤続期間（年）'), String(serviceYears))
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

  it('「あなたの退職所得控除額（目安）」の下に「退職所得控除を使い切った場合は？」が配置されている', () => {
    renderPage()

    const resultSection = document.getElementById('deduction-result')
    const exhaustedSection = document.getElementById('deduction-exhausted')
    expect(exhaustedSection).not.toBeNull()

    const position = resultSection!.compareDocumentPosition(exhaustedSection!)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
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

describe('過去に退職金を受け取ったことがありますか：あり/なし', () => {
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

  it('未回答の間は「あなたの退職所得控除額（目安）」に基本の控除額が表示される（未回答＝過去の退職金なし扱い）', () => {
    renderPage()
    const resultSection = getDeductionResultSection()
    expect(resultSection.getByText('15,000,000円')).toBeInTheDocument()
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

    const resultSection = getDeductionResultSection()
    expect(resultSection.getByText('15,000,000円')).toBeInTheDocument()
  })

  it('「あり」を選択すると退職金1件目の入力欄（年齢・金額・勤続期間）が表示される', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')

    const entry = getPaymentEntry(1)
    expect(entry.getByLabelText('受け取った年齢')).toBeInTheDocument()
    expect(entry.getByLabelText('退職金額（円）')).toBeInTheDocument()
    expect(entry.getByLabelText('対応する勤続期間（年）')).toBeInTheDocument()
  })
})

describe('あなたの退職所得控除額（目安）に調整後の金額が反映される（重要なバグ修正の確認）', () => {
  it('過去の退職金が重複期間の調整対象になる場合、「あなたの退職所得控除額（目安）」は基本額ではなく調整後の額を表示する', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    // 45歳受給、勤続10年、500万円。500万円は10年の通常控除(400万円)を上回るため実際の勤続期間がそのまま使われる。
    // 勤続期間35〜45歳はiDeCo加入期間30〜60歳に完全に含まれるため重複10年、差し引く金額400万円。
    // 1500万円(基本) - 400万円 = 1100万円
    await setPaymentEntry(user, 1, { age: 45, amount: '5000000', serviceYears: 10 })

    const resultSection = getDeductionResultSection()
    expect(resultSection.getByText('11,000,000円')).toBeInTheDocument()
    // 調整前の基本額（1500万円）がそのまま表示されたままになっていないことを確認する
    expect(resultSection.queryByText('15,000,000円')).not.toBeInTheDocument()
  })

  it('受取額がその勤続期間の通常控除額を下回る場合、金額から逆算した期間（表2の特例）で重複が計算され、結果に反映される', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    // 45歳受給、勤続30年、200万円。30年の通常控除(1500万円)を大きく下回るため、
    // みなし期間 = 200万円÷40万円 = 5年（40〜45歳）に短縮される。
    // 40〜45歳はiDeCo加入期間30〜60歳に完全に含まれるため重複5年、差し引く金額200万円。
    // 1500万円 - 200万円 = 1300万円
    await setPaymentEntry(user, 1, { age: 45, amount: '2000000', serviceYears: 30 })

    const resultSection = getDeductionResultSection()
    expect(resultSection.getByText('13,000,000円')).toBeInTheDocument()
  })

  it('過去の退職金の勤続期間がiDeCoの加入期間と重複しない場合、調整は行われず基本額のままになる', async () => {
    const user = userEvent.setup()
    renderPage()

    await setAgeRange(user, 40, 45)
    await answerHasPastPayments(user, 'あり')
    // 35歳受給、勤続5年（30〜35歳）。iDeCo加入期間(40〜45歳)より前のため重複なし。
    await setPaymentEntry(user, 1, { age: 35, amount: '3000000', serviceYears: 5 })

    const resultSection = getDeductionResultSection()
    // 加入期間5年の基本控除: 40万円×5年=200万円
    expect(resultSection.getByText('2,000,000円')).toBeInTheDocument()
  })

  it('「あり」から「なし」に切り替えると、結果が基本額に戻る', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { age: 45, amount: '5000000', serviceYears: 10 })
    expect(getDeductionResultSection().getByText('11,000,000円')).toBeInTheDocument()

    await answerHasPastPayments(user, 'なし')
    expect(getDeductionResultSection().getByText('15,000,000円')).toBeInTheDocument()
  })

  it('入力エラーがある間は、「あなたの退職所得控除額（目安）」に案内が表示され、古い金額は表示されない', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { age: 45, amount: '', serviceYears: 10 })

    const resultSection = getDeductionResultSection()
    expect(
      resultSection.getByText(
        '「過去に受け取った退職金」の入力内容をご確認ください。エラーが解消されると、ここに退職所得控除額の目安が表示されます。',
      ),
    ).toBeInTheDocument()
  })
})

describe('受取順序（ケースA・ケースB）', () => {
  it('ケースA：過去の退職金がiDeCoより前で前年以前19年内の場合、今回のiDeCoの控除額が調整される', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { age: 45, amount: '5000000', serviceYears: 10 })

    const section = getPastPaymentsSection()
    expect(section.getByText(/前年以前19年内/)).toBeInTheDocument()
    expect(getDeductionResultSection().getByText('11,000,000円')).toBeInTheDocument()
  })

  it('ケースB：iDeCoの後、前年以前9年内に退職金を受け取る場合は、今回のiDeCoの控除額には影響しない案内が表示される', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    // iDeCo受取予定は60歳。65歳（60+5年）に退職金を受け取る想定 → ケースB・9年内
    await setPaymentEntry(user, 1, { age: 65, amount: '5000000', serviceYears: 10 })

    const section = getPastPaymentsSection()
    expect(section.getByText(/今回のiDeCoの控除額には影響しません/)).toBeInTheDocument()

    // 今回のiDeCoの控除額（基本額のまま）に影響しないことを確認する
    expect(getDeductionResultSection().getByText('15,000,000円')).toBeInTheDocument()
  })

  it('ケースA・ケースBのどちらでも、同じ計算式を機械的に適用しない（結果が異なる）', async () => {
    const user = userEvent.setup()

    const { unmount } = renderPage()
    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { age: 45, amount: '5000000', serviceYears: 10 })
    const caseAResult = getDeductionResultSection().getByText(/円/, { selector: '.result-value' })
      .textContent
    unmount()

    renderPage()
    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { age: 65, amount: '5000000', serviceYears: 10 })
    const caseBResult = getDeductionResultSection().getByText(/円/, { selector: '.result-value' })
      .textContent

    expect(caseAResult).not.toBe(caseBResult)
  })
})

describe('退職所得控除を使い切った場合の説明（年金受取の案内）', () => {
  it('「退職所得控除を使い切った場合は？」の見出しと、年金・一時金の組み合わせの案内が表示される', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: '退職所得控除を使い切った場合は？' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/年金として受け取る方法や、一時金と年金を組み合わせる方法/)).toBeInTheDocument()
  })

  it('「年金なら税金が0円になる」「非課税になる」など、誤解を招く表現は含まれない', () => {
    renderPage()
    const bodyText = document.body.textContent ?? ''
    expect(bodyText).not.toMatch(/税金が0円/)
    expect(bodyText).not.toMatch(/非課税になる/)
    expect(bodyText).not.toMatch(/年金にすれば.*得/)
  })

  it('年金で受け取る場合の具体的な税額は計算していないことを明記している', () => {
    renderPage()
    expect(
      screen.getByText(/年金で受け取る場合の具体的な税額計算は行っていません/),
    ).toBeInTheDocument()
  })
})

describe('退職金1件の登録', () => {
  it('受取年齢・退職金額・勤続期間を入力すると保持され、登録件数は1件のまま', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { age: 45, amount: '1000000', serviceYears: 5 })

    const entry = getPaymentEntry(1)
    expect(entry.getByLabelText('受け取った年齢')).toHaveValue('45')
    expect(entry.getByLabelText('退職金額（円）')).toHaveValue('1,000,000')
    expect(entry.getByLabelText('対応する勤続期間（年）')).toHaveValue('5')
    expect(screen.queryByRole('group', { name: '退職金 2' })).not.toBeInTheDocument()
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

  it('勤続期間が受け取った年齢を超えるとエラーになる', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { age: 20, amount: '1000000', serviceYears: 30 })

    const entry = getPaymentEntry(1)
    expect(entry.getByRole('alert')).toHaveTextContent(
      '勤続期間が受け取った年齢を超えています。入力内容をご確認ください。',
    )
  })
})

describe('iDeCo一時金の課税対象額', () => {
  // 4つのテストケース共通のセットアップ：あなたの退職所得控除額（目安）を1420万円にする。
  // 45歳受給・勤続5年（40〜45歳）・100万円。100万円は5年の通常控除(200万円)を下回るため、
  // みなし期間 = 100万円÷40万円 = 2年（43〜45歳）に短縮される。
  // 43〜45歳はiDeCo加入期間30〜60歳に完全に含まれるため重複2年、差し引く金額80万円。
  // 1500万円(基本) − 80万円 = 1420万円
  async function setUpDeductionOf14_200_000(user: ReturnType<typeof userEvent.setup>) {
    await answerHasPastPayments(user, 'あり')
    await setPaymentEntry(user, 1, { age: 45, amount: '1000000', serviceYears: 5 })
    expect(getDeductionResultSection().getByText('14,200,000円')).toBeInTheDocument()
  }

  it('見出しと説明文が「あなたの退職所得控除額（目安）」の下に表示される', () => {
    renderPage()

    const resultSection = document.getElementById('deduction-result')
    const taxableSection = document.getElementById('taxable-income')
    expect(taxableSection).not.toBeNull()
    const position = resultSection!.compareDocumentPosition(taxableSection!)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    expect(screen.getByRole('heading', { name: 'iDeCo一時金の課税対象額' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'iDeCoを一時金で受け取る場合、受取額から退職所得控除額を差し引き、 残額の1/2が課税退職所得金額の計算対象となります。',
      ),
    ).toBeInTheDocument()
  })

  it('受取額が空欄の間は、入力を促す案内が表示され、計算結果は表示されない', () => {
    renderPage()

    const section = getTaxableIncomeSection()
    expect(section.getByRole('alert')).toHaveTextContent(
      'iDeCo一時金の受取額を入力してください。',
    )
    expect(section.queryByText('課税退職所得金額')).not.toBeInTheDocument()
  })

  it('ケース1: 一時金1,500万円・控除1,420万円 → 残額80万円・課税退職所得金額40万円', async () => {
    const user = userEvent.setup()
    renderPage()

    await setUpDeductionOf14_200_000(user)
    await setIdecoLumpSumAmount(user, '15000000')

    const section = getTaxableIncomeSection()
    expect(section.getByText('15,000,000円')).toBeInTheDocument()
    expect(section.getByText('14,200,000円')).toBeInTheDocument()
    expect(section.getByText('800,000円')).toBeInTheDocument()
    expect(section.getByText('400,000円')).toBeInTheDocument()
  })

  it('ケース2: 一時金1,000万円・控除1,420万円（下回る） → 残額0円・課税退職所得金額0円', async () => {
    const user = userEvent.setup()
    renderPage()

    await setUpDeductionOf14_200_000(user)
    await setIdecoLumpSumAmount(user, '10000000')

    const section = getTaxableIncomeSection()
    // 「控除後の残額」「課税退職所得金額」の2箇所に0円が表示される
    expect(section.getAllByText('0円').length).toBe(2)
    expect(section.queryByText(/-/)).not.toBeInTheDocument()
  })

  it('ケース3: 一時金1,420万円・控除1,420万円（ちょうど同額） → 残額0円・課税退職所得金額0円', async () => {
    const user = userEvent.setup()
    renderPage()

    await setUpDeductionOf14_200_000(user)
    await setIdecoLumpSumAmount(user, '14200000')

    const section = getTaxableIncomeSection()
    expect(section.getAllByText('0円').length).toBe(2)
  })

  it('ケース4: 一時金2,000万円・控除1,420万円 → 残額580万円・課税退職所得金額290万円', async () => {
    const user = userEvent.setup()
    renderPage()

    await setUpDeductionOf14_200_000(user)
    await setIdecoLumpSumAmount(user, '20000000')

    const section = getTaxableIncomeSection()
    expect(section.getByText('5,800,000円')).toBeInTheDocument()
    expect(section.getByText('2,900,000円')).toBeInTheDocument()
  })

  it('「税金が0円」「非課税」など、税額そのものについての表現は含まれない', async () => {
    const user = userEvent.setup()
    renderPage()

    await setUpDeductionOf14_200_000(user)
    await setIdecoLumpSumAmount(user, '10000000')

    const bodyText = document.body.textContent ?? ''
    expect(bodyText).not.toMatch(/税金が0円/)
    expect(bodyText).not.toMatch(/非課税/)
  })

  it('退職所得控除額（finalDeductionAmount）が変わると、課税退職所得金額も自動的に再計算される', async () => {
    const user = userEvent.setup()
    renderPage()

    await setUpDeductionOf14_200_000(user)
    await setIdecoLumpSumAmount(user, '15000000')
    expect(getTaxableIncomeSection().getByText('400,000円')).toBeInTheDocument()

    // 過去の退職金を「なし」に変更すると、控除額は基本額の1500万円に戻る
    await answerHasPastPayments(user, 'なし')

    const section = getTaxableIncomeSection()
    // 1500万円(一時金) − 1500万円(控除) = 残額0円、課税退職所得金額0円
    expect(section.getAllByText('0円').length).toBe(2)
  })

  it('iDeCo一時金の受取額にマイナス値を入力するとエラーになる', async () => {
    const user = userEvent.setup()
    renderPage()

    await setUpDeductionOf14_200_000(user)
    await setIdecoLumpSumAmount(user, '-1000000')

    expect(getTaxableIncomeSection().getByRole('alert')).toHaveTextContent(
      'iDeCo一時金の受取額は0円以上で入力してください。',
    )
  })

  it('入力値はカンマ区切りで表示される', async () => {
    const user = userEvent.setup()
    renderPage()

    await setUpDeductionOf14_200_000(user)
    await setIdecoLumpSumAmount(user, '15000000')

    expect(
      getTaxableIncomeSection().getByLabelText('iDeCo一時金の受取額（円）'),
    ).toHaveValue('15,000,000')
  })
})

describe('退職金2件以上の登録・削除', () => {
  it('「＋ 退職金を追加」で2件目を追加でき、それぞれ独立して保持される', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    const section = getPastPaymentsSection()
    await user.click(section.getByRole('button', { name: '＋ 退職金を追加' }))

    await setPaymentEntry(user, 1, { age: 45, amount: '5000000', serviceYears: 10 })
    await setPaymentEntry(user, 2, { age: 52, amount: '1000000', serviceYears: 5 })

    expect(getPaymentEntry(1).getByLabelText('受け取った年齢')).toHaveValue('45')
    expect(getPaymentEntry(2).getByLabelText('受け取った年齢')).toHaveValue('52')
  })

  it('任意の1件を削除でき、削除しても他のデータは壊れない', async () => {
    const user = userEvent.setup()
    renderPage()

    await answerHasPastPayments(user, 'あり')
    const section = getPastPaymentsSection()
    await user.click(section.getByRole('button', { name: '＋ 退職金を追加' }))
    await user.click(section.getByRole('button', { name: '＋ 退職金を追加' }))

    await setPaymentEntry(user, 1, { age: 45, amount: '1000000', serviceYears: 5 })
    await setPaymentEntry(user, 2, { age: 50, amount: '2000000', serviceYears: 5 })
    await setPaymentEntry(user, 3, { age: 55, amount: '3000000', serviceYears: 5 })

    await user.click(getPaymentEntry(2).getByRole('button', { name: '削除' }))

    expect(screen.getByRole('group', { name: '退職金 1' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: '退職金 3' })).not.toBeInTheDocument()
    const remaining = getPastPaymentsSection().getAllByRole('group')
    expect(remaining).toHaveLength(2)
    expect(getPaymentEntry(1).getByLabelText('退職金額（円）')).toHaveValue('1,000,000')
    expect(getPaymentEntry(2).getByLabelText('退職金額（円）')).toHaveValue('3,000,000')
  })
})
