import { useState } from 'react'
import type { FormEvent } from 'react'
import SectionHeading from '../common/SectionHeading'
import Card from '../common/Card'
import Button from '../common/Button'
import AsyncState from '../common/AsyncState'
import type { IdecoData, ParticipantCategory } from '../../types/ideco'
import {
  calculateAnnualContribution,
  estimateTaxBenefit,
  findCategory,
  pickParticipantGroup,
} from '../../utils/simulateContribution'
import './SimulatorSection.css'

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
  const [age, setAge] = useState(40)
  const [annualIncome, setAnnualIncome] = useState(6000000)
  const [hasCompanyPension, setHasCompanyPension] = useState(false)
  const [hasCorporateDc, setHasCorporateDc] = useState(false)
  const [monthlyAmount, setMonthlyAmount] = useState(20000)
  const [result, setResult] = useState<SimulationResult | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!data) {
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
                  type="number"
                  min={20}
                  max={69}
                  value={age}
                  onChange={(event) => setAge(Number(event.target.value))}
                />
              </div>

              <div className="field">
                <label htmlFor="sim-income">年収（円）</label>
                <input
                  id="sim-income"
                  type="number"
                  min={0}
                  step={100000}
                  value={annualIncome}
                  onChange={(event) => setAnnualIncome(Number(event.target.value))}
                />
                <span className="field-hint">
                  年収は税制メリットの概算にのみ使用し、拠出限度額の判定には使用しません。
                </span>
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
                  type="number"
                  min={1000}
                  step={1000}
                  value={monthlyAmount}
                  onChange={(event) => setMonthlyAmount(Number(event.target.value))}
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
