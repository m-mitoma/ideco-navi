import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import SectionHeading from '../common/SectionHeading'
import Card from '../common/Card'
import Button from '../common/Button'
import AsyncState from '../common/AsyncState'
import type { IdecoData, ParticipantCategory } from '../../types/ideco'
import {
  calculateAnnualContribution,
  estimateTaxBenefit,
  findCategory,
  formatIntegerInputWithCommas,
  parseIntegerInput,
  pickParticipantGroup,
  stripCommas,
  validateAgeInput,
  validateAnnualIncomeInput,
} from '../../utils/simulateContribution'
import './SimulatorSection.css'

// 入力途中の空文字やマイナスの符号をそのまま許容し、数字以外の文字は入力させない。
// （例: Delete/Backspaceで全消去した直後に空文字を許容し、「0」が残ることで
// 　次の入力が「035」のように連結されてしまう問題を避ける）
function isEditableIntegerInput(raw: string): boolean {
  return /^-?\d*$/.test(raw)
}

interface SimulatorSectionProps {
  id?: string
  data: IdecoData | null
  isLoading: boolean
  error: string | null
}

interface SimulationResult {
  annualContribution: number
  currentCategory?: ParticipantCategory
  futureCategory?: ParticipantCategory
  estimatedTaxBenefit: number
}

function SimulatorSection({ id, data, isLoading, error }: SimulatorSectionProps) {
  const [ageInput, setAgeInput] = useState('40')
  const [incomeInput, setIncomeInput] = useState('6000000')
  const [hasCompanyPension, setHasCompanyPension] = useState(false)
  const [hasCorporateDc, setHasCorporateDc] = useState(false)
  const [monthlyAmountInput, setMonthlyAmountInput] = useState('20000')
  const [result, setResult] = useState<SimulationResult | null>(null)

  const ageError = useMemo(() => validateAgeInput(ageInput), [ageInput])
  const incomeError = useMemo(() => validateAnnualIncomeInput(incomeInput), [incomeInput])

  function handleAgeChange(event: ChangeEvent<HTMLInputElement>) {
    if (isEditableIntegerInput(event.target.value)) {
      setAgeInput(event.target.value)
    }
  }

  function handleIncomeChange(event: ChangeEvent<HTMLInputElement>) {
    const stripped = stripCommas(event.target.value)
    if (isEditableIntegerInput(stripped)) {
      setIncomeInput(stripped)
    }
  }

  function handleMonthlyAmountChange(event: ChangeEvent<HTMLInputElement>) {
    const stripped = stripCommas(event.target.value)
    if (isEditableIntegerInput(stripped)) {
      setMonthlyAmountInput(stripped)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!data || ageError || incomeError) {
      return
    }

    const annualIncome = parseIntegerInput(incomeInput)
    const monthlyAmount = parseIntegerInput(monthlyAmountInput)
    if (annualIncome === null || monthlyAmount === null) {
      return
    }

    const group = pickParticipantGroup({ hasCompanyPension, hasCorporateDc })
    const currentCategory = findCategory(data.currentRules, group)
    const futureCategory = findCategory(data.futureRules, group)
    const annualContribution = calculateAnnualContribution(monthlyAmount)

    setResult({
      annualContribution,
      currentCategory,
      futureCategory,
      estimatedTaxBenefit: estimateTaxBenefit(annualContribution, annualIncome),
    })
  }

  return (
    <section id={id} className="section simulator-section">
      <div className="container">
        <SectionHeading>掛金シミュレーション</SectionHeading>
        <p className="simulator-intro">
          年齢・年収・企業年金の状況・毎月の掛金を入力すると、確認すべき拠出限度額の区分と、
          2026年12月以降の変化の目安が分かります。
          <strong>拠出限度額は年収ではなく、企業年金の加入状況で決まります。</strong>
        </p>

        {isLoading && <AsyncState type="loading" message="制度データを読み込んでいます…" />}
        {error && <AsyncState type="error" message={error} />}

        {!isLoading && !error && (
          <div className="simulator-layout">
            <form className="simulator-form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="sim-age">年齢</label>
                <input
                  id="sim-age"
                  type="text"
                  inputMode="numeric"
                  value={ageInput}
                  onChange={handleAgeChange}
                  aria-describedby={ageError ? 'sim-age-error' : undefined}
                />
                {ageError && (
                  <p id="sim-age-error" className="field-error" role="alert">
                    {ageError}
                  </p>
                )}
              </div>

              <div className="field">
                <label htmlFor="sim-income">年収（円）</label>
                <input
                  id="sim-income"
                  type="text"
                  inputMode="numeric"
                  value={formatIntegerInputWithCommas(incomeInput)}
                  onChange={handleIncomeChange}
                  aria-describedby={incomeError ? 'sim-income-error' : undefined}
                />
                <span className="field-hint">
                  年収は税制メリットの概算にのみ使用し、拠出限度額の判定には使用しません。
                </span>
                {incomeError && (
                  <p id="sim-income-error" className="field-error" role="alert">
                    {incomeError}
                  </p>
                )}
              </div>

              <div className="field field-checkbox">
                <label htmlFor="sim-has-pension">
                  <input
                    id="sim-has-pension"
                    type="checkbox"
                    checked={hasCompanyPension}
                    onChange={(event) => setHasCompanyPension(event.target.checked)}
                  />
                  DB（確定給付企業年金）など、企業型DC以外の企業年金がある
                </label>
              </div>

              <div className="field field-checkbox">
                <label htmlFor="sim-has-dc">
                  <input
                    id="sim-has-dc"
                    type="checkbox"
                    checked={hasCorporateDc}
                    onChange={(event) => setHasCorporateDc(event.target.checked)}
                  />
                  企業型DC（企業型確定拠出年金）がある
                </label>
              </div>

              <div className="field">
                <label htmlFor="sim-amount">毎月の掛金額（円）</label>
                <input
                  id="sim-amount"
                  type="text"
                  inputMode="numeric"
                  value={formatIntegerInputWithCommas(monthlyAmountInput)}
                  onChange={handleMonthlyAmountChange}
                />
              </div>

              <Button type="submit">入力内容で確認する</Button>
            </form>

            <Card className="simulator-result">
              {result === null ? (
                <p className="result-placeholder">
                  条件を入力して「入力内容で確認する」を押すと、ここに結果が表示されます。
                </p>
              ) : (
                <div className="result-body">
                  <div className="result-block">
                    <span className="result-label">年間掛金</span>
                    <p className="result-value">{result.annualContribution.toLocaleString()}円</p>
                  </div>

                  <div className="result-block">
                    <span className="result-label">制度上確認すべき拠出限度額（現在）</span>
                    <p className="result-value-small">
                      {result.currentCategory
                        ? `${result.currentCategory.label} / 月額${result.currentCategory.monthlyLimit.toLocaleString()}円`
                        : '該当区分が見つかりませんでした'}
                    </p>
                    {result.currentCategory?.note && (
                      <p className="result-note">{result.currentCategory.note}</p>
                    )}
                  </div>

                  <div className="result-block">
                    <span className="result-label">2026年12月以降の見込み</span>
                    <p className="result-value-small">
                      {result.futureCategory
                        ? `${result.futureCategory.label} / 月額${result.futureCategory.monthlyLimit.toLocaleString()}円`
                        : '該当区分が見つかりませんでした'}
                    </p>
                    {result.futureCategory?.note && (
                      <p className="result-note">{result.futureCategory.note}</p>
                    )}
                  </div>

                  <div className="result-block">
                    <span className="result-label">税制メリットの目安（簡易計算・概算）</span>
                    <p className="result-value-small">
                      年間 約{result.estimatedTaxBenefit.toLocaleString()}円
                    </p>
                    <p className="result-note">
                      年収から仮定した税率をもとにした概算です。実際の税額を保証するものではありません。正確な金額は税務署や税理士等にご確認ください。
                    </p>
                  </div>

                  <div className="result-block">
                    <p className="result-label">確認が必要な条件</p>
                    <ul className="result-check-list">
                      <li>勤務先の企業型DCの事業主掛金額</li>
                      <li>DB等の他制度掛金相当額</li>
                      <li>企業型DCのマッチング拠出の有無</li>
                      <li>加入している運営管理機関の規定</li>
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </section>
  )
}

export default SimulatorSection
