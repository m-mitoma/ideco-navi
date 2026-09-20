import SectionHeading from '../common/SectionHeading'
import Card from '../common/Card'
import './BenefitsSection.css'

interface Benefit {
  id: number
  title: string
  description: string
}

// iDeCo公式サイト「iDeCoのメリット」にもとづく3つの税制上のメリット。
// 「絶対に得」等の断定は避け、中立的な言い回しにしている。
const benefits: Benefit[] = [
  {
    id: 1,
    title: '掛金が全額所得控除',
    description:
      '拠出した掛金は全額が所得控除（小規模企業共済等掛金控除）の対象となり、税負担の軽減につながる場合があります。',
  },
  {
    id: 2,
    title: '運用益が非課税で再投資',
    description:
      '通常、金融商品の運用益には20.315%の税金がかかりますが、iDeCoの運用益は非課税で再投資されます。',
  },
  {
    id: 3,
    title: '受け取る時も税制上のメリット',
    description:
      '年金として受け取る場合は「公的年金等控除」、一時金として受け取る場合は「退職所得控除」の対象になり、税制上のメリットがあります。',
  },
]

interface BenefitsSectionProps {
  id?: string
}

function BenefitsSection({ id }: BenefitsSectionProps) {
  return (
    <section id={id} className="section benefits-section">
      <div className="container">
        <SectionHeading>iDeCoの3つの税制上のメリット</SectionHeading>
        <div className="benefits-grid">
          {benefits.map((benefit) => (
            <Card key={benefit.id} className="benefit-card">
              <span className="benefit-number">{benefit.id}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default BenefitsSection
