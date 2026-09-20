import { useState } from 'react'
import './FaqItem.css'

interface FaqItemProps {
  question: string
  answer: string
}

// question / answer をpropsで受け取るだけの再利用可能なFAQ1件分
function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="faq-item">
      <button
        type="button"
        className="faq-question"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prevIsOpen) => !prevIsOpen)}
      >
        <span>
          <span className="faq-mark">Q.</span> {question}
        </span>
        <span className="faq-icon" aria-hidden="true" />
      </button>
      {isOpen && <p className="faq-answer">{answer}</p>}
    </div>
  )
}

export default FaqItem
