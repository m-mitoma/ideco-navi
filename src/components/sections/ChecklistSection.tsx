import SectionHeading from '../common/SectionHeading'
import './ChecklistSection.css'

interface ChecklistItem {
  id: number
  title: string
  description: string
}

const checklistItems: ChecklistItem[] = [
  {
    id: 1,
    title: '勤務先に企業型DC（企業型確定拠出年金）があるか',
    description: 'ある場合、iDeCoの拠出限度額は企業型DCの掛金額をふまえて決まります。',
  },
  {
    id: 2,
    title: '勤務先にDB（確定給付企業年金）など他の企業年金があるか',
    description: 'DBなどは掛金の上限自体はありませんが、給付水準に応じた金額がiDeCoの枠に影響します。',
  },
  {
    id: 3,
    title: '企業型DCに「マッチング拠出」の制度があるか',
    description: 'マッチング拠出がある場合、マッチング拠出とiDeCoのどちらかを選ぶ仕組みになっています。',
  },
  {
    id: 4,
    title: '現在の掛金額と、勤務先の事業主掛金額',
    description: '拠出限度額の範囲内かどうかは、事業主の掛金額との合計で判断されます。',
  },
  {
    id: 5,
    title: 'ご自身の年齢（加入可能年齢・受け取り開始年齢）',
    description: '2026年12月からは60歳以上70歳未満の方の加入に関する区分も新設されます。',
  },
]

interface ChecklistSectionProps {
  id?: string
}

function ChecklistSection({ id }: ChecklistSectionProps) {
  return (
    <section id={id} className="section checklist-section">
      <div className="container">
        <SectionHeading>会社員の場合に確認すること</SectionHeading>
        <p className="checklist-intro">
          自分の場合のiDeCoの掛金を考えるには、年収だけでなく、以下の点を確認することが重要です。
        </p>
        <ul className="checklist-list">
          {checklistItems.map((item) => (
            <li key={item.id} className="checklist-item">
              <span className="checklist-icon" aria-hidden="true">
                ✓
              </span>
              <div>
                <p className="checklist-title">{item.title}</p>
                <p className="checklist-description">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default ChecklistSection
