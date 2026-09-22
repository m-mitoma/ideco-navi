import { describe, expect, it } from 'vitest'
import {
  buildFormulaLabel,
  calculateDeductionAmount,
  calculateEnrollmentYears,
  calculateEquivalentYears,
  calculateOverlapAdjustment,
  calculateRetirementDeduction,
  calculateTaxableRetirementIncome,
  determineReceiveOrder,
  formatManYen,
  isWithinOverlapAdjustmentPeriod,
  monthsToDeductionYears,
  validateAgeRangeInput,
  validateIdecoLumpSumAmountInput,
  validatePastPaymentAgeInput,
  validatePastPaymentAmountInput,
  validatePastPaymentServiceYearsInput,
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

  it('20年1か月相当（20年0か月の翌月、端数切り上げで21年）の場合', () => {
    const result = calculateRetirementDeduction(20, 1)
    expect(result.deductionYears).toBe(21)
    expect(result.deductionAmount).toBe(8_700_000)
    expect(result.formulaLabel).toBe('800万円 + 70万円 ×（21年 − 20年）')
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

describe('calculateEquivalentYears（所令70条・表2）', () => {
  it('800万円以下の場合、金額 ÷ 40万円（端数切り捨て）を返す', () => {
    expect(calculateEquivalentYears(1_000_000)).toBe(2)
    expect(calculateEquivalentYears(4_000_000)).toBe(10)
    expect(calculateEquivalentYears(8_000_000)).toBe(20)
  })

  it('1年未満の端数は切り捨てる（最低年数の補正はしない）', () => {
    expect(calculateEquivalentYears(399_999)).toBe(0)
    expect(calculateEquivalentYears(0)).toBe(0)
  })

  it('800万円を超える場合、(金額－800万円) ÷ 70万円 + 20年（端数切り捨て）を返す', () => {
    // (1500万円－800万円)÷70万円+20年 = 700万円÷70万円+20年 = 10+20 = 30年
    expect(calculateEquivalentYears(15_000_000)).toBe(30)
  })

  it('800万円ちょうどの境界で2つの式が連続する（不連続な段差が生じない）', () => {
    expect(calculateEquivalentYears(8_000_000)).toBe(20)
    // 800万円を1円超えても急に大きく変わらない（端数切り捨てのため800万円の場合と同じ20年）
    expect(calculateEquivalentYears(8_000_001)).toBe(20)
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

describe('validatePastPaymentServiceYearsInput', () => {
  it('空欄はエラーになる', () => {
    expect(validatePastPaymentServiceYearsInput('', 45)).toBe('勤続期間を入力してください。')
  })

  it('0以下はエラーになる', () => {
    expect(validatePastPaymentServiceYearsInput('0', 45)).toBe('勤続期間は1年以上で入力してください。')
  })

  it('60年を超えるとエラーになる', () => {
    expect(validatePastPaymentServiceYearsInput('61', 45)).toBe(
      '勤続期間が想定範囲（60年）を超えています。入力内容をご確認ください。',
    )
  })

  it('受け取った年齢を超える勤続期間はエラーになる', () => {
    expect(validatePastPaymentServiceYearsInput('50', 45)).toBe(
      '勤続期間が受け取った年齢を超えています。入力内容をご確認ください。',
    )
  })

  it('小数・文字列はエラーになる', () => {
    expect(validatePastPaymentServiceYearsInput('10.5', 45)).toBe(
      '勤続期間は0以上の整数（年）で入力してください。',
    )
  })

  it('正常な勤続期間はエラーにならない', () => {
    expect(validatePastPaymentServiceYearsInput('10', 45)).toBeNull()
    expect(validatePastPaymentServiceYearsInput('45', 45)).toBeNull()
  })
})

describe('determineReceiveOrder', () => {
  it('過去の退職金の年齢がiDeCoの受取年齢以前なら過去の退職金が先（past-then-ideco）', () => {
    expect(determineReceiveOrder(45, 60)).toBe('past-then-ideco')
    expect(determineReceiveOrder(60, 60)).toBe('past-then-ideco')
  })

  it('過去の退職金の年齢がiDeCoの受取年齢より後ならiDeCoが先（ideco-then-past）', () => {
    expect(determineReceiveOrder(65, 60)).toBe('ideco-then-past')
  })
})

describe('isWithinOverlapAdjustmentPeriod', () => {
  it('ケースA（会社の退職金→iDeCo）は19年以内であれば対象になる（境界値）', () => {
    expect(isWithinOverlapAdjustmentPeriod(41, 60)).toBe(true) // 60-41=19年
  })

  it('ケースAは19年を超えると対象外になる（境界値）', () => {
    expect(isWithinOverlapAdjustmentPeriod(40, 60)).toBe(false) // 60-40=20年
  })

  it('ケースB（iDeCo→会社の退職金）は9年以内であれば対象になる（境界値）', () => {
    expect(isWithinOverlapAdjustmentPeriod(69, 60)).toBe(true) // 69-60=9年
  })

  it('ケースBは9年を超えると対象外になる（境界値）', () => {
    expect(isWithinOverlapAdjustmentPeriod(70, 60)).toBe(false) // 70-60=10年
  })
})

describe('calculateOverlapAdjustment', () => {
  it('過去の退職金なし（空配列）は調整なしになる', () => {
    const result = calculateOverlapAdjustment([], 30, 60)
    expect(result.qualifyingCount).toBe(0)
    expect(result.overlapDeduction).toBe(0)
    expect(result.hasFuturePaymentNotice).toBe(false)
  })

  it('過去の退職金の勤続期間がiDeCoの加入期間と重複しない場合は調整なし', () => {
    // 過去の退職金: 25歳で受給、勤続5年（20歳〜25歳）。iDeCo加入期間は30歳〜60歳で重複しない。
    const result = calculateOverlapAdjustment([{ age: 25, amount: 2_000_000, serviceYears: 5 }], 30, 60)
    expect(result.totalOverlapYears).toBe(0)
    expect(result.overlapDeduction).toBe(0)
  })

  it('過去の勤続期間が全期間iDeCoの加入期間と重複する場合、その年数がそのまま重複年数になる', () => {
    // 過去の退職金: 45歳で受給、勤続10年（35歳〜45歳）。500万円は10年の通常控除(400万円)を上回るため、
    // みなし期間の特例は適用されず、実際の勤続期間がそのまま使われる。
    const result = calculateOverlapAdjustment(
      [{ age: 45, amount: 5_000_000, serviceYears: 10 }],
      30,
      60,
    )
    expect(result.qualifyingCount).toBe(1)
    expect(result.totalOverlapYears).toBe(10)
    expect(result.overlapDeduction).toBe(4_000_000)
  })

  it('受取額がその勤続期間の通常の控除額を下回る場合、金額から逆算した年数（表2）に短縮される', () => {
    // 過去の退職金: 45歳で受給、勤続30年（15歳〜45歳、テスト用の値）。
    // 30年の通常控除は1500万円だが、受取額は200万円で大幅に下回るため、
    // みなし期間 = 200万円 ÷ 40万円 = 5年（40歳〜45歳）に短縮される。
    const result = calculateOverlapAdjustment(
      [{ age: 45, amount: 2_000_000, serviceYears: 30 }],
      30,
      60,
    )
    expect(result.details[0].deemedServiceYears).toBe(5)
    // みなし期間40歳〜45歳は、iDeCo加入期間30歳〜60歳に完全に含まれる → 重複5年
    expect(result.totalOverlapYears).toBe(5)
    expect(result.overlapDeduction).toBe(2_000_000)
  })

  it('重複年数はiDeCoの加入期間の年数を上限とする', () => {
    // 過去の退職金2件、それぞれの重複年数を合計するとiDeCo加入期間（10年）を超えるケース
    const result = calculateOverlapAdjustment(
      [
        { age: 35, amount: 4_000_000, serviceYears: 10 }, // 25〜35歳、iDeCo期間(30〜40)との重複5年
        { age: 40, amount: 4_000_000, serviceYears: 10 }, // 30〜40歳、iDeCo期間(30〜40)との重複10年
      ],
      30,
      40,
    )
    expect(result.totalOverlapYears).toBe(10) // 5+10=15だが、加入期間10年が上限
  })

  it('19年を超えて過去に受け取った退職金は対象外になる（境界値）', () => {
    const outOfRange = calculateOverlapAdjustment(
      [{ age: 40, amount: 1_000_000, serviceYears: 5 }],
      20,
      60,
    ) // 60-40=20年 > 19年
    expect(outOfRange.qualifyingCount).toBe(0)
    expect(outOfRange.overlapDeduction).toBe(0)
  })

  it('ケースB：iDeCoの後、前年以前9年内に会社の退職金を受け取る場合は、今回のiDeCo控除額には影響しないが案内フラグが立つ', () => {
    const result = calculateOverlapAdjustment(
      [{ age: 65, amount: 5_000_000, serviceYears: 10 }], // iDeCo受取(60歳)の5年後
      30,
      60,
    )
    expect(result.qualifyingCount).toBe(0)
    expect(result.totalOverlapYears).toBe(0)
    expect(result.overlapDeduction).toBe(0)
    expect(result.hasFuturePaymentNotice).toBe(true)
    expect(result.details[0].receiveOrder).toBe('ideco-then-past')
    expect(result.details[0].affectsCurrentDeduction).toBe(false)
  })

  it('ケースB：9年を超えて後に受け取る場合は案内フラグも立たない', () => {
    const result = calculateOverlapAdjustment(
      [{ age: 70, amount: 5_000_000, serviceYears: 10 }], // iDeCo受取(60歳)の10年後
      30,
      60,
    )
    expect(result.hasFuturePaymentNotice).toBe(false)
  })

  it('複数件登録した場合、各件が独立して判定され、対象になったものだけが合算される', () => {
    const result = calculateOverlapAdjustment(
      [
        { age: 45, amount: 5_000_000, serviceYears: 10 }, // 60-45=15年 ≦ 19年 → 対象
        { age: 48, amount: 1_000_000, serviceYears: 3 }, // 60-48=12年 ≦ 19年 → 対象
      ],
      30,
      60,
    )
    expect(result.qualifyingCount).toBe(2)
  })

  it('19年より前の退職金は判定自体から除外され、重複計算に含まれない', () => {
    const result = calculateOverlapAdjustment(
      [
        { age: 45, amount: 5_000_000, serviceYears: 10 }, // 対象
        { age: 20, amount: 1_000_000, serviceYears: 5 }, // 60-20=40年 > 19年 → 対象外
      ],
      30,
      60,
    )
    expect(result.qualifyingCount).toBe(1)
    expect(result.totalOverlapYears).toBe(10)
  })
})

describe('validateIdecoLumpSumAmountInput', () => {
  it('空欄はエラーになる', () => {
    expect(validateIdecoLumpSumAmountInput('')).toBe('iDeCo一時金の受取額を入力してください。')
  })

  it('マイナス値はエラーになる', () => {
    expect(validateIdecoLumpSumAmountInput('-1000000')).toBe(
      'iDeCo一時金の受取額は0円以上で入力してください。',
    )
  })

  it('0円はエラーにならない（既存の金額入力の方針を踏襲）', () => {
    expect(validateIdecoLumpSumAmountInput('0')).toBeNull()
  })

  it('小数・文字列はエラーになる', () => {
    expect(validateIdecoLumpSumAmountInput('1500.5')).toBe(
      'iDeCo一時金の受取額は整数（円単位）で入力してください。',
    )
    expect(validateIdecoLumpSumAmountInput('abc')).toBe(
      'iDeCo一時金の受取額は整数（円単位）で入力してください。',
    )
  })

  it('正常な金額はエラーにならない', () => {
    expect(validateIdecoLumpSumAmountInput('15000000')).toBeNull()
  })
})

describe('calculateTaxableRetirementIncome', () => {
  it('ケース1: iDeCo一時金1,500万円・退職所得控除1,420万円 → 残額80万円・課税退職所得金額40万円', () => {
    const result = calculateTaxableRetirementIncome(15_000_000, 14_200_000)
    expect(result.remainingAmount).toBe(800_000)
    expect(result.taxableRetirementIncome).toBe(400_000)
  })

  it('ケース2: iDeCo一時金1,000万円・退職所得控除1,420万円（下回る） → 残額0円・課税退職所得金額0円', () => {
    const result = calculateTaxableRetirementIncome(10_000_000, 14_200_000)
    expect(result.remainingAmount).toBe(0)
    expect(result.taxableRetirementIncome).toBe(0)
  })

  it('ケース3: iDeCo一時金1,420万円・退職所得控除1,420万円（ちょうど同額） → 残額0円・課税退職所得金額0円', () => {
    const result = calculateTaxableRetirementIncome(14_200_000, 14_200_000)
    expect(result.remainingAmount).toBe(0)
    expect(result.taxableRetirementIncome).toBe(0)
  })

  it('ケース4: iDeCo一時金2,000万円・退職所得控除1,420万円 → 残額580万円・課税退職所得金額290万円', () => {
    const result = calculateTaxableRetirementIncome(20_000_000, 14_200_000)
    expect(result.remainingAmount).toBe(5_800_000)
    expect(result.taxableRetirementIncome).toBe(2_900_000)
  })

  it('残額がマイナスになる場合でも0円未満にはならない（マイナス表示をしない）', () => {
    const result = calculateTaxableRetirementIncome(0, 14_200_000)
    expect(result.remainingAmount).toBe(0)
    expect(result.taxableRetirementIncome).toBe(0)
  })

  it('残額が奇数円の場合、1/2の端数は切り捨てる', () => {
    const result = calculateTaxableRetirementIncome(14_200_001, 14_200_000)
    expect(result.remainingAmount).toBe(1)
    expect(result.taxableRetirementIncome).toBe(0)
  })
})
