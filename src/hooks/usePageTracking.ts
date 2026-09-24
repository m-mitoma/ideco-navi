import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { sendPageView } from '../utils/analytics'

// React Routerのpathnameが変わるたびに実行される。初回表示時もこのeffectが
// 実行される（＝初回ページビューと遷移後のページビューが同じ経路を通る）ため、
// 別立てで初回計測を行う必要がなく、二重計測も発生しない。
// gtag.js自体の読み込み・初期化はvite.config.tsのプラグインがindex.htmlへの
// 静的<script>タグ埋め込みで行うため、ここではページビューの送信のみを行う。
export function usePageTracking(): void {
  const location = useLocation()

  useEffect(() => {
    sendPageView(location.pathname)
  }, [location.pathname])
}
