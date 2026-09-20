import { Link } from 'react-router-dom'
import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <p className="hero-eyebrow">2026年12月 iDeCo制度改正</p>
        <h1>
          2026年12月、
          <br />
          iDeCoの制度が変わります。
        </h1>
        <p className="hero-lead">
          会社員は、企業年金（企業型DC・DBなど）の加入状況によって考え方が変わります。
          まずはご自身の場合を確認してみましょう。
        </p>
        <div className="hero-actions">
          <a href="#simulator" className="btn btn-primary">
            掛金シミュレーションを試す
          </a>
          <Link to="/about" className="btn btn-secondary">
            制度の詳細を見る
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Hero
