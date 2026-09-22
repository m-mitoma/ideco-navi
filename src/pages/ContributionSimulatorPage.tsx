import { Link } from 'react-router-dom'
import SimulatorSection from '../components/sections/SimulatorSection'
import NoticeBox from '../components/common/NoticeBox'
import { useIdecoRules } from '../hooks/useIdecoRules'
import './ContributionSimulatorPage.css'

function ContributionSimulatorPage() {
  const { data, isLoading, error } = useIdecoRules()

  return (
    <>
      <section className="section cs-intro">
        <div className="container">
          <p className="cs-eyebrow">掛金シミュレーション</p>
          <h1>iDeCoの掛金、いくらまで拠出できる？</h1>
          <p className="cs-lead">
            年齢・年収・企業年金の状況・毎月の掛金を入力すると、確認すべき拠出限度額の区分と、
            2026年12月以降の変化の目安が分かります。
          </p>
        </div>
      </section>

      <SimulatorSection id="simulator" data={data} isLoading={isLoading} error={error} />

      <section className="section cs-notice-section">
        <div className="container">
          <NoticeBox title="ご利用にあたっての注意">
            <p>
              本シミュレーターは、掛金の拠出限度額や税制メリットの目安を確認するためのものです。
              実際の拠出限度額は、企業型DCの事業主掛金額やDB等の他制度掛金相当額、加入している
              運営管理機関の規定によって異なる場合があります。正確な金額は、勤務先の担当部署や
              運営管理機関、税務署・税理士等にご確認ください。
            </p>
          </NoticeBox>
        </div>
      </section>

      <div className="container cs-back">
        <Link to="/retirement-deduction" className="btn btn-secondary">
          退職所得控除シミュレーターを見る
        </Link>
        <Link to="/" className="btn btn-secondary">
          トップページへ戻る
        </Link>
      </div>
    </>
  )
}

export default ContributionSimulatorPage
