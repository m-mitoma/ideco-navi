import type { ParticipantCategory, ParticipantGroup, RuleSet } from '../types/ideco'

export interface SimulationInput {
  hasCompanyPension: boolean
  hasCorporateDc: boolean
  monthlyAmount: number
  annualIncome: number
}

// 会社員の区分は「企業年金・企業型DCがあるかどうか」だけで決める。
// 年収はここでは使わない（年収だけで拠出限度額を決めないため）。
export function pickParticipantGroup(input: {
  hasCompanyPension: boolean
  hasCorporateDc: boolean
}): ParticipantGroup {
  return input.hasCompanyPension || input.hasCorporateDc
    ? 'employee-with-pension'
    : 'employee-no-pension'
}

export function findCategory(
  ruleSet: RuleSet,
  group: ParticipantGroup,
): ParticipantCategory | undefined {
  return ruleSet.categories.find((category) => category.group === group)
}

// 年収から所得税・住民税の「合計税率の目安」をざっくり区分するだけの簡易ロジック。
// 実際の税率は課税所得（年収から各種控除を引いた額）で決まるため、あくまで目安。
export function estimateCombinedTaxRate(annualIncome: number): number {
  if (annualIncome < 5_000_000) {
    return 0.15
  }
  if (annualIncome < 8_000_000) {
    return 0.2
  }
  return 0.3
}

export function calculateAnnualContribution(monthlyAmount: number): number {
  return monthlyAmount * 12
}

export function estimateTaxBenefit(annualContribution: number, annualIncome: number): number {
  const rate = estimateCombinedTaxRate(annualIncome)
  return Math.round(annualContribution * rate)
}
