// GA4（Google Analytics 4）への計測。
//
// gtag.js本体の読み込みとgtag('config', ...)は、vite.config.tsのプラグインが
// 本番ビルド時のみindex.htmlに埋め込む静的<script>タグで行う（Google公式スニペットと
// 同じ構成）。以前はここでdocument.createElementによりscriptタグを動的に追加していたが、
// 実機検証の結果、動的追加だとgtag.js側の初期化が不安定になり2件目以降の
// gtag('event', ...)が送信されないことが判明したため、静的タグ方式に変更した。
//
// このファイルはReact Router側から「今どのページを見ているか」をGA4へ伝える
// page_view送信のみを担当する。開発環境やGA4測定ID未設定時のビルドでは
// window.gtagがそもそも定義されない（index.htmlにタグ自体が存在しない）ため、
// 自然にGA4へは何も送信されない。
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

// React RouterのルートパスをGA4にpage_viewとして送信する。
export function sendPageView(path: string): void {
  if (typeof window.gtag !== 'function') {
    return
  }
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}
