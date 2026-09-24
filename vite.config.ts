import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// GA4（Google Analytics 4）のgtag.jsを、本番ビルド時のみindex.htmlへ
// 静的な<script>タグとして埋め込むプラグイン。Google公式スニペットをそのまま使用する。
//
// 以前はReact側でdocument.createElementによりscriptタグを動的に追加していたが、
// 実機検証（本番Vercel環境・Reactを使わない素のHTMLとの比較）の結果、
// 動的に追加したscriptタグではgtag.js側の初期化が不安定になり、
// 2件目以降のgtag('event', ...)がGA4に届かないことが判明したため、静的タグに変更した。
//
// page_viewの送信は、React側の独自コードではなくgtag.js自身の標準機能
// （config時の自動page_view送信＋Enhanced MeasurementによるSPAの履歴変化の自動検知）
// に任せている。実機検証で、この標準機能だけで初回表示・SPAのルート変更の両方について
// page_viewが確実に送信されることを確認済み。React側で独自にpage_viewを送信すると、
// gtag.js自身の自動検知と重複して二重計測になることも実機で確認したため、
// send_page_viewはデフォルト（自動送信）のままにしている。
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
      gtag('config', '${measurementId}');
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
