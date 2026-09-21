import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import RetirementDeductionPage from './pages/RetirementDeductionPage'

function App() {
  return (
    <Routes>
      {/* Header/FooterはLayoutが共通で表示し、中身だけ各ページで切り替える */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/retirement-deduction" element={<RetirementDeductionPage />} />
      </Route>
    </Routes>
  )
}

export default App
