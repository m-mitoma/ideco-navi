import { Link } from 'react-router-dom'
import PageHeroImage from '../components/common/PageHeroImage'
import ArticleSection from '../components/sections/ArticleSection'
import ReformSection from '../components/sections/ReformSection'
import { useIdecoRules } from '../hooks/useIdecoRules'
import './AboutPage.css'

function AboutPage() {
  const { data, isLoading, error } = useIdecoRules()

  return (
    <>
      <PageHeroImage src="/images/hero/about.jpg" width={1024} height={434}>
        <div className="page-intro-panel">
          <p className="page-eyebrow">制度の詳細</p>
          <h1>iDeCoの制度をくわしく知る</h1>
          <p className="page-lead">
            iDeCoの仕組みや会社員の加入条件、企業年金との関係、掛金について、
            2026年12月の制度改正の内容まで詳しく解説します。
          </p>
        </div>
      </PageHeroImage>

      <ArticleSection
        id="mechanism"
        title="iDeCoの仕組み"
        paragraphs={[
          'iDeCoは、確定拠出年金法にもとづいて実施されている私的年金制度です。加入者自身が毎月の掛金を決めて拠出し、あらかじめ用意された運用商品の中から自分で運用方法を選びます。',
          '掛金とその運用益との合計額を、原則60歳以降に「老齢給付金」として受け取ります。将来の受取額は運用成績によって変動し、あらかじめ確定しているわけではありません。',
        ]}
      />

      <ArticleSection
        id="eligibility"
        title="会社員の加入条件"
        paragraphs={[
          '会社員（国民年金第2号被保険者）は、20歳以上65歳未満であれば基本的にiDeCoに加入できます（一定の条件があります）。',
          '勤務先の企業型DCで「マッチング拠出」を導入している場合は、マッチング拠出とiDeCoのどちらかを選ぶ仕組みになっているなど、勤務先の制度によって確認すべき点が異なります。',
        ]}
      />

      <ArticleSection
        id="company-pension"
        title="企業年金との関係"
        paragraphs={[
          '会社員のiDeCoの拠出限度額は、企業型DCやDB（確定給付企業年金）などの企業年金に加入しているかどうかによって異なります。',
          '企業年金がある場合は、iDeCoの掛金と企業年金の掛金相当額を合計した金額が拠出限度額の範囲内になるよう調整されます。DB自体には掛金の上限は定められていませんが、給付水準から算定される金額がiDeCoの枠に影響します。',
        ]}
      />

      <ArticleSection
        id="contribution"
        title="掛金について"
        paragraphs={[
          '掛金は月額5,000円から、1,000円単位で自分で決めることができます（上限は加入者区分によって異なります）。',
          '拠出した掛金は全額が所得控除（小規模企業共済等掛金控除）の対象になり、税負担の軽減につながる場合があります。',
        ]}
      />

      <ReformSection id="reform-detail" data={data} isLoading={isLoading} error={error} />

      <div className="container about-back">
        <Link to="/" className="btn btn-secondary">
          トップページへ戻る
        </Link>
      </div>
    </>
  )
}

export default AboutPage
