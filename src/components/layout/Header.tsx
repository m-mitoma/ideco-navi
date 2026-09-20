import { Link, NavLink } from 'react-router-dom'
import './Header.css'

function Header() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link to="/" className="site-logo">
          <span className="site-logo-full">会社員向け iDeCo新制度ガイド</span>
          <span className="site-logo-short">iDeCo新制度ガイド</span>
        </Link>
        <nav className="site-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'is-active' : '')}>
            トップ
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'is-active' : '')}>
            詳細ページ
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default Header
