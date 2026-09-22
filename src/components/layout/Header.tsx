import { NavLink } from 'react-router-dom'
import './Header.css'

function Header() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <nav className="site-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'is-active' : '')}>
            トップ
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'is-active' : '')}>
            詳細ページ
          </NavLink>
          <NavLink
            to="/contribution-simulator"
            className={({ isActive }) => (isActive ? 'is-active' : '')}
          >
            掛金シミュレーター
          </NavLink>
          <NavLink
            to="/retirement-deduction"
            className={({ isActive }) => (isActive ? 'is-active' : '')}
          >
            退職控除シミュレーター
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default Header
