// GA4（Google Analytics 4）への計測。公式のgtag.jsを直接読み込む構成にしており、
// ラッパーライブラリ（react-ga4等）は使用しない。
//
// 本番ビルド（import.meta.env.PROD）かつ測定ID（VITE_GA_MEASUREMENT_ID）が
// 設定されている場合のみ動作する。開発環境（vite dev）ではスクリプト自体を
// 読み込まないため、開発中の操作がGA4に送信されることはない。
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

let isInitialized = false

// gtag.jsスクリプトの読み込みと初期化。複数回呼ばれても2回目以降は何もしない。
export function initGoogleAnalytics(): void {
  if (isInitialized || !import.meta.env.PROD || !MEASUREMENT_ID) {
    return
  }
  isInitialized = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date())
  // SPAのルート変更ごとにsendPageViewで明示的にpage_viewを送るため、
  // config時点の自動page_view送信は無効にする（二重計測を防ぐため）。
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false })
}

// React RouterのルートパスをGA4にpage_viewとして送信する。
export function sendPageView(path: string): void {
  if (!import.meta.env.PROD || !MEASUREMENT_ID || typeof window.gtag !== 'function') {
    return
  }
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}
