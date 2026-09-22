import { useMemo } from 'react'
import SectionHeading from '../common/SectionHeading'
import {
  calculateEnrollmentYears,
  validateAgeRangeInput,
} from '../../utils/calculateRetirementDeduction'
import { MAX_IDECO_AGE_EXCLUSIVE, MIN_IDECO_AGE } from '../../utils/simulateContribution'
import './RetirementDeductionSimulator.css'

// iDeCoの加入可能年齢（掛金シミュレーターと同じ範囲）の中から選択させる。
const AGE_OPTIONS = Array.from(
  { length: MAX_IDECO_AGE_EXCLUSIVE - MIN_IDECO_AGE },
  (_, index) => MIN_IDECO_AGE + index,
)

interface RetirementDeductionSimulatorProps {
  id?: string
  startAge: number
  endAge: number
  onStartAgeChange: (age: number) => void
  onEndAgeChange: (age: number) => void
}

// 入力すると即座に結果が更新される（ボタンを押す必要がない）シミュレーター。
// ユーザーには「加入期間」を直接入力させず、加入開始年齢・受取予定年齢を選択してもらい、
// その差から加入期間を自動計算する。加入開始年齢・受取予定年齢（startAge/endAge）は
// ページ側（RetirementDeductionPage）が保持し、画面内の「事例」でも同じ値を使えるように
// propsで受け取る構成にしている。
// 計算そのものはutils/calculateRetirementDeduction.tsに分離してあるため、
// 税制が変わったときはそちらだけを直せばよい。
function RetirementDeductionSimulator({
  id,
  startAge,
  endAge,
  onStartAgeChange,
  onEndAgeChange,
}: RetirementDeductionSimulatorProps) {
  const errorMessage = useMemo(() => validateAgeRangeInput(startAge, endAge), [startAge, endAge])
  const enrollmentYears = useMemo(
    () => calculateEnrollmentYears(startAge, endAge),
    [startAge, endAge],
  )

  return (
    <section id={id} className="section rd-simulator-section">
      <div className="container">
        <SectionHeading>退職所得控除シミュレーター</SectionHeading>
        <p className="rd-simulator-intro">
          iDeCoを始めた年齢と受け取る予定の年齢を選択すると、退職所得控除額の目安が分かります。
        </p>

        <fieldset className="rd-form">
          <legend>加入期間</legend>
          <div className="rd-period-inputs">
            <div className="field">
              <label htmlFor="rd-start-age">iDeCoを何歳から始めましたか？</label>
              <select
                id="rd-start-age"
                value={startAge}
                onChange={(event) => onStartAgeChange(Number(event.target.value))}
                aria-describedby={errorMessage ? 'rd-period-error' : undefined}
              >
                {AGE_OPTIONS.map((age) => (
                  <option key={age} value={age}>
                    {age}歳
                  </option>
                ))}
              </select>
            </div>
            <span className="rd-period-separator" aria-hidden="true">
              〜
            </span>
            <div className="field">
              <label htmlFor="rd-end-age">何歳で受け取る予定ですか？</label>
              <select
                id="rd-end-age"
                value={endAge}
                onChange={(event) => onEndAgeChange(Number(event.target.value))}
                aria-describedby={errorMessage ? 'rd-period-error' : undefined}
              >
                {AGE_OPTIONS.map((age) => (
                  <option key={age} value={age}>
                    {age}歳
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage ? (
            <p id="rd-period-error" className="rd-error" role="alert">
              入力エラー：{errorMessage}
            </p>
          ) : (
            <div className="rd-period-highlight">
              <span className="field-hint">加入期間</span>
              <p className="rd-period-highlight-value">{enrollmentYears}年</p>
            </div>
          )}
        </fieldset>
      </div>
    </section>
  )
}

export default RetirementDeductionSimulator
