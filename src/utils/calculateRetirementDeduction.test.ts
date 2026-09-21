import { describe, expect, it } from 'vitest'
import {
  buildFormulaLabel,
  calculateDeductionAmount,
  calculateEquivalentYears,
  calculateRetirementDeduction,
  formatManYen,
  monthsToDeductionYears,
  validateRetirementPeriodInput,
} from './calculateRetirementDeduction'

describe('validateRetirementPeriodInput', () => {
  it('有効な入力ではnullを返す', () => {
    expect(validateRetirementPeriodInput(20, 6)).toBeNull()
    expect(validateRetirementPeriodInput(0, 1)).toBeNull()
    expect(validateRetirementPeriodInput(60, 0)).toBeNull()
  })

  it('数値でない入力はエラーになる', () => {
    expect(validateRetirementPeriodInput(NaN, 0)).toBe('年数・月数は数値で入力してください。')
    expect(validateRetirementPeriodInput(20, NaN)).toBe('年数・月数は数値で入力してください。')
  })

  it('整数でない入力はエラーになる', () => {
    expect(validateRetirementPeriodInput(20.5, 0)).toBe(
      '年数・月数は整数で入力してください（小数は使用できません）。',
    )
  })

  it('マイナスの入力はエラーになる', () => {
    expect(validateRetirementPeriodInput(-1, 0)).toBe('年数・月数はマイナスの値を入力できません。')
    expect(validateRetirementPeriodInput(0, -1)).toBe('年数・月数はマイナスの値を入力できません。')
  })

  it('月数が0〜11の範囲外はエラーになる', () => {
    expect(validateRetirementPeriodInput(20, 12)).toBe('月数は0〜11の範囲で入力してください。')
  })

  it('加入期間が1か月未満はエラーになる', () => {
    expect(validateRetirementPeriodInput(0, 0)).toBe('加入期間を1か月以上で入力してください。')
  })

  it('加入期間が60年を超えるとエラーになる', () => {
    expect(validateRetirementPeriodInput(60, 1)).toBe(
      '加入期間が想定範囲（60年）を超えています。入力内容をご確認ください。',
    )
  })
})

describe('monthsToDeductionYears', () => {
  it('1年未満の端数を切り上げる', () => {
    expect(monthsToDeductionYears(150)).toBe(13)
    expect(monthsToDeductionYears(1)).toBe(1)
  })

  it('ちょうど割り切れる場合はそのままの年数になる', () => {
    expect(monthsToDeductionYears(120)).toBe(10)
    expect(monthsToDeductionYears(240)).toBe(20)
    expect(monthsToDeductionYears(360)).toBe(30)
  })
})

describe('calculateDeductionAmount', () => {
  it('20年以下は40万円×年数で計算する', () => {
    expect(calculateDeductionAmount(10)).toBe(4_000_000)
    expect(calculateDeductionAmount(20)).toBe(8_000_000)
  })

  it('40万円×年数が80万円未満の場合は80万円になる', () => {
    expect(calculateDeductionAmount(1)).toBe(800_000)
    expect(calculateDeductionAmount(2)).toBe(800_000)
  })

  it('20年を超える場合は800万円+70万円×超過年数で計算する', () => {
    expect(calculateDeductionAmount(21)).toBe(8_700_000)
    expect(calculateDeductionAmount(30)).toBe(15_000_000)
  })
})

describe('buildFormulaLabel', () => {
  it('20年以下・80万円未満の場合は最低保証の注記を含める', () => {
    expect(buildFormulaLabel(1)).toBe('40万円 × 1年 = 40万円 → 最低保証の80万円を適用')
  })

  it('20年以下・80万円以上の場合は通常の計算式になる', () => {
    expect(buildFormulaLabel(10)).toBe('40万円 × 10年')
  })

  it('20年を超える場合は長期の計算式になる', () => {
    expect(buildFormulaLabel(25)).toBe('800万円 + 70万円 ×（25年 − 20年）')
  })
})

describe('calculateRetirementDeduction', () => {
  it('10年0か月の場合', () => {
    const result = calculateRetirementDeduction(10, 0)
    expect(result.deductionYears).toBe(10)
    expect(result.deductionAmount).toBe(4_000_000)
    expect(result.formulaLabel).toBe('40万円 × 10年')
  })

  it('20年0か月の場合', () => {
    const result = calculateRetirementDeduction(20, 0)
    expect(result.deductionYears).toBe(20)
    expect(result.deductionAmount).toBe(8_000_000)
    expect(result.formulaLabel).toBe('40万円 × 20年')
  })

  it('30年0か月の場合', () => {
    const result = calculateRetirementDeduction(30, 0)
    expect(result.deductionYears).toBe(30)
    expect(result.deductionAmount).toBe(15_000_000)
    expect(result.formulaLabel).toBe('800万円 + 70万円 ×（30年 − 20年）')
  })

  it('1年未満の端数がある場合は切り上げて計算する（12年6か月→13年）', () => {
    const result = calculateRetirementDeduction(12, 6)
    expect(result.deductionYears).toBe(13)
    expect(result.deductionAmount).toBe(5_200_000)
  })
})

describe('formatManYen', () => {
  it('円を万円単位の表示に変換する', () => {
    expect(formatManYen(4_000_000)).toBe('400万円')
    expect(formatManYen(8_700_000)).toBe('870万円')
  })

  it('端数は四捨五入する', () => {
    expect(formatManYen(1_234_567)).toBe('123万円')
  })
})

describe('calculateEquivalentYears', () => {
  it('前職の退職金額を40万円で割った年数（端数切り捨て）を返す', () => {
    expect(calculateEquivalentYears(1_000_000)).toBe(2)
    expect(calculateEquivalentYears(4_000_000)).toBe(10)
    expect(calculateEquivalentYears(8_000_000)).toBe(20)
  })

  it('1年未満の端数は切り捨てる（最低年数の補正はしない）', () => {
    expect(calculateEquivalentYears(399_999)).toBe(0)
    expect(calculateEquivalentYears(0)).toBe(0)
  })
})
