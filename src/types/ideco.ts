// public/data/ideco.json の形と対応する型。
// 「会社員に企業年金があるかどうか」で拠出限度額の区分が変わることが
// コード上でも分かるように、groupを 'employee-with-pension' などで分けている。
export type ParticipantGroup =
  'self-employed' | 'employee-no-pension' | 'employee-with-pension' | 'dependent-spouse' | 'senior'

export interface ParticipantCategory {
  id: string
  group: ParticipantGroup
  label: string
  monthlyLimit: number
  note: string
}

export interface RuleSet {
  label: string
  effectiveFrom: string
  categories: ParticipantCategory[]
}

export interface SourceRef {
  name: string
  url: string
}

export interface IdecoData {
  sources: SourceRef[]
  currentRules: RuleSet
  futureRules: RuleSet
}
