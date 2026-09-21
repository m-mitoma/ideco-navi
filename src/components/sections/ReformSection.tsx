import SectionHeading from '../common/SectionHeading'
import AsyncState from '../common/AsyncState'
import Card from '../common/Card'
import type { IdecoData } from '../../types/ideco'
import './ReformSection.css'

interface ReformSectionProps {
  id?: string
  data: IdecoData | null
  isLoading: boolean
  error: string | null
}

function ReformSection({ id, data, isLoading, error }: ReformSectionProps) {
  const futureCategories = data?.futureRules.categories ?? []
  const employeeCategories = futureCategories.filter(
    (category) =>
      category.group === 'employee-with-pension' || category.group === 'employee-no-pension',
  )
  const otherCategories = futureCategories.filter(
    (category) =>
      category.group !== 'employee-with-pension' && category.group !== 'employee-no-pension',
  )

  return (
    <section id={id} className="section reform-section">
      <div className="container">
        <SectionHeading>2026年12月の制度改正</SectionHeading>
        <p className="reform-intro">
          2026年12月1日から、確定拠出年金（iDeCo・企業型DC）の拠出限度額の見直しと、
          加入できる年齢の拡大が行われます。会社員（第2号加入者）は、
          <strong>企業年金（企業型DC・DBなど）の加入状況によって考え方が変わる</strong>
          ため、まずは自分の場合を確認することが大切です。
        </p>

        {isLoading && <AsyncState type="loading" message="制度データを読み込んでいます…" />}
        {error && <AsyncState type="error" message={error} />}

        {!isLoading && !error && (
          <>
            <h3 className="reform-subheading">会社員（第2号加入者）の場合</h3>
            <div className="reform-grid">
              {employeeCategories.map((category) => (
                <Card key={category.id} className="reform-card">
                  <p className="reform-card-label">{category.label}</p>
                  <p className="reform-card-value">
                    月額 {category.monthlyLimit.toLocaleString()}円
                  </p>
                  {category.note && <p className="reform-card-note">{category.note}</p>}
                </Card>
              ))}
            </div>

            <h3 className="reform-subheading">自営業者・専業主婦（夫）などの場合</h3>
            <ul className="reform-other-list">
              {otherCategories.map((category) => (
                <li key={category.id}>
                  <span className="reform-other-label">{category.label}</span>
                  <span className="reform-other-value">
                    月額 {category.monthlyLimit.toLocaleString()}円
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

export default ReformSection
