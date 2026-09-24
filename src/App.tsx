import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import RetirementDeductionPage from './pages/RetirementDeductionPage'
import ContributionSimulatorPage from './pages/ContributionSimulatorPage'

// GA4のpage_view送信はgtag.js自身の標準機能（config時の自動送信 + Enhanced
// Measurementによる履歴変化の自動検知）に任せている。詳細はvite.config.tsのコメントを参照。
function App() {
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
