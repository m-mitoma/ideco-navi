import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useIdecoRules } from '../../hooks/useIdecoRules'

// Outletの位置に、ルーティング先のページ（HomePage / AboutPage）が表示される。
// Footerに出典リンクを出すため、ここでも制度データを取得している。
function Layout() {
  const { data } = useIdecoRules()

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer sources={data?.sources} />
    </>
  )
}

export default Layout
