import type { ReactNode } from 'react'

interface PageHeroImageProps {
  src: string
  width: number
  height: number
  /**
   * 見出し・リード文が別途テキストで表示されている場合、画像は装飾目的のため
   * 既定値の空文字（altなし）にしている。画像だけが情報を持つ場合は具体的な
   * 説明文を渡すこと。
   */
  alt?: string
  /**
   * 画像に対して上下中央に重ねて表示する内容（見出し・リード文を収めた
   * page-intro-panelや、トップページのCTAボタンなどを想定）。渡さない場合は
   * 画像のみのバンドになる。
   */
  children?: ReactNode
  /**
   * モバイル幅（600px以下）でも重ねた内容を画像の上に残すか。
   * 既定はfalseで、モバイルでは画像の下に通常表示に切り替わる
   * （page-intro-panelのような縦に長くなりがちな内容向け）。
   * トップページのHero（見出し＋ボタンのみ）のように、モバイルでも
   * 画像に重ねたままにしたい場合はtrueを渡す。
   */
  keepOverlayOnMobile?: boolean
}

// 各ページ最上部に置く、統一デザインのヒーロー画像。
// ブラウザ幅いっぱいのグラデーション帯の中央に、書き出し時の横幅を保ったまま画像を配置する。
function PageHeroImage({
  src,
  width,
  height,
  alt = '',
  children,
  keepOverlayOnMobile = false,
}: PageHeroImageProps) {
  return (
    <section className="page-hero-band">
      <img
        className="page-hero-image"
        src={src}
        width={width}
        height={height}
        alt={alt}
        loading="eager"
        decoding="async"
      />
      {children && (
        <div
          className={
            keepOverlayOnMobile
              ? 'page-hero-overlay page-hero-overlay-persist'
              : 'page-hero-overlay'
          }
        >
          <div className="container">{children}</div>
        </div>
      )}
    </section>
  )
}

export default PageHeroImage
