import React, { useEffect, useMemo, useState } from 'react'
import FactionPanel from './components/FactionPanel'
import WorldPanel from './components/WorldPanel'
import NarrativeFeed from './components/NarrativeFeed'
import Inspector from './components/Inspector'
import MetricPanel from './components/MetricPanel'
import { queries, rest } from './sdk'
import type { FactionSummary, Army, Settlement, Cell } from '../../../packages/schema/ts/types'
import { connectSSE } from '../../../packages/sdk/src'
import { useReactiveQuery } from './hooks/useReactiveQuery'

export default function App() {
  const [selection, setSelection] = useState<{ kind: 'cell'|'settlement'|'army'|'state'; id: string|number } | null>(null)
  const [faction, setFaction] = useState<FactionSummary | null>(null)
  const [factionId, setFactionId] = useState<string | null>(null)
  const [army, setArmy] = useState<Army | null>(null)
  const [settlement, setSettlement] = useState<Settlement | null>(null)
  const [cell, setCell] = useState<Cell | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTick, setCurrentTick] = useState<number>(0)
  const [eventCount, setEventCount] = useState<number>(0)
  const [simLogs, setSimLogs] = useState<string[]>([])
  const [autoTick, setAutoTick] = useState<boolean>(false)
  const [autoTickMs, setAutoTickMs] = useState<number>(1000)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        // Tick info (dynamic)
        try {
          const t = await queries.getTickInfo()
          setCurrentTick(t.tick)
        } catch {}
        // Get list of factions and pick first
        const factions = await queries.getFactions()
        const first = factions[0]
        if (!first) throw new Error('No hay facciones disponibles')
        // Fetch full faction
        const fullFaction = await queries.getFaction(first.id)
        if (cancelled) return
        // Initialize factionId; ongoing updates handled by useReactiveQuery below
        setFactionId(fullFaction.id)
        const firstArmy: Army | undefined = fullFaction.armies?.[0]
        const firstSettlement: Settlement | undefined = fullFaction.settlements?.[0]
        setArmy(firstArmy ?? null)
        setSettlement(firstSettlement ?? null)
        // Load a cell: from army location if present, else from settlement cellId, else id 1
        const cellId = firstArmy?.locationCellId ?? firstSettlement?.cellId ?? 1
        const c = await queries.getCell(cellId)
        if (cancelled) return
        setCell(c)
        // Default selection
        setSelection({ kind: 'state', id: fullFaction.id })
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Error cargando datos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    // Subscribe to SSE for tick updates
    const base = (import.meta as any)?.env?.VITE_API_BASE || ''
    const sub = connectSSE(`${base}/api/events/subscribe`, (data: any) => {
      if (data && (data.type === 'tick-update') && typeof data.tick === 'number') {
        setCurrentTick(data.tick)
        setEventCount((c) => c + 1)
        if (Array.isArray(data.messages) && data.messages.length) {
          setSimLogs((prev) => [...prev, ...data.messages!])
        }
      }
    })
    return () => { cancelled = true; sub.close() }
  }, [])

  // Reactive faction refetch on SSE tick updates
  const factionDetail = useReactiveQuery(async () => {
    if (!factionId) throw new Error('No faction selected')
    return await queries.getFaction(factionId)
  }, [factionId])

  useEffect(() => {
    if (!factionDetail.data) return
    const f = factionDetail.data as any
    const summary: FactionSummary = {
      id: f.id,
      name: f.name,
      cultureId: f.cultureId,
      treasury: f.treasury,
      stability: f.stability,
      territories: f.territories ?? 0,
      militaryStrength: f.militaryStrength ?? 0,
      relations: f.relations ?? [],
      objectives: f.objectives ?? [],
      llmStatus: f.llmStatus,
      alerts: f.alerts ?? [],
    }
    setFaction(summary)
  }, [factionDetail.data])

  // Auto-tick interval
  useEffect(() => {
    if (!autoTick) return
    const id = setInterval(async () => {
      try { const r = await rest.postWorldTick(1); setCurrentTick(r.tick) } catch {}
    }, autoTickMs)
    return () => clearInterval(id)
  }, [autoTick, autoTickMs])


  const handleToggleLLM = async (id: string, enabled: boolean) => {
    try {
      await rest.postFactionLLM(id, { enabled })
      if (faction && faction.id === id) {
        setFaction({ ...faction, llmStatus: { ...faction.llmStatus, enabled } })
      }
    } catch (e) {
      alert('Error actualizando LLM: ' + (e as any)?.message)
    }
  }

  const handleSuggestStrategy = async (id: string, text: string) => {
    try {
      await rest.postFactionSuggest(id, text)
      alert('Sugerencia enviada')
    } catch (e) {
      alert('Error enviando sugerencia: ' + (e as any)?.message)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="p-4 border-b border-gray-800 bg-gray-900/80 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Panel de Orquestación — Wireframes</h1>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div>Tick: <span className="font-semibold text-blue-400">{currentTick}</span></div>
            <div>Eventos SSE: <span className="font-semibold text-purple-400">{eventCount}</span></div>
          </div>
        </div>
      </header>

      <main className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 space-y-4">
          <WorldPanel tick={currentTick} sseCount={eventCount} logs={simLogs} />
          <NarrativeFeed stateId={faction?.id ?? null} />
          {loading && (
            <div className="bg-gray-800 p-4 rounded-lg animate-pulse">Cargando...</div>
          )}
          {error && (
            <div className="bg-red-900/50 p-4 rounded-lg text-red-200">{error}</div>
          )}
          {!loading && !error && faction && (
            <FactionPanel
              faction={faction}
              onSuggestStrategy={handleSuggestStrategy}
              onToggleLLM={handleToggleLLM}
            />
          )}

          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Demo selección rápida</h2>
            <div className="flex gap-2 text-sm">
              <button className="px-3 py-1 bg-blue-600 rounded" onClick={() => cell && setSelection({ kind: 'cell', id: cell.id })} disabled={!cell}>Celda</button>
              <button className="px-3 py-1 bg-blue-600 rounded" onClick={() => settlement && setSelection({ kind: 'settlement', id: settlement.id })} disabled={!settlement}>Asentamiento</button>
              <button className="px-3 py-1 bg-blue-600 rounded" onClick={() => army && setSelection({ kind: 'army', id: army.id })} disabled={!army}>Ejército</button>
              <button className="px-3 py-1 bg-blue-600 rounded" onClick={() => faction && setSelection({ kind: 'state', id: faction.id })} disabled={!faction}>Estado</button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button className="px-3 py-1 bg-purple-600 rounded" onClick={async () => {
                try { const r = await rest.postWorldTick(1); setCurrentTick(r.tick) } catch (e) { alert('Error tick: ' + (e as any)?.message) }
              }}>Avanzar Tick</button>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={autoTick} onChange={(e) => setAutoTick(e.target.checked)} /> Auto-Tick
              </label>
              <input type="number" className="w-20 bg-gray-700 border border-gray-600 rounded text-sm px-2 py-1" value={autoTickMs} min={200} step={100} onChange={(e) => setAutoTickMs(Math.max(200, Number(e.target.value) || 1000))} />
              <span className="text-xs text-gray-400">ms</span>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-1 space-y-4">
          <MetricPanel stateId={faction?.id ?? null} />
          <Inspector
            selection={selection ?? (faction ? { kind: 'state', id: faction.id } : { kind: 'cell', id: 1 })}
            onRequestRoutesFrom={(cellId: number) => alert(`Rutas desde celda ${cellId}`)}
          />
        </aside>
      </main>
    </div>
  )
}
