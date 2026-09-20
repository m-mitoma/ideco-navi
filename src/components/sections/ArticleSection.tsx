import SectionHeading from '../common/SectionHeading'
import './ArticleSection.css'

interface ArticleSectionProps {
  id?: string
  title: string
  paragraphs: string[]
}

// タイトル + 複数段落の本文、というだけの汎用セクション。
// 「iDeCoとは」や詳細ページの説明文で使い回す。
function ArticleSection({ id, title, paragraphs }: ArticleSectionProps) {
  return (
    <section id={id} className="section article-section">
      <div className="container">
        <SectionHeading>{title}</SectionHeading>
        <div className="article-body">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ArticleSection
