import { describe, expect, it } from 'vitest'
import {
  buildFormulaLabel,
  calculateDeductionAmount,
  calculateEnrollmentYears,
  calculateEquivalentYears,
  calculateOverlapAdjustment,
  calculateRetirementDeduction,
  formatManYen,
  isWithinOverlapAdjustmentPeriod,
  monthsToDeductionYears,
  validateAgeRangeInput,
  validatePastPaymentAgeInput,
  validatePastPaymentAmountInput,
  validateRetirementPeriodInput,
} from './calculateRetirementDeduction'
import { MAX_IDECO_AGE_EXCLUSIVE, MIN_IDECO_AGE } from './simulateContribution'

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

describe('calculateEnrollmentYears', () => {
  it('受取予定年齢から加入開始年齢を引いた年数を返す', () => {
    expect(calculateEnrollmentYears(30, 60)).toBe(30)
    expect(calculateEnrollmentYears(35, 60)).toBe(25)
    expect(calculateEnrollmentYears(40, 65)).toBe(25)
  })
})

describe('validateAgeRangeInput', () => {
  it('加入開始年齢が受取予定年齢より前であればnullを返す', () => {
    expect(validateAgeRangeInput(30, 60)).toBeNull()
    expect(validateAgeRangeInput(MIN_IDECO_AGE, MIN_IDECO_AGE + 1)).toBeNull()
  })

  it('加入開始年齢と受取予定年齢が同じ場合はエラーになる', () => {
    expect(validateAgeRangeInput(40, 40)).toBe(
      '受取予定年齢は、加入開始年齢より後の年齢を選択してください。',
    )
  })

  it('加入開始年齢が受取予定年齢より後の場合はエラーになる', () => {
    expect(validateAgeRangeInput(60, 30)).toBe(
      '受取予定年齢は、加入開始年齢より後の年齢を選択してください。',
    )
  })

  it('加入開始年齢が加入可能年齢の下限未満だとエラーになる', () => {
    expect(validateAgeRangeInput(MIN_IDECO_AGE - 1, 60)).toBe(
      `加入開始年齢は${MIN_IDECO_AGE}歳以上${MAX_IDECO_AGE_EXCLUSIVE}歳未満で選択してください。`,
    )
  })

  it('受取予定年齢が加入可能年齢の上限以上だとエラーになる', () => {
    expect(validateAgeRangeInput(30, MAX_IDECO_AGE_EXCLUSIVE)).toBe(
      `受取予定年齢は${MIN_IDECO_AGE}歳以上${MAX_IDECO_AGE_EXCLUSIVE}歳未満で選択してください。`,
    )
  })

  it('加入可能年齢の最小値・最大値（境界値）ではエラーにならない', () => {
    expect(validateAgeRangeInput(MIN_IDECO_AGE, MAX_IDECO_AGE_EXCLUSIVE - 1)).toBeNull()
  })
})

describe('加入開始年齢・受取予定年齢から自動計算した加入期間を退職所得控除額計算へ渡す', () => {
  it('加入期間20年（短期の計算式の境界）', () => {
    const years = calculateEnrollmentYears(40, 60)
    expect(years).toBe(20)
    const result = calculateRetirementDeduction(years, 0)
    expect(result.deductionYears).toBe(20)
    expect(result.deductionAmount).toBe(8_000_000)
    expect(result.formulaLabel).toBe('40万円 × 20年')
  })

  it('加入期間21年（長期の計算式に切り替わる境界）', () => {
    const years = calculateEnrollmentYears(39, 60)
    expect(years).toBe(21)
    const result = calculateRetirementDeduction(years, 0)
    expect(result.deductionYears).toBe(21)
    expect(result.deductionAmount).toBe(8_700_000)
    expect(result.formulaLabel).toBe('800万円 + 70万円 ×（21年 − 20年）')
  })

  it('加入期間40年（想定される最大級の加入期間）', () => {
    const years = calculateEnrollmentYears(20, 60)
    expect(years).toBe(40)
    const result = calculateRetirementDeduction(years, 0)
    expect(result.deductionYears).toBe(40)
    expect(result.deductionAmount).toBe(22_000_000)
    expect(result.formulaLabel).toBe('800万円 + 70万円 ×（40年 − 20年）')
  })
})

describe('validatePastPaymentAmountInput', () => {
  it('空欄はエラーになる', () => {
    expect(validatePastPaymentAmountInput('')).toBe('退職金額を入力してください。')
  })

  it('マイナス値はエラーになる', () => {
    expect(validatePastPaymentAmountInput('-1000000')).toBe('退職金額は0円以上で入力してください。')
  })

  it('0円はエラーにならない', () => {
    expect(validatePastPaymentAmountInput('0')).toBeNull()
  })

  it('小数・文字列はエラーになる', () => {
    expect(validatePastPaymentAmountInput('500.5')).toBe(
      '退職金額は整数（円単位）で入力してください。',
    )
    expect(validatePastPaymentAmountInput('abc')).toBe(
      '退職金額は整数（円単位）で入力してください。',
    )
  })

  it('500万円・1000万円などの正常な金額はエラーにならない', () => {
    expect(validatePastPaymentAmountInput('5000000')).toBeNull()
    expect(validatePastPaymentAmountInput('10000000')).toBeNull()
  })
})

describe('validatePastPaymentAgeInput', () => {
  it('iDeCoの加入可能年齢の範囲内であればエラーにならない', () => {
    expect(validatePastPaymentAgeInput(45)).toBeNull()
    expect(validatePastPaymentAgeInput(50)).toBeNull()
    expect(validatePastPaymentAgeInput(60)).toBeNull()
  })

  it('範囲外の年齢はエラーになる', () => {
    expect(validatePastPaymentAgeInput(MIN_IDECO_AGE - 1)).not.toBeNull()
    expect(validatePastPaymentAgeInput(MAX_IDECO_AGE_EXCLUSIVE)).not.toBeNull()
  })
})

describe('isWithinOverlapAdjustmentPeriod', () => {
  it('19年以内であれば対象になる（境界値）', () => {
    expect(isWithinOverlapAdjustmentPeriod(41, 60)).toBe(true) // 60-41=19年
  })

  it('19年を超えると対象外になる（境界値）', () => {
    expect(isWithinOverlapAdjustmentPeriod(40, 60)).toBe(false) // 60-40=20年
  })
})

describe('calculateOverlapAdjustment', () => {
  it('退職金を1件登録した場合、その受取年齢・退職金額が計算に反映される', () => {
    // 60歳-45歳=15年 ≦ 19年 → 調整の対象
    const result = calculateOverlapAdjustment([{ age: 45, amount: 1_000_000 }], 60)
    expect(result.qualifyingCount).toBe(1)
    expect(result.qualifyingAmount).toBe(1_000_000)
    expect(result.equivalentYears).toBe(2)
    expect(result.overlapYears).toBe(2)
    expect(result.overlapDeduction).toBe(800_000)
  })

  it('受取年齢50歳を入力した場合、50歳が計算に反映される（45歳のケースと独立して判定できる）', () => {
    // 60歳-50歳=10年 ≦ 19年 → 調整の対象
    const result = calculateOverlapAdjustment([{ age: 50, amount: 1_000_000 }], 60)
    expect(result.qualifyingCount).toBe(1)
    expect(result.overlapYears).toBe(2)
  })

  it('受取年齢が19年を超えて離れている場合は、その退職金は調整の対象外になる（境界値）', () => {
    // 60歳-41歳=19年 ≦ 19年 → 対象
    const withinRange = calculateOverlapAdjustment([{ age: 41, amount: 1_000_000 }], 60)
    expect(withinRange.qualifyingCount).toBe(1)
    // 60歳-40歳=20年 > 19年 → 対象外
    const outOfRange = calculateOverlapAdjustment([{ age: 40, amount: 1_000_000 }], 60)
    expect(outOfRange.qualifyingCount).toBe(0)
    expect(outOfRange.overlapYears).toBe(0)
    expect(outOfRange.overlapDeduction).toBe(0)
  })

  it('退職金額500万円の場合、相当する期間・差し引く金額に反映される', () => {
    const result = calculateOverlapAdjustment([{ age: 45, amount: 5_000_000 }], 60)
    expect(result.equivalentYears).toBe(12)
    expect(result.overlapDeduction).toBe(4_800_000)
  })

  it('退職金額1,000万円の場合、相当する期間・差し引く金額に反映される（長期の計算式に切り替わる）', () => {
    const result = calculateOverlapAdjustment([{ age: 45, amount: 10_000_000 }], 60)
    expect(result.equivalentYears).toBe(25)
    expect(result.overlapDeduction).toBe(11_500_000)
  })

  it('退職金額0円の場合、差し引く金額は0円になる（80万円の最低保証は適用しない）', () => {
    const result = calculateOverlapAdjustment([{ age: 45, amount: 0 }], 60)
    expect(result.equivalentYears).toBe(0)
    expect(result.overlapYears).toBe(0)
    expect(result.overlapDeduction).toBe(0)
  })

  it('登録がない場合（空配列）は調整なしになる', () => {
    const result = calculateOverlapAdjustment([], 60)
    expect(result.qualifyingCount).toBe(0)
    expect(result.overlapDeduction).toBe(0)
  })

  it('退職金を2件登録した場合、両方のデータが計算に使用される', () => {
    // 退職金1: 45歳・500万円（60-45=15年 ≦ 19年 → 対象）
    // 退職金2: 52歳・100万円（60-52=8年 ≦ 19年 → 対象）
    const result = calculateOverlapAdjustment(
      [
        { age: 45, amount: 5_000_000 },
        { age: 52, amount: 1_000_000 },
      ],
      60,
    )
    expect(result.qualifyingCount).toBe(2)
    expect(result.qualifyingAmount).toBe(6_000_000)
    // 相当する期間: 600万円 ÷ 40万円 = 15年
    expect(result.equivalentYears).toBe(15)
    expect(result.overlapDeduction).toBe(6_000_000)
  })

  it('3件以上登録した場合も、19年以内のものだけが合算される', () => {
    const result = calculateOverlapAdjustment(
      [
        { age: 45, amount: 1_000_000 }, // 60-45=15年 → 対象
        { age: 52, amount: 1_000_000 }, // 60-52=8年 → 対象
        { age: 30, amount: 1_000_000 }, // 60-30=30年 → 対象外
      ],
      60,
    )
    expect(result.qualifyingCount).toBe(2)
    expect(result.qualifyingAmount).toBe(2_000_000)
  })

  it('1件だけ削除しても、残りのデータで正しく再計算される', () => {
    const before = calculateOverlapAdjustment(
      [
        { age: 45, amount: 5_000_000 },
        { age: 52, amount: 1_000_000 },
      ],
      60,
    )
    // 2件目を削除した状態を再現
    const after = calculateOverlapAdjustment([{ age: 45, amount: 5_000_000 }], 60)

    expect(before.qualifyingCount).toBe(2)
    expect(after.qualifyingCount).toBe(1)
    expect(after.qualifyingAmount).toBe(5_000_000)
    expect(after).not.toEqual(before)
  })

  it('受取年齢・退職金額を変えると、計算に使用される値がコード内の固定値ではなく入力値に連動する', () => {
    const caseA = calculateOverlapAdjustment([{ age: 30, amount: 4_000_000 }], 65)
    const caseB = calculateOverlapAdjustment([{ age: 50, amount: 8_000_000 }], 55)

    // 30歳受給・65歳受取: 65-30=35年 > 19年 → 対象外
    expect(caseA.qualifyingCount).toBe(0)
    expect(caseA.overlapDeduction).toBe(0)

    // 50歳受給・55歳受取: 55-50=5年 ≦ 19年 → 対象、相当する期間は8,000,000÷40万円=20年
    expect(caseB.qualifyingCount).toBe(1)
    expect(caseB.equivalentYears).toBe(20)
    expect(caseB.overlapDeduction).toBe(8_000_000)

    // 同じ「45歳」を使っていれば起きないはずの違いが出ることを確認
    expect(caseA).not.toEqual(caseB)
  })
})
