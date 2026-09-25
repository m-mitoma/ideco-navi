import SectionHeading from '../common/SectionHeading'
import './InstitutionGuideSection.css'

// iDeCo公式サイト「iDeCoをはじめるまでの4つのポイント」の
// 「金融機関を選ぶ3つの着眼点」をもとに要約した内容。
const guidePoints = [
  {
    id: 1,
    title: '取り扱っている運用商品',
    description:
      '投資信託や元本確保商品（定期預金・保険）のラインナップは金融機関ごとに異なります。運用したい商品があるかを比較しましょう。',
  },
  {
    id: 2,
    title: 'サービスの内容',
    description:
      'ホームページやコールセンター、運用について学べる資料など、自分に合ったサポートがあるかを確認しましょう。',
  },
  {
    id: 3,
    title: '手数料',
    description:
      '口座の管理にかかる毎月の手数料は金融機関によって異なります。サービス内容とあわせて検討しましょう。',
  },
]

function InstitutionGuideSection() {
  return (
    <section id="institution-guide" className="section institution-guide">
      <div className="container">
        <SectionHeading>iDeCoの金融機関の選び方</SectionHeading>
        <p className="institution-guide-intro">
          iDeCoは、運営管理機関と呼ばれる金融機関（証券会社・銀行など）を1社だけ選んで加入の手続きを行います。
          iDeCo公式サイトでは、金融機関を選ぶ際の着眼点として次の3つが紹介されています。
        </p>
        <ol className="institution-guide-list">
          {guidePoints.map((point) => (
            <li key={point.id} className="institution-guide-item">
              <span className="institution-guide-number" aria-hidden="true">
                {point.id}
              </span>
              <div>
                <p className="institution-guide-title">{point.title}</p>
                <p className="institution-guide-description">{point.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="institution-guide-note">
          気になる金融機関があれば資料請求をして、運用商品やサービス内容を確認してみましょう。
          iDeCoを取り扱う金融機関は、iDeCo公式サイトの
          <a href="https://www.ideco-koushiki.jp/operations/" target="_blank" rel="noreferrer">
            運営管理機関一覧
          </a>
          で確認できます。
        </p>
        <p className="institution-guide-source">
          出典：
          <a href="https://www.ideco-koushiki.jp/start/" target="_blank" rel="noreferrer">
            iDeCo公式サイト「iDeCoをはじめるまでの4つのポイント」
          </a>
        </p>
      </div>
    </section>
  )
}

export default InstitutionGuideSection
