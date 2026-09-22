import type { ParticipantCategory, ParticipantGroup, RuleSet } from '../types/ideco'

export interface SimulationInput {
  hasCompanyPension: boolean
  hasCorporateDc: boolean
  monthlyAmount: number
  annualIncome: number
}

// iDeCoの加入可能年齢（厚生労働省の情報にもとづく）。
// 現行制度・2026年12月以降の制度改正後のどちらでも20歳未満は加入対象外のため下限とする。
// 上限は2026年12月の改正後の70歳未満（60歳以上70歳未満の加入者区分が新設される）を採用し、
// 「60歳以上は加入不可」という現行制度基準の単純な判定にはしない。
// 参考: 厚生労働省「iDeCoの加入可能年齢の見直し」https://www.mhlw.go.jp/stf/nenkin_shikumi_015.html
export const MIN_IDECO_AGE = 20
export const MAX_IDECO_AGE_EXCLUSIVE = 70

// 入力途中の空文字をそのまま返し、0への強制変換はしない。
// 整数の数字列（マイナスの符号を含む）のみを数値として扱う。
export function parseIntegerInput(raw: string): number | null {
  if (raw.trim() === '') {
    return null
  }
  if (!/^-?\d+$/.test(raw)) {
    return null
  }
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

// 入力欄に貼り付け・入力されたカンマを取り除く。
// parseIntegerInputや各validate関数には、この関数でカンマを除いた
// 「カンマなしの数字列」を渡す（計算・検証には影響させない）。
export function stripCommas(value: string): string {
  return value.replace(/,/g, '')
}

// カンマなしの数字列（入力途中の空文字・マイナス符号を含む）を、
// 表示用に3桁区切りのカンマ付き文字列にする。
// あくまで表示専用で、状態として保持する値・計算に使う値はカンマなしのまま変えない。
export function formatIntegerInputWithCommas(raw: string): string {
  if (raw === '' || raw === '-') {
    return raw
  }
  const negative = raw.startsWith('-')
  const digits = negative ? raw.slice(1) : raw
  if (digits === '' || !/^\d+$/.test(digits)) {
    return raw
  }
  const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return negative ? `-${withCommas}` : withCommas
}

export function validateAgeInput(raw: string): string | null {
  if (raw.trim() === '') {
    return '年齢を入力してください。'
  }
  if (!/^-?\d+$/.test(raw)) {
    return '年齢は整数で入力してください。'
  }
  const age = Number(raw)
  if (age < 0) {
    return '年齢は0以上で入力してください。'
  }
  if (age < MIN_IDECO_AGE) {
    return `iDeCoは${MIN_IDECO_AGE}歳以上の方が加入対象です。`
  }
  if (age >= MAX_IDECO_AGE_EXCLUSIVE) {
    return `iDeCoは${MAX_IDECO_AGE_EXCLUSIVE}歳未満の方が加入対象です。`
  }
  return null
}

export function validateAnnualIncomeInput(raw: string): string | null {
  if (raw.trim() === '') {
    return '年収を入力してください。'
  }
  if (!/^-?\d+$/.test(raw)) {
    return '年収は整数（円単位）で入力してください。'
  }
  const income = Number(raw)
  if (income < 0) {
    return '年収は0円以上で入力してください。'
  }
  return null
}

// 毎月の掛金額の入力チェック。年齢・年収のバリデーションと同じ考え方で実装している。
// monthlyLimitは、現在選択されている年齢・企業年金の状況から算出された拠出限度額
// （pickParticipantGroup/findCategoryの結果）をそのまま渡す。上限値をここで新たに
// ハードコードすることはしない。monthlyLimitがまだ算出できない場合（データ未取得・
// 該当区分なしの場合）はnullを渡すと、上限チェックはスキップされる。
export function validateMonthlyAmountInput(
  raw: string,
  monthlyLimit: number | null,
): string | null {
  if (raw.trim() === '') {
    return '掛金額を入力してください。'
  }
  if (!/^-?\d+$/.test(raw)) {
    return '掛金額は整数（円単位）で入力してください。'
  }
  const amount = Number(raw)
  if (amount < 0) {
    return '掛金額は0円以上で入力してください。'
  }
  if (monthlyLimit !== null && amount > monthlyLimit) {
    return `掛金額は月額${monthlyLimit.toLocaleString()}円以下で入力してください。`
  }
  return null
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
