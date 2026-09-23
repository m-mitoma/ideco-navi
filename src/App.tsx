import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import RetirementDeductionPage from './pages/RetirementDeductionPage'
import ContributionSimulatorPage from './pages/ContributionSimulatorPage'
import { usePageTracking } from './hooks/usePageTracking'

function App() {
  // ルートが変わるたびにGA4へpage_viewを送信する（本番ビルドのみ）。
  usePageTracking()

  return (
    <Routes>
      {/* Header/FooterはLayoutが共通で表示し、中身だけ各ページで切り替える */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/retirement-deduction" element={<RetirementDeductionPage />} />
        <Route path="/contribution-simulator" element={<ContributionSimulatorPage />} />
      </Route>
    </Routes>
  )
}

export default App
