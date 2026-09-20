import { useEffect, useState } from 'react'
import type { IdecoData } from '../types/ideco'

interface UseIdecoRulesResult {
  data: IdecoData | null
  isLoading: boolean
  error: string | null
}

// 「後からAPIに差し替える」ことを想定し、fetch + useEffectで取得する構成にしている。
// 今はpublic/data/ideco.jsonを擬似的なAPIとして読み込んでいる。
export function useIdecoRules(): UseIdecoRulesResult {
  const [data, setData] = useState<IdecoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    fetch('/data/ideco.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('制度データの取得に失敗しました')
        }
        return response.json() as Promise<IdecoData>
      })
      .then((json) => {
        if (isMounted) {
          setData(json)
          setIsLoading(false)
        }
      })
      .catch((fetchError: unknown) => {
        if (isMounted) {
          const message =
            fetchError instanceof Error ? fetchError.message : '不明なエラーが発生しました'
          setError(message)
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return { data, isLoading, error }
}
