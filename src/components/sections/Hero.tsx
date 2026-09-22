import { Link } from 'react-router-dom'
import './Hero.css'

// PageHeroImageのoverlay（画像に重ねる領域）の中に描画される想定のため、
// 自前の.container・背景は持たない。見出し・ボタンをまとめて画像の上下中央に表示する。
function Hero() {
  return (
    <div className="hero-inner">
      <h1 className="hero-title">会社員向け iDeCo新制度ガイド</h1>
      <div className="hero-actions">
        <Link to="/contribution-simulator" className="btn btn-primary">
          掛金シミュレーションを試す
        </Link>
        <Link to="/about" className="btn btn-secondary">
          制度の詳細を見る
        </Link>
      </div>
    </div>
  )
}

export default Hero
