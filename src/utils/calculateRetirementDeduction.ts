import type { RetirementDeductionResult } from '../types/retirementDeduction'

// 国税庁「No.1420 退職金を受け取ったとき（退職所得）」にもとづく退職所得控除の金額。
// 税制が変わった場合は、この5つの定数とcalculateDeductionAmountの計算式を見直す。
const SHORT_TERM_THRESHOLD_YEARS = 20
const SHORT_TERM_UNIT_AMOUNT = 400_000 // 40万円 × 勤続年数
const SHORT_TERM_MINIMUM_AMOUNT = 800_000 // 80万円未満の場合は80万円
const LONG_TERM_BASE_AMOUNT = 8_000_000 // 800万円
const LONG_TERM_UNIT_AMOUNT = 700_000 // 70万円 ×（勤続年数－20年）

// 入力チェック用の範囲（想定を超える入力をはじくための目安）
const MIN_TOTAL_MONTHS = 1
const MAX_TOTAL_MONTHS = 720 // 60年

export function validateRetirementPeriodInput(years: number, months: number): string | null {
  if (Number.isNaN(years) || Number.isNaN(months)) {
    return '年数・月数は数値で入力してください。'
  }

  if (!Number.isInteger(years) || !Number.isInteger(months)) {
    return '年数・月数は整数で入力してください（小数は使用できません）。'
  }

  if (years < 0 || months < 0) {
    return '年数・月数はマイナスの値を入力できません。'
  }

  if (months > 11) {
    return '月数は0〜11の範囲で入力してください。'
  }

  const totalMonths = years * 12 + months

  if (totalMonths < MIN_TOTAL_MONTHS) {
    return '加入期間を1か月以上で入力してください。'
  }

  if (totalMonths > MAX_TOTAL_MONTHS) {
    return '加入期間が想定範囲（60年）を超えています。入力内容をご確認ください。'
  }

  return null
}

// iDeCoは「勤続年数」ではなく、掛金を拠出した月数をもとに年数を計算する。
// 1年未満の端数は切り上げる（例: 150か月 → 12年6か月 → 13年）。
export function monthsToDeductionYears(totalMonths: number): number {
  return Math.ceil(totalMonths / 12)
}

export function calculateDeductionAmount(deductionYears: number): number {
  if (deductionYears <= SHORT_TERM_THRESHOLD_YEARS) {
    const amount = SHORT_TERM_UNIT_AMOUNT * deductionYears
    return Math.max(amount, SHORT_TERM_MINIMUM_AMOUNT)
  }

  return (
    LONG_TERM_BASE_AMOUNT +
    LONG_TERM_UNIT_AMOUNT * (deductionYears - SHORT_TERM_THRESHOLD_YEARS)
  )
}

export function buildFormulaLabel(deductionYears: number): string {
  if (deductionYears <= SHORT_TERM_THRESHOLD_YEARS) {
    const amount = SHORT_TERM_UNIT_AMOUNT * deductionYears

    if (amount < SHORT_TERM_MINIMUM_AMOUNT) {
      return `40万円 × ${deductionYears}年 = ${(amount / 10000).toLocaleString()}万円 → 最低保証の80万円を適用`
    }

    return `40万円 × ${deductionYears}年`
  }

  return `800万円 + 70万円 ×（${deductionYears}年 − 20年）`
}

export function calculateRetirementDeduction(
  years: number,
  months: number,
): RetirementDeductionResult {
  const totalMonths = years * 12 + months
  const deductionYears = monthsToDeductionYears(totalMonths)

  return {
    deductionYears,
    formulaLabel: buildFormulaLabel(deductionYears),
    deductionAmount: calculateDeductionAmount(deductionYears),
  }
}

export function formatManYen(amountInYen: number): string {
  return `${Math.round(amountInYen / 10000).toLocaleString()}万円`
}

// 「重複期間の調整」で使う考え方: 前に受け取った退職手当等の額が、
// その期間本来の控除額（40万円×年数）を下回るときは、実際に受け取った額に
// 相当する年数（＝退職手当等の額 ÷ 40万円、端数切り上げ、最低2年）を重複期間の計算に使う。
export function calculateEquivalentYears(priorPaymentAmount: number): number {
  const rawYears = Math.ceil(priorPaymentAmount / SHORT_TERM_UNIT_AMOUNT)
  return Math.max(rawYears, 2)
}
