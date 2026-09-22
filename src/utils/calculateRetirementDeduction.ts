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

// 所得税法施行令70条（表2）にもとづく「前の退職手当等の収入金額に相当する期間」の計算。
// 前の退職手当等の受取額が、その退職手当等について通常計算される退職所得控除額を下回るときに、
// 実際の勤続期間の代わりに使う「みなし期間」を求めるための式（1年未満の端数は切り捨て）。
// 　・800万円以下の場合　　：収入金額 ÷ 40万円
// 　・800万円を超える場合　：(収入金額 − 800万円) ÷ 70万円 + 20年
// 出典: 東京国税局「前の退職手当等が同一年に複数ある場合の退職所得控除額の計算の特例について」
// https://www.nta.go.jp/about/organization/tokyo/bunshokaito/gensenshotoku/240322/01.htm
export function calculateEquivalentYears(priorPaymentAmount: number): number {
  if (priorPaymentAmount <= LONG_TERM_BASE_AMOUNT) {
    return Math.floor(priorPaymentAmount / SHORT_TERM_UNIT_AMOUNT)
  }

  return (
    SHORT_TERM_THRESHOLD_YEARS +
    Math.floor((priorPaymentAmount - LONG_TERM_BASE_AMOUNT) / LONG_TERM_UNIT_AMOUNT)
  )
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

// iDeCo一時金の受取額の入力チェック。
// 空欄をそのまま0円に変換しない・0円自体はエラーにしない、という既存の金額入力
// （validatePastPaymentAmountInput）の方針をそのまま踏襲している。
export function validateIdecoLumpSumAmountInput(raw: string): string | null {
  if (raw.trim() === '') {
    return 'iDeCo一時金の受取額を入力してください。'
  }

  if (!/^-?\d+$/.test(raw)) {
    return 'iDeCo一時金の受取額は整数（円単位）で入力してください。'
  }

  const amount = Number(raw)
  if (amount < 0) {
    return 'iDeCo一時金の受取額は0円以上で入力してください。'
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

// 過去の退職金に対応する勤続期間（年）の入力チェック。
// 重複期間の調整には「金額」だけでなく「その金額に対応する勤続期間」が必要になるため
// （所令70条の特例は、実際の勤続期間と受取額を比較して初めて判定できる）、
// 受け取った年齢・金額とは別にこの入力を設けている。
export function validatePastPaymentServiceYearsInput(raw: string, age: number): string | null {
  if (raw.trim() === '') {
    return '勤続期間を入力してください。'
  }

  if (!/^\d+$/.test(raw)) {
    return '勤続期間は0以上の整数（年）で入力してください。'
  }

  const years = Number(raw)
  if (years < 1) {
    return '勤続期間は1年以上で入力してください。'
  }

  if (years > 60) {
    return '勤続期間が想定範囲（60年）を超えています。入力内容をご確認ください。'
  }

  if (age - years < 0) {
    return '勤続期間が受け取った年齢を超えています。入力内容をご確認ください。'
  }

  return null
}

// 過去に受け取った退職金1件分の入力（受取年齢・退職金額・対応する勤続期間）。
// 「受取回数」は独立した入力項目にせず、この配列の件数を回数として扱う。
export interface PastPayment {
  age: number
  amount: number
  serviceYears: number
}

// 退職金の受取順序。iDeCoの受取（currentPaymentAge）より前か後かで、
// 適用される重複調整のルール・前年以前の年数が異なる（同じ計算式では処理しない）。
export type ReceiveOrder = 'past-then-ideco' | 'ideco-then-past'

// ケースA: 会社の退職金等 → iDeCo一時金。所令70条二にもとづく「前年以前19年内」の調整。
// 出典: 東京国税局「前の退職手当等が同一年に複数ある場合の退職所得控除額の計算の特例について」
const CASE_A_WITHIN_YEARS = 19

// ケースB: iDeCo一時金 → 会社の退職金等。令和7年度税制改正により、
// 「前年以前4年内」から「前年以前9年内」に拡大された（2026年1月1日以後に受け取るiDeCo一時金に適用）。
// 注意: この9年という数値は、令和7年度税制改正を解説する複数の税理士法人等の解説記事で
// 一致して示されている内容にもとづくものであり、国税庁の逐条解説ページなど一次情報での
// 直接の確認はできていない（検索で見つからなかった）。数値の最終確認は税務署・税理士等で行うこと。
const CASE_B_WITHIN_YEARS = 9

// 過去の退職金の受取と、iDeCo一時金の受取の前後関係を判定する。
// 同一年（同じ年齢）の場合は、会社の退職金等が先に支給されたものとして扱う。
export function determineReceiveOrder(
  pastPaymentAge: number,
  currentPaymentAge: number,
): ReceiveOrder {
  return pastPaymentAge <= currentPaymentAge ? 'past-then-ideco' : 'ideco-then-past'
}

// 過去の退職金の受け取りが、iDeCoの受け取りとの関係で「重複期間の調整」の対象になる
// 前年以前の年数内かどうか。受取順序によって19年・9年のいずれかの基準を使う。
export function isWithinOverlapAdjustmentPeriod(
  pastPaymentAge: number,
  currentPaymentAge: number,
): boolean {
  const order = determineReceiveOrder(pastPaymentAge, currentPaymentAge)
  return order === 'past-then-ideco'
    ? currentPaymentAge - pastPaymentAge <= CASE_A_WITHIN_YEARS
    : pastPaymentAge - currentPaymentAge <= CASE_B_WITHIN_YEARS
}

// 前の退職手当等の「勤続期間等」を決める（所令70条・表2の特例）。
// 実際の受取額が、実際の勤続期間から通常計算される退職所得控除額を下回るときは、
// 受取額から逆算した年数（calculateEquivalentYears）を「みなし期間」として使う
// （受給者に不利にならないよう、実際の勤続期間より短くなる場合だけ使う特例のため、
// 　実際の勤続期間を上回ることがないようMath.minで丸める）。
// 下回らないときは、実際の勤続期間をそのまま使う。
function resolveDeemedServiceYears(payment: PastPayment): number {
  const ownDeductionByTenure = calculateDeductionAmount(payment.serviceYears)
  if (payment.amount < ownDeductionByTenure) {
    return Math.min(payment.serviceYears, calculateEquivalentYears(payment.amount))
  }
  return payment.serviceYears
}

// 前の退職金の勤続期間 [受取年齢－みなし期間, 受取年齢) と、
// iDeCoの加入期間 [startAge, currentPaymentAge) の重複年数（区間の交差）を求める。
function calculateOverlapYears(
  pastPaymentAge: number,
  deemedServiceYears: number,
  startAge: number,
  currentPaymentAge: number,
): number {
  const priorStart = pastPaymentAge - deemedServiceYears
  const priorEnd = pastPaymentAge
  const overlapStart = Math.max(priorStart, startAge)
  const overlapEnd = Math.min(priorEnd, currentPaymentAge)
  return Math.max(0, overlapEnd - overlapStart)
}

export interface PastPaymentOverlapDetail {
  payment: PastPayment
  receiveOrder: ReceiveOrder
  isWithinLookbackPeriod: boolean
  /** 今回のiDeCo一時金の控除額に影響するか（ケースA・前年以前19年内のときだけtrue） */
  affectsCurrentDeduction: boolean
  deemedServiceYears: number
  overlapYears: number
}

export interface OverlapAdjustmentResult {
  details: PastPaymentOverlapDetail[]
  /** 今回のiDeCo一時金の控除額に影響する件数 */
  qualifyingCount: number
  /** 重複年数の合計（iDeCoの加入期間の年数が上限） */
  totalOverlapYears: number
  /** 重複期間の調整で差し引く金額（円） */
  overlapDeduction: number
  /** ケースB（iDeCoの後、前年以前9年内に会社の退職金等を受け取る）に該当する登録が1件以上あるか */
  hasFuturePaymentNotice: boolean
}

// 過去に受け取った退職金（複数件）と、iDeCoの加入開始年齢・老齢一時金の受取予定年齢から、
// 退職所得控除の「重複期間の調整」を計算する。
//
// 受取順序の扱いについて：
// 所令70条の調整は「その年に支払を受けた退職手当等」の控除額を、それより前に受け取った
// 退職手当等との重複期間ぶんだけ減らす規定であり、後から支払われる側の控除額だけが調整される。
// そのため、過去の退職金がiDeCoより後（ケースB）の場合、今回のiDeCo一時金の控除額（このページの
// 計算対象）自体は変わらない。ケースBはあくまで「その退職金を受け取る年に、今回のiDeCoの分だけ
// 控除額が調整される可能性がある」という別の計算に関わる情報のため、hasFuturePaymentNoticeとして
// 案内するにとどめ、このページの計算には反映しない（会社の退職金側の控除額計算まで行う設計にはしていない）。
//
// 複数件が対象になる場合の扱いについて：
// 各登録ごとに重複年数を個別に求め、その合計（iDeCoの加入期間の年数を上限とする）に対して
// 退職所得控除の計算式を1回だけ適用する。これは、対象となる退職手当等が複数ある場合の
// 具体的な合算方法までは公的資料に明記されていないための、既存実装からの最小限の拡張である。
export function calculateOverlapAdjustment(
  pastPayments: PastPayment[],
  startAge: number,
  currentPaymentAge: number,
): OverlapAdjustmentResult {
  const details: PastPaymentOverlapDetail[] = pastPayments.map((payment) => {
    const receiveOrder = determineReceiveOrder(payment.age, currentPaymentAge)
    const isWithinLookbackPeriod = isWithinOverlapAdjustmentPeriod(payment.age, currentPaymentAge)
    const deemedServiceYears = resolveDeemedServiceYears(payment)
    const affectsCurrentDeduction = receiveOrder === 'past-then-ideco' && isWithinLookbackPeriod
    const overlapYears = affectsCurrentDeduction
      ? calculateOverlapYears(payment.age, deemedServiceYears, startAge, currentPaymentAge)
      : 0

    return {
      payment,
      receiveOrder,
      isWithinLookbackPeriod,
      affectsCurrentDeduction,
      deemedServiceYears,
      overlapYears,
    }
  })

  const qualifying = details.filter((detail) => detail.affectsCurrentDeduction)
  const enrollmentYears = currentPaymentAge - startAge
  const totalOverlapYears = Math.min(
    qualifying.reduce((sum, detail) => sum + detail.overlapYears, 0),
    Math.max(0, enrollmentYears),
  )
  // calculateDeductionAmount(0)は「80万円未満は80万円」という最低保証が働いてしまうため、
  // 重複年数が0（対象の退職金がない、またはすべて重複なし）の場合は差し引く金額も0円にする。
  const overlapDeduction = totalOverlapYears > 0 ? calculateDeductionAmount(totalOverlapYears) : 0
  const hasFuturePaymentNotice = details.some(
    (detail) => detail.receiveOrder === 'ideco-then-past' && detail.isWithinLookbackPeriod,
  )

  return {
    details,
    qualifyingCount: qualifying.length,
    totalOverlapYears,
    overlapDeduction,
    hasFuturePaymentNotice,
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

export interface TaxableRetirementIncomeResult {
  /** 退職所得控除額を差し引いた後の残額（円）。マイナスにはならず、下限は0円。 */
  remainingAmount: number
  /** 控除後の残額の1/2にあたる課税退職所得金額（円）。所得税額そのものではない。 */
  taxableRetirementIncome: number
}

// iDeCo一時金の受取額と、（重複期間の調整などを反映した）退職所得控除額から、
// 課税退職所得金額を計算する（所法30二: 退職所得の金額 = (収入金額－退職所得控除額) × 1/2）。
// ここで算出するのはあくまで「課税退職所得金額」までで、実際の所得税額・住民税額の計算は
// スコープ外（税率や復興特別所得税、他の所得との合算などは考慮していない）。
export function calculateTaxableRetirementIncome(
  idecoLumpSumAmount: number,
  deductionAmount: number,
): TaxableRetirementIncomeResult {
  const remainingAmount = Math.max(0, idecoLumpSumAmount - deductionAmount)
  // 1円未満の端数が生じないようMath.floorで丸める（実際の税制にある千円未満切り捨てなどの
  // 端数処理までは反映していない）。
  const taxableRetirementIncome = Math.floor(remainingAmount / 2)

  return { remainingAmount, taxableRetirementIncome }
}
