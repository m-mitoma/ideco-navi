import SectionHeading from '../common/SectionHeading'
import AsyncState from '../common/AsyncState'
import type { IdecoData, ParticipantGroup } from '../../types/ideco'
import './ComparisonSection.css'

interface ComparisonSectionProps {
  id?: string
  data: IdecoData | null
  isLoading: boolean
  error: string | null
}

// 比較表に出す順番（会社員を中心に、自営業等は最後にまとめる）
const rowOrder: { group: ParticipantGroup; rowLabel: string }[] = [
  { group: 'employee-no-pension', rowLabel: '会社員（企業年金なし）' },
  { group: 'employee-with-pension', rowLabel: '会社員（企業型DC・DBなどの企業年金あり）' },
  { group: 'self-employed', rowLabel: '自営業者・フリーランス等' },
]

function ComparisonSection({ id, data, isLoading, error }: ComparisonSectionProps) {
  return (
    <section id={id} className="section comparison-section">
      <div className="container">
        <SectionHeading>現在と2026年12月以降の比較</SectionHeading>
        <p className="comparison-intro">
          会社員の場合、企業年金等の加入状況によってiDeCoの拠出限度額が異なります。
          企業年金がある場合は、iDeCoと企業年金の掛金を合計した金額が上限の範囲内になります。
        </p>

        {isLoading && <AsyncState type="loading" message="制度データを読み込んでいます…" />}
        {error && <AsyncState type="error" message={error} />}

        {!isLoading && !error && data && (
          <div className="table-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>区分</th>
                  <th>現在（2024年12月〜）</th>
                  <th>2026年12月1日以降</th>
                </tr>
              </thead>
              <tbody>
                {rowOrder.map((row) => {
                  const current = data.currentRules.categories.find(
                    (category) => category.group === row.group,
                  )
                  const future = data.futureRules.categories.find(
                    (category) => category.group === row.group,
                  )

                  return (
                    <tr key={row.group}>
                      <td>{row.rowLabel}</td>
                      <td>{current ? `月額${current.monthlyLimit.toLocaleString()}円` : '—'}</td>
                      <td className="comparison-future-cell">
                        {future ? `月額${future.monthlyLimit.toLocaleString()}円` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="comparison-note">
          ※正確な金額は、勤務先の企業年金の状況や運営管理機関によって異なります。ご自身の場合は勤務先や運営管理機関にご確認ください。
        </p>
      </div>
    </section>
  )
}

export default ComparisonSection
