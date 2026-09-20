import { useEffect, useState } from 'react'
import Hero from '../components/sections/Hero'
import ArticleSection from '../components/sections/ArticleSection'
import BenefitsSection from '../components/sections/BenefitsSection'
import ReformSection from '../components/sections/ReformSection'
import ComparisonSection from '../components/sections/ComparisonSection'
import ChecklistSection from '../components/sections/ChecklistSection'
import SimulatorSection from '../components/sections/SimulatorSection'
import FaqSection from '../components/sections/FaqSection'
import { useIdecoRules } from '../hooks/useIdecoRules'
import { fetchFaqItems } from '../api/faq'
import type { Faq } from '../api/microcms'

// 制度データはここで1回だけ取得し、必要なセクションにpropsとして渡す。
function HomePage() {
  const { data, isLoading, error } = useIdecoRules()

  const [faqItems, setFaqItems] = useState<Faq[]>([])

  useEffect(() => {
    fetchFaqItems().then(setFaqItems)
  }, [])

  return (
    <>
      <Hero />

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

      <ReformSection
        id="reform"
        data={data}
        isLoading={isLoading}
        error={error}
      />

      <ComparisonSection
        id="comparison"
        data={data}
        isLoading={isLoading}
        error={error}
      />

      <ChecklistSection id="checklist" />

      <SimulatorSection
        id="simulator"
        data={data}
        isLoading={isLoading}
        error={error}
      />

      <FaqSection id="faq" items={faqItems} />
    </>
  )
}

export default HomePage