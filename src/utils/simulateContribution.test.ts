import { describe, expect, it } from 'vitest'
import type { RuleSet } from '../types/ideco'
import {
  calculateAnnualContribution,
  estimateCombinedTaxRate,
  estimateTaxBenefit,
  findCategory,
  pickParticipantGroup,
} from './simulateContribution'

const ruleSet: RuleSet = {
  label: 'テスト用ルール',
  effectiveFrom: '2024-12-01',
  categories: [
    {
      id: 'employee-no-pension',
      group: 'employee-no-pension',
      label: '会社員（企業年金なし）',
      monthlyLimit: 23000,
      note: '',
    },
    {
      id: 'employee-with-pension',
      group: 'employee-with-pension',
      label: '会社員（企業年金あり）',
      monthlyLimit: 20000,
      note: '事業主の掛金相当額との合計が月5.5万円以内であることが必要です。',
    },
  ],
}

describe('pickParticipantGroup', () => {
  it('企業年金・企業型DCのいずれもない場合はemployee-no-pension', () => {
    expect(pickParticipantGroup({ hasCompanyPension: false, hasCorporateDc: false })).toBe(
      'employee-no-pension',
    )
  })

  it('企業年金がある場合はemployee-with-pension', () => {
    expect(pickParticipantGroup({ hasCompanyPension: true, hasCorporateDc: false })).toBe(
      'employee-with-pension',
    )
  })

  it('企業型DCがある場合はemployee-with-pension', () => {
    expect(pickParticipantGroup({ hasCompanyPension: false, hasCorporateDc: true })).toBe(
      'employee-with-pension',
    )
  })

  it('両方ある場合もemployee-with-pension', () => {
    expect(pickParticipantGroup({ hasCompanyPension: true, hasCorporateDc: true })).toBe(
      'employee-with-pension',
    )
  })
})

describe('findCategory', () => {
  it('一致するgroupの区分を返す', () => {
    const category = findCategory(ruleSet, 'employee-with-pension')
    expect(category?.label).toBe('会社員（企業年金あり）')
    expect(category?.monthlyLimit).toBe(20000)
  })

  it('一致する区分がない場合はundefinedを返す', () => {
    expect(findCategory(ruleSet, 'self-employed')).toBeUndefined()
  })
})

describe('estimateCombinedTaxRate', () => {
  it('年収500万円未満は15%', () => {
    expect(estimateCombinedTaxRate(4_999_999)).toBe(0.15)
  })

  it('年収500万円以上800万円未満は20%', () => {
    expect(estimateCombinedTaxRate(5_000_000)).toBe(0.2)
    expect(estimateCombinedTaxRate(7_999_999)).toBe(0.2)
  })

  it('年収800万円以上は30%', () => {
    expect(estimateCombinedTaxRate(8_000_000)).toBe(0.3)
  })
})

describe('calculateAnnualContribution', () => {
  it('月額掛金を12倍した年間掛金を返す', () => {
    expect(calculateAnnualContribution(20000)).toBe(240000)
    expect(calculateAnnualContribution(23000)).toBe(276000)
  })
})

describe('estimateTaxBenefit', () => {
  it('年間掛金に税率をかけた概算額を返す', () => {
    expect(estimateTaxBenefit(240000, 6_000_000)).toBe(48000)
  })

  it('年収帯が変わると概算額も変わる', () => {
    expect(estimateTaxBenefit(240000, 4_000_000)).toBe(36000)
    expect(estimateTaxBenefit(240000, 9_000_000)).toBe(72000)
  })
})
