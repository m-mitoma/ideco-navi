import './AsyncState.css'

interface AsyncStateProps {
  type?: 'loading' | 'error'
  message: string
}

// API通信中(loading)・失敗時(error)の表示をまとめた共通パーツ
function AsyncState({ type = 'loading', message }: AsyncStateProps) {
  return <p className={`async-state async-state-${type}`}>{message}</p>
}

export default AsyncState
