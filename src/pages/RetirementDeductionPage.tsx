import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ArticleSection from '../components/sections/ArticleSection'
import RetirementDeductionSimulator from '../components/sections/RetirementDeductionSimulator'
import NoticeBox from '../components/common/NoticeBox'
import SourceList from '../components/common/SourceList'
import Card from '../components/common/Card'
import SectionHeading from '../components/common/SectionHeading'
import Button from '../components/common/Button'
import type { PastPayment } from '../utils/calculateRetirementDeduction'
import {
  calculateEnrollmentYears,
  calculateOverlapAdjustment,
  calculateRetirementDeduction,
  calculateTaxableRetirementIncome,
  formatManYen,
  validateAgeRangeInput,
  validateIdecoLumpSumAmountInput,
  validatePastPaymentAgeInput,
  validatePastPaymentAmountInput,
  validatePastPaymentServiceYearsInput,
} from '../utils/calculateRetirementDeduction'
import {
  formatIntegerInputWithCommas,
  MAX_IDECO_AGE_EXCLUSIVE,
  MIN_IDECO_AGE,
  parseIntegerInput,
  stripCommas,
} from '../utils/simulateContribution'
import './RetirementDeductionPage.css'

// iDeCoの加入可能年齢（このページの加入期間入力と同じ範囲）の中から選択させる。
const AGE_OPTIONS = Array.from(
  { length: MAX_IDECO_AGE_EXCLUSIVE - MIN_IDECO_AGE },
  (_, index) => MIN_IDECO_AGE + index,
)

// 過去の退職金に対応する勤続期間の選択肢（1〜60年）。
const SERVICE_YEARS_OPTIONS = Array.from({ length: 60 }, (_, index) => index + 1)

const sources = [
  {
    name: '国税庁「No.1420 退職金を受け取ったとき（退職所得）」',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1420.htm',
  },
  {
    name: '東京国税局「前の退職手当等が同一年に複数ある場合の退職所得控除額の計算の特例について」',
    url: 'https://www.nta.go.jp/about/organization/tokyo/bunshokaito/gensenshotoku/240322/01.htm',
  },
  {
    name: 'iDeCo公式サイト（国民年金基金連合会）「よくあるご質問」',
    url: 'https://www.ideco-koushiki.jp/faq/',
  },
  {
    name: '厚生労働省「退職所得控除の調整規定」',
    url: 'https://www.mhlw.go.jp/content/10600000/001328797.pdf',
  },
]

// 画面上で1件ずつ登録する、過去に受け取った退職金の入力用の型。
// 金額は入力途中の空文字を許容するため文字列で保持し（0への強制変換をしない）、
// 数値への変換は計算に使うタイミングでのみ行う。
interface PastPaymentEntry {
  id: string
  age: number
  amountInput: string
  serviceYears: number
}

let pastPaymentIdCounter = 0
function createPastPaymentEntry(): PastPaymentEntry {
  pastPaymentIdCounter += 1
  return { id: `past-payment-${pastPaymentIdCounter}`, age: 45, amountInput: '', serviceYears: 10 }
}

function RetirementDeductionPage() {
  // シミュレーター本体と「過去に受け取った退職金」で共有する加入開始年齢・受取予定年齢。
  // ここで一元管理することで、両者のstateが別々になって計算がずれる、という事態を避けている。
  // 加入期間はユーザーに直接入力させず、この2つの年齢から自動計算する。
  const [startAge, setStartAge] = useState(30)
  const [endAge, setEndAge] = useState(60)

  // 過去に受け取った退職金の入力。「前職」の1件だけを前提にせず、複数件を配列で保持する。
  // 「受取回数」という独立した入力項目は作らず、登録された件数（pastPayments.length）を
  // 受取回数として扱う。初期状態は未回答（null）。
  const [hasPastPayments, setHasPastPayments] = useState<'yes' | 'no' | null>(null)
  const [pastPayments, setPastPayments] = useState<PastPaymentEntry[]>(() => [
    createPastPaymentEntry(),
  ])

  const errorMessage = useMemo(() => validateAgeRangeInput(startAge, endAge), [startAge, endAge])
  const enrollmentYears = useMemo(
    () => calculateEnrollmentYears(startAge, endAge),
    [startAge, endAge],
  )

  // シミュレーター本体と同じ関数・同じ加入期間で計算する、調整前の基本の退職所得控除額。
  const baseResult = useMemo(() => {
    if (errorMessage) {
      return null
    }
    return calculateRetirementDeduction(enrollmentYears, 0)
  }, [enrollmentYears, errorMessage])
  const basicDeductionAmount = baseResult?.deductionAmount ?? null

  function handleAddPastPayment() {
    setPastPayments((prev) => [...prev, createPastPaymentEntry()])
  }

  function handleRemovePastPayment(id: string) {
    setPastPayments((prev) => prev.filter((payment) => payment.id !== id))
  }

  function handlePastPaymentAgeChange(id: string, age: number) {
    setPastPayments((prev) =>
      prev.map((payment) => (payment.id === id ? { ...payment, age } : payment)),
    )
  }

  function handlePastPaymentAmountChange(id: string, amountInput: string) {
    setPastPayments((prev) =>
      prev.map((payment) => (payment.id === id ? { ...payment, amountInput } : payment)),
    )
  }

  function handlePastPaymentServiceYearsChange(id: string, serviceYears: number) {
    setPastPayments((prev) =>
      prev.map((payment) => (payment.id === id ? { ...payment, serviceYears } : payment)),
    )
  }

  const pastPaymentErrors = useMemo(
    () =>
      new Map(
        pastPayments.map((payment) => [
          payment.id,
          validatePastPaymentAmountInput(payment.amountInput) ??
            validatePastPaymentAgeInput(payment.age) ??
            validatePastPaymentServiceYearsInput(String(payment.serviceYears), payment.age),
        ]),
      ),
    [pastPayments],
  )
  const hasPastPaymentError = useMemo(
    () => [...pastPaymentErrors.values()].some((error) => error !== null),
    [pastPaymentErrors],
  )

  const validPastPayments = useMemo<PastPayment[]>(
    () =>
      pastPayments
        .map((payment) => ({
          age: payment.age,
          amount: parseIntegerInput(payment.amountInput),
          serviceYears: payment.serviceYears,
        }))
        .filter((payment): payment is PastPayment => payment.amount !== null),
    [pastPayments],
  )

  // 過去に退職金を受け取った回答が「あり」で、入力エラーがない場合のみ、重複期間の調整を計算する。
  const overlapAdjustment = useMemo(() => {
    if (hasPastPayments !== 'yes' || hasPastPaymentError) {
      return null
    }
    return calculateOverlapAdjustment(validPastPayments, startAge, endAge)
  }, [hasPastPayments, hasPastPaymentError, validPastPayments, startAge, endAge])

  // 調整後の退職所得控除額（目安）。過去の退職金の受け取りがない場合は基本の控除額と同じ額になる。
  // マイナスにはならないよう下限を0円にしている。
  const adjustedDeductionAmount = useMemo(() => {
    if (basicDeductionAmount === null) {
      return null
    }
    if (hasPastPayments === 'no') {
      return basicDeductionAmount
    }
    if (!overlapAdjustment) {
      return null
    }
    return Math.max(0, basicDeductionAmount - overlapAdjustment.overlapDeduction)
  }, [basicDeductionAmount, hasPastPayments, overlapAdjustment])

  // 実際に適用される退職所得控除額（目安）。
  // 「過去に退職金を受け取ったことがありますか？」に「あり」と回答し、入力が正しい場合だけ
  // 調整後の控除額を使う。それ以外（未回答・「なし」）は基本の控除額をそのまま使う。
  // 入力エラーがある間だけは、誤った金額を表示しないようnullにする。
  const finalDeductionAmount = useMemo(() => {
    if (basicDeductionAmount === null) {
      return null
    }
    if (hasPastPayments === 'yes' && hasPastPaymentError) {
      return null
    }
    if (hasPastPayments === 'yes' && adjustedDeductionAmount !== null) {
      return adjustedDeductionAmount
    }
    return basicDeductionAmount
  }, [basicDeductionAmount, hasPastPayments, hasPastPaymentError, adjustedDeductionAmount])

  // iDeCo一時金の課税対象額（課税退職所得金額）の計算に使う入力。
  // 「あなたの退職所得控除額（目安）」（finalDeductionAmount）を控除額としてそのまま使い、
  // 退職所得控除まわりの既存ロジックには一切手を加えない。
  const [idecoLumpSumAmountInput, setIdecoLumpSumAmountInput] = useState('')
  const idecoLumpSumAmountError = useMemo(
    () => validateIdecoLumpSumAmountInput(idecoLumpSumAmountInput),
    [idecoLumpSumAmountInput],
  )
  const idecoLumpSumAmount = useMemo(
    () => parseIntegerInput(idecoLumpSumAmountInput),
    [idecoLumpSumAmountInput],
  )
  const taxableIncomeResult = useMemo(() => {
    if (finalDeductionAmount === null || idecoLumpSumAmountError || idecoLumpSumAmount === null) {
      return null
    }
    return calculateTaxableRetirementIncome(idecoLumpSumAmount, finalDeductionAmount)
  }, [finalDeductionAmount, idecoLumpSumAmountError, idecoLumpSumAmount])

  return (
    <>
      <section className="section rd-intro">
        <div className="container">
          <p className="rd-eyebrow">退職所得控除シミュレーター</p>
          <h1>iDeCoの退職所得控除、いくらになる？</h1>
          <p className="rd-lead">
            iDeCoの老齢一時金を受け取るときは、退職所得控除の対象になります。
            iDeCoを始めた年齢と受け取る予定の年齢を選ぶだけで、控除額の目安を確認できます。
          </p>
        </div>
      </section>

      <RetirementDeductionSimulator
        id="simulator"
        startAge={startAge}
        endAge={endAge}
        onStartAgeChange={setStartAge}
        onEndAgeChange={setEndAge}
      />

      <section id="past-payments" className="section rd-example2-section">
        <div className="container">
          <SectionHeading>過去に受け取った退職金</SectionHeading>
          <p className="rd-example2-intro">
            転職などで過去に退職金を受け取ったことがある場合、iDeCoの退職所得控除には
            「重複期間の調整」という別のルールが関わってきます。該当する退職金を登録すると、
            調整後の退職所得控除額の目安を確認できます。
          </p>

          <Card className="rd-example2-card">
            {baseResult === null ? (
              <p className="result-placeholder">
                上のシミュレーターで受取予定年齢を加入開始年齢より後にすると、ここに結果が表示されます。
              </p>
            ) : (
              <>
                <div className="rd-prior-payment-form">
                  <p className="field-hint">過去に退職金を受け取ったことがありますか？</p>
                  <div
                    className="rd-radio-group"
                    role="radiogroup"
                    aria-label="過去に退職金を受け取ったことがありますか？"
                  >
                    <label>
                      <input
                        type="radio"
                        name="has-past-payments"
                        checked={hasPastPayments === 'no'}
                        onChange={() => setHasPastPayments('no')}
                      />
                      なし
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="has-past-payments"
                        checked={hasPastPayments === 'yes'}
                        onChange={() => setHasPastPayments('yes')}
                      />
                      あり
                    </label>
                  </div>

                  {hasPastPayments === 'yes' && (
                    <div className="rd-past-payments-list">
                      {pastPayments.map((payment, index) => {
                        const entryError = pastPaymentErrors.get(payment.id) ?? null
                        const errorId = `past-payment-error-${payment.id}`
                        return (
                          <fieldset className="rd-past-payment-entry" key={payment.id}>
                            <legend className="rd-past-payment-entry-title">
                              退職金 {index + 1}
                            </legend>
                            <div className="rd-prior-payment-fields">
                              <div className="field">
                                <label htmlFor={`past-payment-age-${payment.id}`}>
                                  受け取った年齢
                                </label>
                                <select
                                  id={`past-payment-age-${payment.id}`}
                                  value={payment.age}
                                  onChange={(event) =>
                                    handlePastPaymentAgeChange(
                                      payment.id,
                                      Number(event.target.value),
                                    )
                                  }
                                  aria-describedby={entryError ? errorId : undefined}
                                >
                                  {AGE_OPTIONS.map((age) => (
                                    <option key={age} value={age}>
                                      {age}歳
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="field">
                                <label htmlFor={`past-payment-amount-${payment.id}`}>
                                  退職金額（円）
                                </label>
                                <input
                                  id={`past-payment-amount-${payment.id}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={formatIntegerInputWithCommas(payment.amountInput)}
                                  onChange={(event) => {
                                    const stripped = stripCommas(event.target.value)
                                    if (/^-?\d*$/.test(stripped)) {
                                      handlePastPaymentAmountChange(payment.id, stripped)
                                    }
                                  }}
                                  aria-describedby={entryError ? errorId : undefined}
                                />
                              </div>
                              <div className="field">
                                <label htmlFor={`past-payment-service-years-${payment.id}`}>
                                  対応する勤続期間（年）
                                </label>
                                <select
                                  id={`past-payment-service-years-${payment.id}`}
                                  value={payment.serviceYears}
                                  onChange={(event) =>
                                    handlePastPaymentServiceYearsChange(
                                      payment.id,
                                      Number(event.target.value),
                                    )
                                  }
                                  aria-describedby={entryError ? errorId : undefined}
                                >
                                  {SERVICE_YEARS_OPTIONS.map((years) => (
                                    <option key={years} value={years}>
                                      {years}年
                                    </option>
                                  ))}
                                </select>
                                <span className="field-hint">
                                  この退職金の支給の元になった、勤務先での勤続年数です。
                                </span>
                              </div>
                            </div>
                            {entryError && (
                              <p id={errorId} className="rd-error" role="alert">
                                入力エラー：{entryError}
                              </p>
                            )}
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleRemovePastPayment(payment.id)}
                            >
                              削除
                            </Button>
                          </fieldset>
                        )
                      })}
                      <Button type="button" variant="secondary" onClick={handleAddPastPayment}>
                        ＋ 退職金を追加
                      </Button>
                    </div>
                  )}
                </div>

                {hasPastPayments === null && (
                  <p className="result-note">
                    「過去に退職金を受け取ったことがありますか？」を選択すると、重複期間の調整を確認できます。
                  </p>
                )}

                {hasPastPayments === 'no' && adjustedDeductionAmount !== null && (
                  <div className="rd-adjustment-note">
                    <p className="rd-adjustment-note-title">調整後の退職所得控除額（目安）</p>
                    <p className="result-note">
                      過去の退職金の受け取りがないため、重複期間の調整はありません。シミュレーターの結果と同じ金額になります。
                    </p>
                    <p className="result-value">{adjustedDeductionAmount.toLocaleString()}円</p>
                    <span className="rd-result-value-sub">
                      （{formatManYen(adjustedDeductionAmount)}）
                    </span>
                  </div>
                )}

                {hasPastPayments === 'yes' &&
                  !hasPastPaymentError &&
                  overlapAdjustment &&
                  adjustedDeductionAmount !== null && (
                    <div className="rd-adjustment-note">
                      {overlapAdjustment.details.map((detail, index) => {
                        if (detail.receiveOrder === 'ideco-then-past') {
                          return detail.isWithinLookbackPeriod ? (
                            <p key={pastPayments[index].id} className="result-note">
                              退職金{index + 1}（{detail.payment.age}歳）は、iDeCoの受取予定（{endAge}
                              歳）より後に受け取る想定です。この場合、
                              <strong>今回のiDeCoの控除額には影響しません</strong>
                              が、その退職金を受け取る年（前年以前9年内）には、その退職金側の控除額が
                              調整される可能性があります（本シミュレーターでは計算していません）。
                            </p>
                          ) : (
                            <p key={pastPayments[index].id} className="result-note">
                              退職金{index + 1}（{detail.payment.age}歳）は、iDeCoの受取予定（{endAge}
                              歳）の「前年以前9年内」にあたらないため、調整の対象外です。
                            </p>
                          )
                        }
                        return detail.isWithinLookbackPeriod ? (
                          <p key={pastPayments[index].id} className="result-note">
                            退職金{index + 1}（{detail.payment.age}歳）は、iDeCoの受取予定（{endAge}
                            歳）の「前年以前19年内」にあたるため調整の対象です。勤続期間との重複は
                            {detail.overlapYears}年です。
                          </p>
                        ) : (
                          <p key={pastPayments[index].id} className="result-note">
                            退職金{index + 1}（{detail.payment.age}歳）は、iDeCoの受取予定（{endAge}
                            歳）の「前年以前19年内」にあたらないため、調整の対象外です。
                          </p>
                        )
                      })}

                      {overlapAdjustment.overlapDeduction > 0 && (
                        <dl className="result-breakdown">
                          <div className="result-breakdown-row">
                            <dt>調整の対象になった件数</dt>
                            <dd>{overlapAdjustment.qualifyingCount}件</dd>
                          </div>
                          <div className="result-breakdown-row">
                            <dt>iDeCo加入期間との重複年数（合計）</dt>
                            <dd>{overlapAdjustment.totalOverlapYears}年</dd>
                          </div>
                          <div className="result-breakdown-row">
                            <dt>差し引く金額</dt>
                            <dd>
                              40万円 × {overlapAdjustment.totalOverlapYears}年 ＝{' '}
                              {formatManYen(overlapAdjustment.overlapDeduction)}
                            </dd>
                          </div>
                        </dl>
                      )}

                      <p className="rd-adjustment-note-title">調整後の退職所得控除額（目安）</p>
                      <p className="result-note">
                        {formatManYen(basicDeductionAmount ?? 0)}（基本の控除額） －{' '}
                        {formatManYen(overlapAdjustment.overlapDeduction)} ＝{' '}
                        {formatManYen(adjustedDeductionAmount)}
                      </p>
                      <p className="result-value">{adjustedDeductionAmount.toLocaleString()}円</p>
                      <span className="rd-result-value-sub">
                        （{formatManYen(adjustedDeductionAmount)}）
                      </span>
                      <p className="result-note">
                        ※この金額は、公的資料に示された調整の考え方にもとづく概算です。相当する期間の算定方法や
                        重複年数の数え方は個別の状況によって異なる場合があるため、正確な金額は税務署・税理士、
                        または国税庁の情報でご確認ください。
                      </p>
                    </div>
                  )}
              </>
            )}
          </Card>
        </div>
      </section>

      <section id="deduction-result" className="section rd-simulator-section">
        <div className="container">
          <SectionHeading>あなたの退職所得控除額（目安）</SectionHeading>
          <Card className="rd-result">
            {errorMessage ? (
              <p className="result-placeholder">
                受取予定年齢を加入開始年齢より後にすると、ここに退職所得控除額の目安が表示されます。
              </p>
            ) : hasPastPayments === 'yes' && hasPastPaymentError ? (
              <p className="result-placeholder">
                「過去に受け取った退職金」の入力内容をご確認ください。エラーが解消されると、ここに退職所得控除額の目安が表示されます。
              </p>
            ) : (
              finalDeductionAmount !== null &&
              baseResult && (
                <div className="result-body">
                  <div className="result-block">
                    <p className="result-value">{finalDeductionAmount.toLocaleString()}円</p>
                    <span className="rd-result-value-sub">
                      （{formatManYen(finalDeductionAmount)}）
                    </span>
                  </div>

                  <dl className="result-breakdown">
                    <div className="result-breakdown-row">
                      <dt>加入期間</dt>
                      <dd>{enrollmentYears}年</dd>
                    </div>
                    <div className="result-breakdown-row">
                      <dt>控除計算上の年数</dt>
                      <dd>{baseResult.deductionYears}年</dd>
                    </div>
                    <div className="result-breakdown-row">
                      <dt>基本の計算式</dt>
                      <dd>{baseResult.formulaLabel}</dd>
                    </div>
                    {overlapAdjustment && overlapAdjustment.overlapDeduction > 0 && (
                      <div className="result-breakdown-row">
                        <dt>過去の退職金との重複期間調整</dt>
                        <dd>－{formatManYen(overlapAdjustment.overlapDeduction)}</dd>
                      </div>
                    )}
                  </dl>

                  <p className="result-note">
                    ※本シミュレーターは退職所得控除額の目安を確認するためのものです。実際の退職所得控除額や税額は、退職金の受取状況、iDeCoの受取方法、受取時期、過去の退職手当等の状況などによって異なる場合があります。最新の税制については国税庁などの公的情報をご確認ください。
                  </p>
                </div>
              )
            )}
          </Card>
        </div>
      </section>

      <section id="taxable-income" className="section rd-simulator-section">
        <div className="container">
          <SectionHeading>iDeCo一時金の課税対象額</SectionHeading>
          <Card className="rd-result">
            <p className="rd-example2-intro">
              iDeCoを一時金で受け取る場合、受取額から退職所得控除額を差し引き、
              残額の1/2が課税退職所得金額の計算対象となります。
            </p>

            <div className="field">
              <label htmlFor="ideco-lump-sum-amount">iDeCo一時金の受取額（円）</label>
              <input
                id="ideco-lump-sum-amount"
                type="text"
                inputMode="numeric"
                value={formatIntegerInputWithCommas(idecoLumpSumAmountInput)}
                onChange={(event) => {
                  const stripped = stripCommas(event.target.value)
                  if (/^-?\d*$/.test(stripped)) {
                    setIdecoLumpSumAmountInput(stripped)
                  }
                }}
                aria-describedby={idecoLumpSumAmountError ? 'ideco-lump-sum-amount-error' : undefined}
              />
              {idecoLumpSumAmountError && (
                <p id="ideco-lump-sum-amount-error" className="field-error" role="alert">
                  {idecoLumpSumAmountError}
                </p>
              )}
            </div>

            {finalDeductionAmount === null ? (
              <p className="result-note">
                「あなたの退職所得控除額（目安）」が確定すると、ここに課税退職所得金額の目安が表示されます。
              </p>
            ) : (
              taxableIncomeResult && (
                <div className="result-body">
                  <dl className="result-breakdown">
                    <div className="result-breakdown-row">
                      <dt>iDeCo一時金の受取額</dt>
                      <dd>{idecoLumpSumAmount!.toLocaleString()}円</dd>
                    </div>
                    <div className="result-breakdown-row">
                      <dt>− 退職所得控除額</dt>
                      <dd>{finalDeductionAmount.toLocaleString()}円</dd>
                    </div>
                    <div className="result-breakdown-row">
                      <dt>＝ 控除後の残額</dt>
                      <dd>{taxableIncomeResult.remainingAmount.toLocaleString()}円</dd>
                    </div>
                  </dl>

                  <p className="result-note">控除後の残額の1/2が、課税退職所得金額になります。</p>

                  <div className="result-block">
                    <span className="result-label">課税退職所得金額</span>
                    <p className="result-value">
                      {taxableIncomeResult.taxableRetirementIncome.toLocaleString()}円
                    </p>
                    <span className="rd-result-value-sub">
                      （{formatManYen(taxableIncomeResult.taxableRetirementIncome)}）
                    </span>
                  </div>

                  <p className="result-note">
                    ※ここで計算しているのは課税退職所得金額までです。実際の所得税額・住民税額は、
                    税率や復興特別所得税、他の所得との合算などによって異なるため、本シミュレーターでは
                    計算していません。正確な税額は税務署・税理士等にご確認ください。
                  </p>
                </div>
              )
            )}
          </Card>
        </div>
      </section>

      <section id="deduction-exhausted" className="section rd-notice-section">
        <div className="container">
          <SectionHeading>退職所得控除を使い切った場合は？</SectionHeading>
          <div className="article-body">
            <p>
              会社の退職金とiDeCoの老齢一時金を両方とも「一時金」で受け取ると、2つの金額の合計が
              退職所得控除額を超えた部分について、課税対象になる可能性があります（超えた金額が
              そのまま税額になるわけではなく、超えた金額の1/2が退職所得として扱われ、そこから
              税額が計算されます）。
            </p>
            <div className="rd-timeline">
              <dl className="rd-timeline-row">
                <dt>例</dt>
                <dd>
                  会社の退職金1,000万円を受け取り、退職所得控除もちょうど1,000万円で使い切ったとします。
                  この後にiDeCoの老齢一時金500万円を一時金として受け取ると、控除はすでに使い切って
                  いるため、500万円のうち課税対象になる部分が生じる可能性があります。
                </dd>
              </dl>
            </div>
            <p>
              iDeCoは一時金だけでなく、年金として受け取る方法や、一時金と年金を組み合わせる方法が
              あります。例えば先ほどの500万円を、一時金200万円＋年金300万円のように分けて受け取る
              こともできます。
            </p>
            <p>
              年金で受け取る場合は、退職所得とは異なる税制が適用されます（公的年金等に係る雑所得として
              扱われます）。どちらが有利かは、退職金の金額、他の所得の状況、年金を受け取る期間などに
              よって異なるため、本シミュレーターでは年金で受け取る場合の具体的な税額計算は行っていません。
              一時金・年金の組み合わせを検討する場合は、税務署・税理士、またはiDeCoの運営管理機関に
              ご相談ください。
            </p>
          </div>
        </div>
      </section>

      <section className="section rd-quiet-section">
        <div className="container">
          <div className="rd-quiet-box">
            <div id="example" className="rd-quiet-box-block">
              <p className="rd-quiet-box-title">計算例</p>
              <div className="article-body">
                <p>
                  拠出期間が150か月（12年6か月）の場合、1年未満の端数を切り上げて13年として計算します。
                </p>
                <p>
                  控除計算上の年数が20年以下のため「40万円 × 13年 =
                  520万円」が退職所得控除額の目安になります。
                </p>
              </div>
            </div>

            <div id="calculation-notes" className="rd-quiet-box-block">
              <p className="rd-quiet-box-title">注意事項（計算方法について）</p>
              <div className="article-body">
                <p>
                  本シミュレーターは、入力された拠出月数をもとにした概算です。実際の加入期間は、運営管理機関に記録されている加入者記録等にもとづいて確認されます。
                </p>
                <p>
                  掛金を拠出していない期間（運用指図者であった期間など）の扱いについては、加入している運営管理機関にご確認ください。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ArticleSection
        id="what-is-deduction"
        title="退職所得控除とは？"
        paragraphs={[
          '退職所得控除とは、退職金など「退職所得」を受け取るときに、税金の負担を軽くするために所得から差し引ける金額のことです。',
          '勤続年数（iDeCoの場合は掛金を拠出した期間）が長いほど、控除額は大きくなります。控除額を超えた部分だけが課税の対象になるため、退職所得は給与などほかの所得と比べて税負担が軽くなるよう設計されています。',
        ]}
      />

      <ArticleSection
        id="ideco-lump-sum"
        title="iDeCoの一時金と退職所得控除"
        paragraphs={[
          'iDeCoの老齢給付金を一時金として受け取る場合、税制上は「退職所得」として扱われ、退職所得控除の対象になります。',
          '控除額の計算では、会社の退職金のような「勤続年数」ではなく、iDeCoに加入して掛金を拠出していた期間（拠出月数）をもとにした年数を使う点が特徴です。',
        ]}
      />

      <ArticleSection
        id="how-to-calculate"
        title="退職所得控除の計算方法"
        paragraphs={[
          '控除計算上の年数が20年以下の場合は「40万円 × 年数」（80万円未満の場合は80万円）、20年を超える場合は「800万円 + 70万円 ×（年数 − 20年）」で計算します。',
          '1年未満の端数は、1年として切り上げて計算します。例えば拠出期間が12年6か月であれば、控除計算上は13年として扱います。',
        ]}
      />

      <section className="section rd-notice-section">
        <div className="container">
          <NoticeBox title="重要：退職金とiDeCoを両方受け取る場合の注意">
            <p>
              会社の退職金とiDeCoの老齢一時金を別々の時期に受け取る場合、退職所得控除の計算において、
              過去に受け取った退職手当等との重複期間を調整するしくみがあります。本シミュレーターの
              「過去に受け取った退職金」欄に必要な情報を入力すると、この調整を反映した控除額の目安を
              確認できますが、実際の勤続期間の数え方や複数件が重なる場合の扱いなど、細かな点は
              個別の状況によって異なる場合があります。退職金とiDeCoを両方受け取る予定がある場合は、
              国税庁や税務署などで詳細をご確認ください。
            </p>
            <p>
              本シミュレーターは退職所得控除額の目安を確認するためのものです。実際の退職所得控除額や税額は、退職金の受取状況、
              iDeCoの受取方法、受取時期、過去の退職手当等の状況などによって異なる場合があります。最新の税制については国税庁などの公的情報をご確認ください。
            </p>
          </NoticeBox>
        </div>
      </section>

      <section className="section rd-sources-section">
        <div className="container">
          <SourceList sources={sources} />
        </div>
      </section>

      <div className="container rd-back">
        <Link to="/" className="btn btn-secondary">
          トップページへ戻る
        </Link>
      </div>
    </>
  )
}

export default RetirementDeductionPage
