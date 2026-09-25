import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import InstitutionGuideSection from '../sections/InstitutionGuideSection'
import A8MatsuiAd from '../common/A8MatsuiAd'
import { useIdecoRules } from '../../hooks/useIdecoRules'
import './Layout.css'

// Outletの位置に、ルーティング先のページ（HomePage / AboutPage）が表示される。
// Footerに出典リンクを出すため、ここでも制度データを取得している。
function Layout() {
  const { data } = useIdecoRules()

  return (
    <>
      <Header />
      <main>
        <Outlet />
        {/* 全ページ共通：金融機関の選び方の直後に広告を置き、その後にフッターが続く */}
        <InstitutionGuideSection />
        <div className="container site-ad">
          <A8MatsuiAd />
        </div>
      </main>
      <Footer sources={data?.sources} />
    </>
  )
}

export default Layout
