import { useMemo, useState } from 'react'
import SectionHeading from '../common/SectionHeading'
import Card from '../common/Card'
import {
  calculateRetirementDeduction,
  formatManYen,
  validateRetirementPeriodInput,
} from '../../utils/calculateRetirementDeduction'
import './RetirementDeductionSimulator.css'

interface RetirementDeductionSimulatorProps {
  id?: string
}

// 入力すると即座に結果が更新される（ボタンを押す必要がない）シミュレーター。
// 計算そのものはutils/calculateRetirementDeduction.tsに分離してあるため、
// 税制が変わったときはそちらだけを直せばよい。
function RetirementDeductionSimulator({ id }: RetirementDeductionSimulatorProps) {
  const [years, setYears] = useState(20)
  const [months, setMonths] = useState(6)

  const errorMessage = useMemo(
    () => validateRetirementPeriodInput(years, months),
    [years, months],
  )

  const result = useMemo(() => {
    if (errorMessage) {
      return null
    }
    return calculateRetirementDeduction(years, months)
  }, [years, months, errorMessage])

  return (
    <section id={id} className="section rd-simulator-section">
      <div className="container">
        <SectionHeading>退職所得控除シミュレーター</SectionHeading>
        <p className="rd-simulator-intro">
          iDeCoの加入期間（掛金を拠出した期間）を入力すると、退職所得控除額の目安が分かります。
        </p>

        <div className="rd-simulator-layout">
          <fieldset className="rd-form">
            <legend>加入期間</legend>
            <div className="rd-period-inputs">
              <div className="field">
                <label htmlFor="rd-years">年</label>
                <input
                  id="rd-years"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={60}
                  value={years}
                  onChange={(event) => setYears(Number(event.target.value))}
                  aria-describedby={errorMessage ? 'rd-period-error' : undefined}
                />
              </div>
              <div className="field">
                <label htmlFor="rd-months">か月</label>
                <input
                  id="rd-months"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={11}
                  value={months}
                  onChange={(event) => setMonths(Number(event.target.value))}
                  aria-describedby={errorMessage ? 'rd-period-error' : undefined}
                />
              </div>
            </div>
            <p className="field-hint">
              iDeCoに加入して、掛金を拠出していた期間で入力してください。
            </p>
            {errorMessage && (
              <p id="rd-period-error" className="rd-error" role="alert">
                入力エラー：{errorMessage}
              </p>
            )}
          </fieldset>

          <Card className="rd-result">
            {result === null ? (
              <p className="result-placeholder">
                加入期間を入力すると、ここに退職所得控除額の目安が表示されます。
              </p>
            ) : (
              <div className="result-body">
                <div className="result-block">
                  <span className="result-label">あなたの退職所得控除額（目安）</span>
                  <p className="rd-result-value">{result.deductionAmount.toLocaleString()}円</p>
                  <span className="rd-result-value-sub">
                    （{formatManYen(result.deductionAmount)}）
                  </span>
                </div>

                <dl className="rd-breakdown">
                  <div className="rd-breakdown-row">
                    <dt>加入期間</dt>
                    <dd>
                      {years}年{months}か月
                    </dd>
                  </div>
                  <div className="rd-breakdown-row">
                    <dt>控除計算上の年数</dt>
                    <dd>{result.deductionYears}年</dd>
                  </div>
                  <div className="rd-breakdown-row">
                    <dt>計算式</dt>
                    <dd>{result.formulaLabel}</dd>
                  </div>
                </dl>

                <p className="result-note">
                  ※本シミュレーターは退職所得控除額の目安を確認するためのものです。実際の退職所得控除額や税額は、退職金の受取状況、iDeCoの受取方法、受取時期、過去の退職手当等の状況などによって異なる場合があります。最新の税制については国税庁などの公的情報をご確認ください。
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  )
}

export default RetirementDeductionSimulator
