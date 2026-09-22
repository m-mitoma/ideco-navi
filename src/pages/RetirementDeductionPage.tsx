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
  formatManYen,
  validateAgeRangeInput,
  validatePastPaymentAgeInput,
  validatePastPaymentAmountInput,
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

const sources = [
  {
    name: '国税庁「No.1420 退職金を受け取ったとき（退職所得）」',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1420.htm',
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
}

let pastPaymentIdCounter = 0
function createPastPaymentEntry(): PastPaymentEntry {
  pastPaymentIdCounter += 1
  return { id: `past-payment-${pastPaymentIdCounter}`, age: 45, amountInput: '' }
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

  // シミュレーター本体と同じ関数・同じ加入期間で計算する（退職所得控除額の基準値）。
  const baseResult = useMemo(() => {
    if (errorMessage) {
      return null
    }
    return calculateRetirementDeduction(enrollmentYears, 0)
  }, [enrollmentYears, errorMessage])

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

  const pastPaymentErrors = useMemo(
    () =>
      new Map(
        pastPayments.map((payment) => [
          payment.id,
          validatePastPaymentAmountInput(payment.amountInput) ??
            validatePastPaymentAgeInput(payment.age),
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
        .map((payment) => ({ age: payment.age, amount: parseIntegerInput(payment.amountInput) }))
        .filter((payment): payment is PastPayment => payment.amount !== null),
    [pastPayments],
  )

  // 過去に受け取った退職金の受け取りがない・未回答・入力が不正な場合はnull。
  const overlapAdjustment = useMemo(() => {
    if (hasPastPayments !== 'yes' || hasPastPaymentError) {
      return null
    }
    return calculateOverlapAdjustment(validPastPayments, endAge)
  }, [hasPastPayments, hasPastPaymentError, validPastPayments, endAge])

  // 調整後の退職所得控除額（目安）。過去の退職金の受け取りがない場合は基準値と同じ額になる。
  // マイナスにはならないよう下限を0円にしている。
  const adjustedDeductionAmount = useMemo(() => {
    if (!baseResult) {
      return null
    }
    if (hasPastPayments === 'no') {
      return baseResult.deductionAmount
    }
    if (!overlapAdjustment) {
      return null
    }
    return Math.max(0, baseResult.deductionAmount - overlapAdjustment.overlapDeduction)
  }, [baseResult, hasPastPayments, overlapAdjustment])

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
                      {overlapAdjustment.overlapDeduction > 0 ? (
                        <>
                          <p>
                            登録した退職金のうち、iDeCoの老齢一時金の受取予定（{endAge}歳）の
                            <strong>「前年以前19年内」</strong>
                            に受け取った{overlapAdjustment.qualifyingCount}件（合計
                            {formatManYen(overlapAdjustment.qualifyingAmount)}
                            ）が、厚生労働省の資料に
                            示されている「退職所得控除の調整規定」の対象になります。
                          </p>
                          <dl className="result-breakdown">
                            <div className="result-breakdown-row">
                              <dt>調整の対象になった退職金の合計</dt>
                              <dd>{formatManYen(overlapAdjustment.qualifyingAmount)}</dd>
                            </div>
                            <div className="result-breakdown-row">
                              <dt>相当する期間（合計額 ÷ 40万円、端数切り捨て）</dt>
                              <dd>{overlapAdjustment.equivalentYears}年</dd>
                            </div>
                            <div className="result-breakdown-row">
                              <dt>iDeCo加入期間との重複年数</dt>
                              <dd>{overlapAdjustment.overlapYears}年</dd>
                            </div>
                            <div className="result-breakdown-row">
                              <dt>差し引く金額</dt>
                              <dd>
                                40万円 × {overlapAdjustment.overlapYears}年 ＝{' '}
                                {formatManYen(overlapAdjustment.overlapDeduction)}
                              </dd>
                            </div>
                          </dl>
                          {overlapAdjustment.qualifyingCount < pastPayments.length && (
                            <p className="result-note">
                              登録した{pastPayments.length}件のうち
                              {pastPayments.length - overlapAdjustment.qualifyingCount}
                              件は、前年以前19年内に受け取ったものではないため、調整の対象に含めていません。
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="result-note">
                          登録した退職金は、iDeCoの老齢一時金の受取予定（{endAge}歳）の
                          「前年以前19年内」にあたらないため、重複期間の調整の対象外です。
                        </p>
                      )}

                      <p className="rd-adjustment-note-title">調整後の退職所得控除額（目安）</p>
                      <p className="result-note">
                        {formatManYen(baseResult.deductionAmount)}（シミュレーターの結果） －{' '}
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
            {baseResult === null ? (
              <p className="result-placeholder">
                受取予定年齢を加入開始年齢より後にすると、ここに退職所得控除額の目安が表示されます。
              </p>
            ) : (
              <div className="result-body">
                <div className="result-block">
                  <p className="result-value">{baseResult.deductionAmount.toLocaleString()}円</p>
                  <span className="rd-result-value-sub">
                    （{formatManYen(baseResult.deductionAmount)}）
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
                    <dt>計算式</dt>
                    <dd>{baseResult.formulaLabel}</dd>
                  </div>
                </dl>

                <p className="result-note">
                  ※本シミュレーターは退職所得控除額の目安を確認するためのものです。実際の退職所得控除額や税額は、退職金の受取状況、iDeCoの受取方法、受取時期、過去の退職手当等の状況などによって異なる場合があります。最新の税制については国税庁などの公的情報をご確認ください。
                </p>
              </div>
            )}
          </Card>
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
              過去に受け取った退職手当等との重複期間を調整するしくみがあります。本シミュレーターはこの調整を反映していないため、
              退職金とiDeCoを両方受け取る予定がある場合は、厚生労働省の資料や税務署などで詳細をご確認ください。
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
