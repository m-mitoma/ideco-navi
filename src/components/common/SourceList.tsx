import type { SourceRef } from '../../types/ideco'
import './SourceList.css'

interface SourceListProps {
  sources: SourceRef[]
}

// 「参考情報」として出典元とリンクをまとめて表示する共通パーツ
function SourceList({ sources }: SourceListProps) {
  return (
    <div className="source-list">
      <p className="source-list-heading">参考情報</p>
      <ul>
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SourceList
