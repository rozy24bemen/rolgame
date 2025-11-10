import React, { useState } from 'react'
import { useReactiveQuery } from '../hooks/useReactiveQuery'
import { queries } from '../sdk'

interface NarrativeFeedProps {
  stateId?: string | null
  limit?: number
}

const NarrativeFeed: React.FC<NarrativeFeedProps> = ({ stateId, limit = 30 }) => {
  const [fromTick, setFromTick] = useState<number | undefined>(undefined)
  const [toTick, setToTick] = useState<number | undefined>(undefined)
  const tickInfo = useReactiveQuery(async () => await queries.getTickInfo(), [])
  const feed = useReactiveQuery(async () => {
    return await queries.getNarrativeEvents({ stateId: stateId ?? undefined, fromTick, toTick, limit })
  }, [stateId, limit, fromTick, toTick])

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="font-semibold mb-2">Narrativa</h2>
      <div className="flex gap-2 items-center text-xs text-gray-300 mb-2 flex-wrap">
        <label className="flex items-center gap-1">Desde
          <input className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1" type="number" value={fromTick ?? ''} onChange={(e) => setFromTick(e.target.value === '' ? undefined : Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-1">Hasta
          <input className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1" type="number" value={toTick ?? ''} onChange={(e) => setToTick(e.target.value === '' ? undefined : Number(e.target.value))} />
        </label>
        <button className="px-2 py-1 bg-gray-700 rounded" onClick={() => { setFromTick(undefined); setToTick(undefined) }}>Limpiar</button>
        <div className="ml-auto flex gap-1">
          <button className="px-2 py-1 bg-gray-700 rounded" onClick={() => {
            const t = (tickInfo.data as any)?.tick
            if (typeof t === 'number') { setFromTick(Math.max(0, t - 9)); setToTick(t) }
          }}>Últimos 10</button>
          <button className="px-2 py-1 bg-gray-700 rounded" onClick={() => {
            const t = (tickInfo.data as any)?.tick
            if (typeof t === 'number') { setFromTick(Math.max(0, t - 19)); setToTick(t) }
          }}>Últimos 20</button>
          <button className="px-2 py-1 bg-gray-700 rounded" onClick={() => { setFromTick(undefined); setToTick(undefined) }}>Todo</button>
        </div>
      </div>
      {feed.loading && <div className="text-sm text-gray-500">Cargando…</div>}
      {feed.error && <div className="text-sm text-red-400">{feed.error}</div>}
      {!feed.loading && !feed.error && (
        <ul className="space-y-2 max-h-52 overflow-auto pr-1">
          {(feed.data ?? []).map((ev: any) => (
            <li key={ev.id} className="text-sm text-gray-200">
              <div className="text-xs text-gray-400">Tick {ev.tick}{ev.stateId ? ` · Estado ${ev.stateId}` : ''}</div>
              <div>{ev.text}</div>
            </li>
          ))}
          {(!feed.data || feed.data.length === 0) && (
            <li className="text-sm text-gray-500">Sin eventos narrativos aún.</li>
          )}
        </ul>
      )}
    </div>
  )
}

export default NarrativeFeed
