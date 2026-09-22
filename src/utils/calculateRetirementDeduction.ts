import type { RetirementDeductionResult } from '../types/retirementDeduction'
import { MAX_IDECO_AGE_EXCLUSIVE, MIN_IDECO_AGE } from './simulateContribution'

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
    LONG_TERM_BASE_AMOUNT + LONG_TERM_UNIT_AMOUNT * (deductionYears - SHORT_TERM_THRESHOLD_YEARS)
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
// 相当する年数（＝退職手当等の額 ÷ 40万円、1年未満の端数は切り捨て）を重複期間の計算に使う。
export function calculateEquivalentYears(priorPaymentAmount: number): number {
  return Math.floor(priorPaymentAmount / SHORT_TERM_UNIT_AMOUNT)
}

// 加入開始年齢・受取予定年齢から加入期間（年数）を自動計算する。
// ユーザーが加入期間そのものを入力する必要をなくすための関数。
export function calculateEnrollmentYears(startAge: number, endAge: number): number {
  return endAge - startAge
}

// 過去に受け取った退職金の金額の入力チェック。
// 空欄をそのまま0円に変換しない（既存の掛金シミュレーターの入力方式と揃えている）。
export function validatePastPaymentAmountInput(raw: string): string | null {
  if (raw.trim() === '') {
    return '退職金額を入力してください。'
  }

  if (!/^-?\d+$/.test(raw)) {
    return '退職金額は整数（円単位）で入力してください。'
  }

  const amount = Number(raw)
  if (amount < 0) {
    return '退職金額は0円以上で入力してください。'
  }

  return null
}

// 過去に退職金を受け取った年齢の入力チェック。
// 年齢の範囲は、このページの加入期間入力と同じiDeCoの加入可能年齢の条件を流用している
// （新たに年齢条件を作らないため）。
export function validatePastPaymentAgeInput(age: number): string | null {
  if (!Number.isInteger(age) || age < MIN_IDECO_AGE || age >= MAX_IDECO_AGE_EXCLUSIVE) {
    return `退職金を受け取った年齢は${MIN_IDECO_AGE}歳以上${MAX_IDECO_AGE_EXCLUSIVE}歳未満で選択してください。`
  }

  return null
}

// 過去に受け取った退職金1件分の入力（受取年齢・退職金額）。
// 「受取回数」は独立した入力項目にせず、この配列の件数を回数として扱う。
export interface PastPayment {
  age: number
  amount: number
}

export interface OverlapAdjustmentResult {
  /** 登録された退職金のうち、前年以前19年内で調整の対象になった件数 */
  qualifyingCount: number
  /** 調整の対象になった退職金額の合計（円） */
  qualifyingAmount: number
  /** 調整の対象になった退職金額の合計に相当する期間（年） */
  equivalentYears: number
  /** 重複期間の調整に使う重複年数（年） */
  overlapYears: number
  /** 重複期間の調整で差し引く金額（円） */
  overlapDeduction: number
}

// 退職所得控除の「重複期間の調整」に使う前年以前の年数（既存の実装で使われていた値を踏襲）。
const OVERLAP_ADJUSTMENT_WITHIN_YEARS = 19

// 過去の退職金の受取が、iDeCoの老齢一時金の受取の「前年以前19年内」かどうか。
// falseの場合はその退職金は重複期間の調整の対象外（国税庁「退職金を受け取ったとき（退職所得）」の
// 調整規定にもとづく）。
export function isWithinOverlapAdjustmentPeriod(
  pastPaymentAge: number,
  currentPaymentAge: number,
): boolean {
  return currentPaymentAge - pastPaymentAge <= OVERLAP_ADJUSTMENT_WITHIN_YEARS
}

// 過去に受け取った退職金（複数件）と、iDeCoの老齢一時金の受取予定年齢から、
// 退職所得控除の「重複期間の調整」を計算する。
//
// 複数件受け取っている場合の扱いについて：
// 公的資料（国税庁No.1420、厚生労働省の調整規定）は「前年以前19年内に他の退職手当等の
// 支払を受けている場合」の調整を示しているが、その対象となる退職手当等が複数ある場合に
// 個々の調整をどう組み合わせるかまでは明記されていない。そのため、受取件数を根拠に
// 控除額を倍加するような独自の計算はせず、前年以前19年内に該当する退職金の「金額」を
// 合算したうえで、既存の単一の退職金に対する調整式（calculateEquivalentYears /
// calculateDeductionAmount）をそのまま適用する（＝件数ではなく実際に受け取った金額の
// 合計にもとづく、既存ロジックの最小限の拡張）。
export function calculateOverlapAdjustment(
  pastPayments: PastPayment[],
  currentPaymentAge: number,
): OverlapAdjustmentResult {
  const qualifyingPayments = pastPayments.filter((payment) =>
    isWithinOverlapAdjustmentPeriod(payment.age, currentPaymentAge),
  )
  const qualifyingAmount = qualifyingPayments.reduce((total, payment) => total + payment.amount, 0)
  const equivalentYears = calculateEquivalentYears(qualifyingAmount)
  const overlapYears = equivalentYears
  // calculateDeductionAmount(0)は「80万円未満は80万円」という最低保証が働いてしまうため、
  // 重複年数が0（対象の退職金がない、または合計額が40万円未満）の場合は差し引く金額も0円にする。
  const overlapDeduction = overlapYears > 0 ? calculateDeductionAmount(overlapYears) : 0

  return {
    qualifyingCount: qualifyingPayments.length,
    qualifyingAmount,
    equivalentYears,
    overlapYears,
    overlapDeduction,
  }
}

// 加入開始年齢・受取予定年齢の入力チェック。
// 年齢の範囲は掛金シミュレーター（simulateContribution.ts）が扱っている
// iDeCoの加入可能年齢の条件（MIN_IDECO_AGE〜MAX_IDECO_AGE_EXCLUSIVE）と揃えている。
// ここで新たに年齢条件を作らないことで、サイト内の制度条件が矛盾しないようにしている。
export function validateAgeRangeInput(startAge: number, endAge: number): string | null {
  if (startAge < MIN_IDECO_AGE || startAge >= MAX_IDECO_AGE_EXCLUSIVE) {
    return `加入開始年齢は${MIN_IDECO_AGE}歳以上${MAX_IDECO_AGE_EXCLUSIVE}歳未満で選択してください。`
  }

  if (endAge < MIN_IDECO_AGE || endAge >= MAX_IDECO_AGE_EXCLUSIVE) {
    return `受取予定年齢は${MIN_IDECO_AGE}歳以上${MAX_IDECO_AGE_EXCLUSIVE}歳未満で選択してください。`
  }

  if (startAge >= endAge) {
    return '受取予定年齢は、加入開始年齢より後の年齢を選択してください。'
  }

  return null
}
