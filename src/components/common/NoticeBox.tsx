import type { ReactNode } from 'react'
import './NoticeBox.css'

interface NoticeBoxProps {
  title?: string
  children: ReactNode
}

// 「重要な注意点」をまとめて目立たせるための共通パーツ。
// 色だけに頼らないよう、タイトルに「重要」等のテキストを添えて使う。
function NoticeBox({ title, children }: NoticeBoxProps) {
  return (
    <div className="notice-box">
      {title && <p className="notice-box-title">{title}</p>}
      <div className="notice-box-body">{children}</div>
    </div>
  )
}

export default NoticeBox
