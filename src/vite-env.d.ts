/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Analytics 4の測定ID（例: G-XXXXXXXXXX）。未設定の場合はGA4を読み込まない。 */
  readonly VITE_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
