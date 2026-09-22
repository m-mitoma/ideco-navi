import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeroImage from '../components/common/PageHeroImage'
import Hero from '../components/sections/Hero'
import ArticleSection from '../components/sections/ArticleSection'
import BenefitsSection from '../components/sections/BenefitsSection'
import ReformSection from '../components/sections/ReformSection'
import ComparisonSection from '../components/sections/ComparisonSection'
import ChecklistSection from '../components/sections/ChecklistSection'
import FaqSection from '../components/sections/FaqSection'
import SectionHeading from '../components/common/SectionHeading'
import Card from '../components/common/Card'
import { useIdecoRules } from '../hooks/useIdecoRules'
import { fetchFaqItems } from '../api/faq'
import type { Faq } from '../api/microcms'
import './HomePage.css'

// 制度データはここで1回だけ取得し、必要なセクションにpropsとして渡す。
function HomePage() {
  const { data, isLoading, error } = useIdecoRules()

  const [faqItems, setFaqItems] = useState<Faq[]>([])

  useEffect(() => {
    fetchFaqItems().then(setFaqItems)
  }, [])

  return (
    <>
      <PageHeroImage
        src="/images/hero/home.jpg"
        width={1024}
        height={572}
        alt="オフィスのデスクに置かれたノートパソコンやスマートフォン、手帳などのビジネスアイテム"
        keepOverlayOnMobile
      >
        <Hero />
      </PageHeroImage>

      <ArticleSection
        id="about-ideco"
        title="iDeCoとは"
        paragraphs={[
          'iDeCo（イデコ・個人型確定拠出年金）は、自分が拠出した掛金を自分で運用し、資産を形成する私的年金制度です。加入は任意で、20歳以上65歳未満の公的年金の被保険者の方が加入できます（一定の条件があります）。',
          '掛金、運用益、そして給付を受け取るときのそれぞれの段階で、税制上のメリットが設けられています。',
          '原則として60歳になるまで、積み立てた資産を引き出すことはできません。',
        ]}
      />

      <BenefitsSection id="benefits" />

      <ReformSection id="reform" data={data} isLoading={isLoading} error={error} />

      <ComparisonSection id="comparison" data={data} isLoading={isLoading} error={error} />

      <ChecklistSection id="checklist" />

      <section id="simulator-links" className="section">
        <div className="container">
          <SectionHeading>自分の場合を計算してみる</SectionHeading>
          <div className="home-simulator-links">
            <Card className="home-simulator-card">
              <p className="home-simulator-card-title">掛金はいくらまで？</p>
              <p>
                年齢・年収・企業年金の状況を入力すると、確認すべき拠出限度額の区分と、
                2026年12月以降の変化の目安がわかります。
              </p>
              <Link to="/contribution-simulator" className="btn btn-primary">
                掛金シミュレーションを見る
              </Link>
            </Card>
            <Card className="home-simulator-card">
              <p className="home-simulator-card-title">iDeCoの退職所得控除、いくらになる？</p>
              <p>
                iDeCoを始めた年齢と受け取る予定の年齢を選ぶだけで、退職所得控除額の目安を
                確認できます。過去に退職金を受け取ったことがある場合の調整にも対応しています。
              </p>
              <Link to="/retirement-deduction" className="btn btn-primary">
                退職所得控除シミュレーターを見る
              </Link>
            </Card>
          </div>
        </div>
      </section>

      <FaqSection id="faq" items={faqItems} />
    </>
  )
}

export default HomePage
