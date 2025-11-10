import { useEffect, useRef, useState } from 'react'
import { connectSSE } from '../../../../packages/sdk/src'

export interface ReactiveResult<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * useReactiveQuery executes an async fetcher and re-runs it whenever a tick-update SSE event arrives.
 * It also re-runs on deps change.
 */
export function useReactiveQuery<T>(fetcher: () => Promise<T>, deps: any[] = []): ReactiveResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const unsubRef = useRef<() => void | undefined>()

  async function run() {
    try {
      setLoading(true)
      setError(null)
      const result = await fetcher()
      setData(result)
    } catch (e: any) {
      setError(e?.message || 'Error fetching data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    run()
    const base = (import.meta as any)?.env?.VITE_API_BASE || ''
    const sub = connectSSE(`${base}/api/events/subscribe`, () => {
      if (!cancelled) run()
    })
    unsubRef.current = () => sub.close()
    return () => { cancelled = true; try { sub.close() } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
