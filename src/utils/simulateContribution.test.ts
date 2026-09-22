import { describe, expect, it } from 'vitest'
import type { RuleSet } from '../types/ideco'
import {
  MAX_IDECO_AGE_EXCLUSIVE,
  MIN_IDECO_AGE,
  calculateAnnualContribution,
  estimateCombinedTaxRate,
  estimateTaxBenefit,
  findCategory,
  formatIntegerInputWithCommas,
  parseIntegerInput,
  pickParticipantGroup,
  stripCommas,
  validateAgeInput,
  validateAnnualIncomeInput,
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

describe('parseIntegerInput', () => {
  it('空文字はnullを返す（0への変換はしない）', () => {
    expect(parseIntegerInput('')).toBeNull()
    expect(parseIntegerInput('  ')).toBeNull()
  })

  it('整数の数字列を数値に変換する', () => {
    expect(parseIntegerInput('40')).toBe(40)
    expect(parseIntegerInput('0')).toBe(0)
    expect(parseIntegerInput('6000000')).toBe(6000000)
  })

  it('マイナスの整数も数値に変換する', () => {
    expect(parseIntegerInput('-10')).toBe(-10)
  })

  it('小数はnullを返す', () => {
    expect(parseIntegerInput('35.5')).toBeNull()
  })

  it('数字以外の文字列はnullを返す', () => {
    expect(parseIntegerInput('abc')).toBeNull()
    expect(parseIntegerInput('1e5')).toBeNull()
  })
})

describe('validateAgeInput', () => {
  it('空欄はエラーになる', () => {
    expect(validateAgeInput('')).toBe('年齢を入力してください。')
  })

  it('マイナス値は「0以上」のエラーになる', () => {
    expect(validateAgeInput('-10')).toBe('年齢は0以上で入力してください。')
    expect(validateAgeInput('-1')).toBe('年齢は0以上で入力してください。')
  })

  it('0歳や20歳未満はiDeCoの加入可能年齢のエラーになる', () => {
    expect(validateAgeInput('0')).toBe(`iDeCoは${MIN_IDECO_AGE}歳以上の方が加入対象です。`)
    expect(validateAgeInput('19')).toBe(`iDeCoは${MIN_IDECO_AGE}歳以上の方が加入対象です。`)
  })

  it('小数はエラーになる', () => {
    expect(validateAgeInput('35.5')).toBe('年齢は整数で入力してください。')
  })

  it('数字以外の文字列はエラーになる', () => {
    expect(validateAgeInput('abc')).toBe('年齢は整数で入力してください。')
  })

  it('20歳以上70歳未満は加入可能年齢の範囲内としてエラーにならない（境界値）', () => {
    expect(validateAgeInput(String(MIN_IDECO_AGE))).toBeNull()
    expect(validateAgeInput('40')).toBeNull()
    expect(validateAgeInput(String(MAX_IDECO_AGE_EXCLUSIVE - 1))).toBeNull()
  })

  it('70歳以上はエラーになるが、単純な「60歳以上は加入不可」にはしない（69歳は許可）', () => {
    expect(validateAgeInput('69')).toBeNull()
    expect(validateAgeInput(String(MAX_IDECO_AGE_EXCLUSIVE))).toBe(
      `iDeCoは${MAX_IDECO_AGE_EXCLUSIVE}歳未満の方が加入対象です。`,
    )
  })
})

describe('validateAnnualIncomeInput', () => {
  it('空欄はエラーになる', () => {
    expect(validateAnnualIncomeInput('')).toBe('年収を入力してください。')
  })

  it('マイナス値はエラーになる', () => {
    expect(validateAnnualIncomeInput('-1000000')).toBe('年収は0円以上で入力してください。')
  })

  it('0円はエラーにならない', () => {
    expect(validateAnnualIncomeInput('0')).toBeNull()
  })

  it('小数はエラーになる', () => {
    expect(validateAnnualIncomeInput('5000000.5')).toBe('年収は整数（円単位）で入力してください。')
  })

  it('数字以外の文字列はエラーになる', () => {
    expect(validateAnnualIncomeInput('abc')).toBe('年収は整数（円単位）で入力してください。')
  })

  it('大きな金額でもエラーにならない', () => {
    expect(validateAnnualIncomeInput('50000000')).toBeNull()
  })
})

describe('formatIntegerInputWithCommas', () => {
  it('3桁ごとにカンマを付ける', () => {
    expect(formatIntegerInputWithCommas('6000000')).toBe('6,000,000')
    expect(formatIntegerInputWithCommas('1000')).toBe('1,000')
    expect(formatIntegerInputWithCommas('100')).toBe('100')
  })

  it('マイナスの数字列にもカンマを付ける', () => {
    expect(formatIntegerInputWithCommas('-1000000')).toBe('-1,000,000')
  })

  it('空文字・マイナス符号のみの入力途中の状態はそのまま返す', () => {
    expect(formatIntegerInputWithCommas('')).toBe('')
    expect(formatIntegerInputWithCommas('-')).toBe('-')
  })
})

describe('stripCommas', () => {
  it('カンマを取り除く', () => {
    expect(stripCommas('6,000,000')).toBe('6000000')
    expect(stripCommas('1,000')).toBe('1000')
  })

  it('カンマがない場合はそのまま返す', () => {
    expect(stripCommas('6000000')).toBe('6000000')
  })
})

describe('カンマ付き表示と計算結果の整合性', () => {
  it('カンマ付きで表示した文字列からカンマを外すと、元の数字列に戻る（表示のフォーマットが計算値を変えない）', () => {
    const raw = '6000000'
    const displayed = formatIntegerInputWithCommas(raw)
    expect(displayed).toBe('6,000,000')
    expect(stripCommas(displayed)).toBe(raw)
    expect(parseIntegerInput(stripCommas(displayed))).toBe(6_000_000)
  })

  it('validateAnnualIncomeInputはカンマなしの生の文字列に対して判定する（表示用フォーマットとは独立している）', () => {
    const raw = '6000000'
    expect(validateAnnualIncomeInput(raw)).toBeNull()
    expect(parseIntegerInput(raw)).toBe(6_000_000)
  })
})
