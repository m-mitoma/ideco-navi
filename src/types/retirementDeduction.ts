// 退職所得控除シミュレーターの入力・結果の型。
// 税制が変わった場合は utils/calculateRetirementDeduction.ts 側のロジックだけを直せばよいように、
// ここでは「形」だけを定義している。
export interface RetirementDeductionInput {
  years: number
  months: number
}

export interface RetirementDeductionResult {
  /** 加入年数・月数から算出した「控除計算上の年数」（1年未満は切り上げ） */
  deductionYears: number
  /** 結果の根拠を表示するための計算式の文字列（例: "40万円 × 13年"） */
  formulaLabel: string
  /** 退職所得控除額（円） */
  deductionAmount: number
}
