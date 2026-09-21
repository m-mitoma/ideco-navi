import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ArticleSection from '../components/sections/ArticleSection'
import RetirementDeductionSimulator from '../components/sections/RetirementDeductionSimulator'
import NoticeBox from '../components/common/NoticeBox'
import SourceList from '../components/common/SourceList'
import Card from '../components/common/Card'
import SectionHeading from '../components/common/SectionHeading'
import {
  calculateDeductionAmount,
  calculateEquivalentYears,
  calculateRetirementDeduction,
  formatManYen,
  validateRetirementPeriodInput,
} from '../utils/calculateRetirementDeduction'
import './RetirementDeductionPage.css'

// 前職の退職金（重複期間の調整の計算に使う。加入期間とは無関係な固定値）
const PRIOR_PAYMENT_AMOUNT = 1_000_000

// 前職の退職金100万円に「相当する期間」（100万円 ÷ 40万円 → 端数切り捨て → 2年）
// 加入期間の入力値には左右されないため、コンポーネントの外で計算しておける。
const equivalentYears = calculateEquivalentYears(PRIOR_PAYMENT_AMOUNT)
const overlapYears = equivalentYears
const overlapDeduction = calculateDeductionAmount(overlapYears)

const sources = [
  {
    name: '国税庁「No.1420 退職金を受け取ったとき（退職所得）」',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1420.htm',
  },
  {
    name: 'iDeCo公式サイト（国民年金基金連合会）「よくあるご質問」',
    url: 'https://www.ideco-koushiki.jp/faq/',
  },
  {
    name: '厚生労働省「退職所得控除の調整規定」',
    url: 'https://www.mhlw.go.jp/content/10600000/001328797.pdf',
  },
]

function RetirementDeductionPage() {
  // シミュレーター本体と「事例」で共有する加入期間。ここで一元管理することで、
  // 事例側が別のstateを持って計算がずれる、という事態を避けている。
  const [years, setYears] = useState(20)
  const [months, setMonths] = useState(6)

  const errorMessage = useMemo(() => validateRetirementPeriodInput(years, months), [years, months])

  // 「計算例②」の①：シミュレーター本体と同じ関数・同じ加入期間で計算する。
  const jobChangeExample = useMemo(() => {
    if (errorMessage) {
      return null
    }
    return calculateRetirementDeduction(years, months)
  }, [years, months, errorMessage])

  // ③調整後の退職所得控除額（目安）。マイナスにはならないよう下限を0円にしている。
  const adjustedDeductionAmount = jobChangeExample
    ? Math.max(0, jobChangeExample.deductionAmount - overlapDeduction)
    : null

  return (
    <>
      <section className="section rd-intro">
        <div className="container">
          <p className="rd-eyebrow">退職所得控除シミュレーター</p>
          <h1>iDeCoの退職所得控除、いくらになる？</h1>
          <p className="rd-lead">
            iDeCoの老齢一時金を受け取るときは、退職所得控除の対象になります。
            加入期間（掛金を拠出した期間）を入力するだけで、控除額の目安を確認できます。
          </p>
        </div>
      </section>

      <RetirementDeductionSimulator
        id="simulator"
        years={years}
        months={months}
        onYearsChange={setYears}
        onMonthsChange={setMonths}
      />

      <ArticleSection
        id="what-is-deduction"
        title="退職所得控除とは？"
        paragraphs={[
          '退職所得控除とは、退職金など「退職所得」を受け取るときに、税金の負担を軽くするために所得から差し引ける金額のことです。',
          '勤続年数（iDeCoの場合は掛金を拠出した期間）が長いほど、控除額は大きくなります。控除額を超えた部分だけが課税の対象になるため、退職所得は給与などほかの所得と比べて税負担が軽くなるよう設計されています。',
        ]}
      />

      <ArticleSection
        id="ideco-lump-sum"
        title="iDeCoの一時金と退職所得控除"
        paragraphs={[
          'iDeCoの老齢給付金を一時金として受け取る場合、税制上は「退職所得」として扱われ、退職所得控除の対象になります。',
          '控除額の計算では、会社の退職金のような「勤続年数」ではなく、iDeCoに加入して掛金を拠出していた期間（拠出月数）をもとにした年数を使う点が特徴です。',
        ]}
      />

      <ArticleSection
        id="how-to-calculate"
        title="退職所得控除の計算方法"
        paragraphs={[
          '控除計算上の年数が20年以下の場合は「40万円 × 年数」（80万円未満の場合は80万円）、20年を超える場合は「800万円 + 70万円 ×（年数 − 20年）」で計算します。',
          '1年未満の端数は、1年として切り上げて計算します。例えば拠出期間が12年6か月であれば、控除計算上は13年として扱います。',
        ]}
      />

      <ArticleSection
        id="example"
        title="計算例"
        paragraphs={[
          '拠出期間が150か月（12年6か月）の場合、1年未満の端数を切り上げて13年として計算します。',
          '控除計算上の年数が20年以下のため「40万円 × 13年 = 520万円」が退職所得控除額の目安になります。',
        ]}
      />

      <section id="job-change-example" className="section rd-example2-section">
        <div className="container">
          <SectionHeading>計算例②：転職して前職の退職金を受け取っている場合</SectionHeading>
          <p className="rd-example2-intro">
            転職などで前職の退職金をすでに受け取ったことがある場合、iDeCoの退職所得控除には
            「重複期間の調整」という別のルールが関わってきます。次のようなケースで考え方を確認します。
          </p>

          <dl className="rd-timeline">
            <div className="rd-timeline-row">
              <dt>30歳</dt>
              <dd>前職の企業型DCに加入</dd>
            </div>
            <div className="rd-timeline-row">
              <dt>40歳</dt>
              <dd>iDeCoにも併用加入</dd>
            </div>
            <div className="rd-timeline-row">
              <dt>45歳</dt>
              <dd>
                転職。前職の退職金100万円を受け取る（転職先に退職金制度はなく、企業型DCの資産はiDeCoへ移換）
              </dd>
            </div>
            <div className="rd-timeline-row">
              <dt>60歳</dt>
              <dd>iDeCoの老齢一時金を受け取る</dd>
            </div>
          </dl>

          <Card className="rd-example2-card">
            {jobChangeExample === null || adjustedDeductionAmount === null ? (
              <p className="result-placeholder">
                上のシミュレーターに有効な加入期間を入力すると、この事例の計算結果が表示されます。
              </p>
            ) : (
              <>
                <p className="result-label">①調整前の退職所得控除額</p>
                <dl className="result-breakdown">
                  <div className="result-breakdown-row">
                    <dt>加入期間（企業型DC・iDeCo通算）</dt>
                    <dd>
                      {years}年{months}か月
                    </dd>
                  </div>
                  <div className="result-breakdown-row">
                    <dt>控除計算上の年数</dt>
                    <dd>{jobChangeExample.deductionYears}年</dd>
                  </div>
                  <div className="result-breakdown-row">
                    <dt>計算式</dt>
                    <dd>{jobChangeExample.formulaLabel}</dd>
                  </div>
                </dl>
                <p className="rd-result-value-small">
                  {jobChangeExample.deductionAmount.toLocaleString()}円（
                  {formatManYen(jobChangeExample.deductionAmount)}）
                </p>

                <div className="rd-adjustment-note">
                  <p className="rd-adjustment-note-title">
                    ②重複期間の調整（前職の退職金100万円との調整）
                  </p>
                  <p>
                    前職の退職金（100万円、45歳で受給）は、iDeCoの老齢一時金（60歳で受給）の
                    <strong>「前年以前19年内」</strong>に受け取っているため（60歳－45歳＝15年 ≦
                    19年）、厚生労働省の資料に示されている「退職所得控除の調整規定」の対象になります。
                  </p>
                  <dl className="result-breakdown">
                    <div className="result-breakdown-row">
                      <dt>前職の退職金（45歳で受給）</dt>
                      <dd>100万円</dd>
                    </div>
                    <div className="result-breakdown-row">
                      <dt>相当する期間（100万円 ÷ 40万円、端数切り捨て）</dt>
                      <dd>{equivalentYears}年</dd>
                    </div>
                    <div className="result-breakdown-row">
                      <dt>iDeCo加入期間との重複年数</dt>
                      <dd>{overlapYears}年</dd>
                    </div>
                    <div className="result-breakdown-row">
                      <dt>差し引く金額</dt>
                      <dd>
                        40万円 × {overlapYears}年 ＝ {formatManYen(overlapDeduction)}
                      </dd>
                    </div>
                  </dl>
                  <p className="result-note">
                    相当する期間は、前職の退職金の額を40万円で割った年数（1年未満の端数は切り捨て）から
                    求めた目安です。この期間はiDeCoの加入期間にそのまま含まれるため、 重複年数も同じ
                    {overlapYears}年になります。
                  </p>
                </div>

                <div className="rd-adjustment-note">
                  <p className="rd-adjustment-note-title">③調整後の退職所得控除額（目安）</p>
                  <p className="result-note">
                    {formatManYen(jobChangeExample.deductionAmount)} －{' '}
                    {formatManYen(overlapDeduction)} ＝ {formatManYen(adjustedDeductionAmount)}
                  </p>
                  <p className="result-value">{adjustedDeductionAmount.toLocaleString()}円</p>
                  <span className="rd-result-value-sub">
                    （{formatManYen(adjustedDeductionAmount)}）
                  </span>
                  <p className="result-note">
                    ※この金額は、公的資料に示された調整の考え方にもとづく概算です。相当する期間の算定方法や
                    重複年数の数え方は個別の状況によって異なる場合があるため、正確な金額は税務署・税理士、
                    または国税庁の情報でご確認ください。
                  </p>
                </div>
              </>
            )}
          </Card>
        </div>
      </section>

      <ArticleSection
        id="calculation-notes"
        title="注意事項（計算方法について）"
        paragraphs={[
          '本シミュレーターは、入力された拠出月数をもとにした概算です。実際の加入期間は、運営管理機関に記録されている加入者記録等にもとづいて確認されます。',
          '掛金を拠出していない期間（運用指図者であった期間など）の扱いについては、加入している運営管理機関にご確認ください。',
        ]}
      />

      <section className="section rd-notice-section">
        <div className="container">
          <NoticeBox title="重要：退職金とiDeCoを両方受け取る場合の注意">
            <p>
              会社の退職金とiDeCoの老齢一時金を別々の時期に受け取る場合、退職所得控除の計算において、
              過去に受け取った退職手当等との重複期間を調整するしくみがあります。本シミュレーターはこの調整を反映していないため、
              退職金とiDeCoを両方受け取る予定がある場合は、厚生労働省の資料や税務署などで詳細をご確認ください。
            </p>
            <p>
              本シミュレーターは退職所得控除額の目安を確認するためのものです。実際の退職所得控除額や税額は、退職金の受取状況、
              iDeCoの受取方法、受取時期、過去の退職手当等の状況などによって異なる場合があります。最新の税制については国税庁などの公的情報をご確認ください。
            </p>
          </NoticeBox>
        </div>
      </section>

      <section className="section rd-sources-section">
        <div className="container">
          <SourceList sources={sources} />
        </div>
      </section>

      <div className="container rd-back">
        <Link to="/" className="btn btn-secondary">
          トップページへ戻る
        </Link>
      </div>
    </>
  )
}

export default RetirementDeductionPage
