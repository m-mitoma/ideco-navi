import { Link } from 'react-router-dom'
import SourceList from '../common/SourceList'
import type { SourceRef } from '../../types/ideco'
import './Footer.css'

interface FooterProps {
  sources?: SourceRef[]
}

function Footer({ sources }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="footer-about">
          <p className="footer-logo">会社員向け iDeCo新制度ガイド</p>
          <p>
            2026年12月のiDeCo制度改正を中心に、会社員が自分の場合の考え方を整理できる情報サイトです。
          </p>
        </div>
        <div className="footer-links">
          <p className="footer-heading">ページ</p>
          <ul>
            <li>
              <Link to="/">トップページ</Link>
            </li>
            <li>
              <Link to="/about">詳細ページ</Link>
            </li>
            <li>
              <Link to="/contribution-simulator">掛金シミュレーター</Link>
            </li>
            <li>
              <Link to="/retirement-deduction">退職所得控除シミュレーター</Link>
            </li>
          </ul>
        </div>
        {sources && sources.length > 0 && (
          <div className="footer-sources">
            <SourceList sources={sources} />
          </div>
        )}
      </div>
      <p className="footer-disclaimer">
        ※制度の詳細や最新情報は、厚生労働省およびiDeCo公式サイト（国民年金基金連合会）でご確認ください。
      </p>
    </footer>
  )
}

export default Footer
