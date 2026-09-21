import SectionHeading from '../common/SectionHeading'
import FaqItem from '../common/FaqItem'
import type { Faq } from '../../api/microcms'
import './FaqSection.css'

interface FaqSectionProps {
  id?: string
  items: Faq[]
}

function FaqSection({ id, items }: FaqSectionProps) {
  return (
    <section id={id} className="section faq-section">
      <div className="container">
        <SectionHeading>よくある質問</SectionHeading>
        <div className="faq-list">
          {items.map((item) => (
            <FaqItem key={item.id} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FaqSection
