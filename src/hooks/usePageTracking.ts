import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initGoogleAnalytics, sendPageView } from '../utils/analytics'

// React Routerのpathnameが変わるたびに実行される。初回表示時もこのeffectが
// 実行される（＝初回ページビューと遷移後のページビューが同じ経路を通る）ため、
// 別立てで初回計測を行う必要がなく、二重計測も発生しない。
// initGoogleAnalyticsは内部で初期化済みかどうかを判定しているため、
// 毎回呼び出しても実際のスクリプト読み込みは初回の1回だけになる。
export function usePageTracking(): void {
  const location = useLocation()

  useEffect(() => {
    initGoogleAnalytics()
    sendPageView(location.pathname)
  }, [location.pathname])
}
