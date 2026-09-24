import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// GA4（Google Analytics 4）のgtag.jsを、本番ビルド時のみindex.htmlへ
// 静的な<script>タグとして埋め込むプラグイン。
//
// 以前はReact側でdocument.createElementによりscriptタグを動的に追加していたが、
// 実機検証（本番Vercel環境・Reactを使わない素のHTMLとの比較）の結果、
// 動的に追加したscriptタグではgtag.js側の初期化が不安定になり、
// 2件目以降のgtag('event', ...)がGA4に届かないことが判明した。
// Google公式スニペットどおりの静的<script>タグに戻したところ、
// 自動送信のpage_view・scrollイベントに加え、手動のevent送信も
// 確実にgoogle-analytics.com/g/collectへ届くことを確認済み。
function googleAnalyticsHtmlPlugin(measurementId: string | undefined): Plugin {
  return {
    name: 'google-analytics-html',
    transformIndexHtml(html) {
      if (!measurementId) {
        return html
      }
      const snippet = `    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', { send_page_view: false });
    </script>
  </head>`
      return html.replace('</head>', snippet)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [
      react(),
      tailwindcss(),
      // command === 'build'（vite build）のときだけ埋め込む。
      // vite dev（command === 'serve'）ではindex.htmlにgtag.js自体が含まれないため、
      // 開発環境からGA4へデータが送信されることはない。
      ...(command === 'build' ? [googleAnalyticsHtmlPlugin(env.VITE_GA_MEASUREMENT_ID)] : []),
    ],
  }
})
