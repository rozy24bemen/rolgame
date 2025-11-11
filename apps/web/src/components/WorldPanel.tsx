import React, { useMemo } from 'react'
import { queries } from '../sdk'
import { useReactiveQuery } from '../hooks/useReactiveQuery'
import Sparkline from './Sparkline'

export interface WorldPanelProps {
  tick: number
  sseCount: number
  logs: string[]
}

const WorldPanel: React.FC<WorldPanelProps> = ({ tick, sseCount, logs }) => {
  // Global political health metric: average equilibrium gap (lower is better, tends to 0)
  const globalHealth = useReactiveQuery(async () => {
    return await queries.getGlobalTickMetrics({ metricKey: 'global_political_health', limit: 20 })
  }, [tick])
  const healthVals = useMemo(() => (globalHealth.data ?? []).slice().reverse().map((m: any) => m.value), [globalHealth.data])
  const latestHealth = (globalHealth.data?.[0]?.value as number) ?? undefined

  // Global risk intensity (war casualties over last 5 ticks normalized by total strength)
  const globalRisk = useReactiveQuery(async () => {
    return await queries.getGlobalTickMetrics({ metricKey: 'global_risk_intensity', limit: 20 })
  }, [tick])
  const riskVals = useMemo(() => (globalRisk.data ?? []).slice().reverse().map((m: any) => m.value), [globalRisk.data])
  const latestRisk = (globalRisk.data?.[0]?.value as number) ?? undefined
  const riskLabelClass = latestRisk === undefined
    ? 'text-gray-400'
    : latestRisk < 0.02
      ? 'text-green-400'
      : latestRisk < 0.08
        ? 'text-yellow-300'
        : 'text-red-400'
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="font-semibold mb-2">Mundo</h2>
      <div className="flex items-center gap-4 text-sm mb-3 text-gray-300">
        <div>Tick: <span className="font-semibold text-blue-400">{tick}</span></div>
        <div>Eventos SSE: <span className="font-semibold text-purple-400">{sseCount}</span></div>
      </div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold mb-1 flex items-center justify-between">Global Political Health (⟶ 0 mejor)
          <span className="inline-block align-middle"><Sparkline values={healthVals} width={140} height={28} stroke="#34d399" /></span>
        </h3>
        <div className="text-xs text-gray-300">
          {globalHealth.loading && <span className="text-gray-500">Cargando…</span>}
          {globalHealth.error && <span className="text-red-400">{String(globalHealth.error)}</span>}
          {!globalHealth.loading && !globalHealth.error && (
            <span>Gap promedio actual: <span className="font-semibold">{latestHealth?.toFixed(2) ?? '—'}</span></span>
          )}
        </div>
      </div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold mb-1 flex items-center justify-between">Global Risk Intensity
          <span className="inline-block align-middle"><Sparkline values={riskVals} width={140} height={28} stroke="#f97316" /></span>
        </h3>
        <div className="text-xs text-gray-300">
          {globalRisk.loading && <span className="text-gray-500">Cargando…</span>}
          {globalRisk.error && <span className="text-red-400">{String(globalRisk.error)}</span>}
          {!globalRisk.loading && !globalRisk.error && (
            <span>Riesgo actual: <span className={"font-semibold " + riskLabelClass}>{latestRisk !== undefined ? latestRisk.toFixed(3) : '—'}</span></span>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-1">Log de Simulación</h3>
        <div className="bg-gray-900/60 rounded p-2 max-h-40 overflow-auto text-xs space-y-1">
          {logs.length === 0 && <div className="text-gray-500">Sin eventos aún</div>}
          {logs.slice(-50).map((line, idx) => (
            <div key={idx} className="text-gray-300">• {line}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WorldPanel
