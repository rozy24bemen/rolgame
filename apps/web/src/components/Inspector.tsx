import React from 'react'
import { useReactiveQuery } from '../hooks/useReactiveQuery'
import { queries } from '../sdk'

export interface InspectorProps {
  selection: { kind: 'cell' | 'settlement' | 'army' | 'state'; id: string | number }
  onRequestRoutesFrom: (cellId: number) => void
}

const Inspector: React.FC<InspectorProps> = ({ selection, onRequestRoutesFrom }) => {
  const { kind, id } = selection

  const detail = useReactiveQuery(async () => {
    switch (kind) {
      case 'cell':
        return await queries.getCell(Number(id))
      case 'settlement':
        return await queries.getSettlement(String(id))
      case 'army':
        return await queries.getArmy(String(id))
      case 'state':
        return await queries.getFaction(String(id))
      default:
        return null
    }
  }, [kind, id])

  const renderContent = () => {
    switch (kind) {
      case 'cell': {
        const cell = detail.data as any
        return (
          <>
            <h4 className="text-lg font-bold">Celda #{cell.id} ({cell.q},{cell.r})</h4>
            <p>Bioma: {cell.biome} | Altura: {cell.height}</p>
            <p>Estado Propietario: {cell.stateId || 'Libre'}</p>
            <p>Costo de Movimiento: {cell.movementCost}</p>
            <button
              className="mt-2 py-1 px-3 bg-blue-600 rounded text-sm"
              onClick={() => onRequestRoutesFrom(cell.id)}
            >
              Ver Rutas Salientes
            </button>
          </>
        )
      }
      case 'settlement': {
        const settlement = detail.data as any
        return (
          <>
            <h4 className="text-lg font-bold">{settlement.name}</h4>
            <p>Población: {settlement.pop.toLocaleString()} | Tier Mercado: {settlement.marketTier}</p>
            <p>Guarnición: {settlement.garrison} | Propietario: {settlement.ownerStateId}</p>
            <p className="mt-2 font-semibold">Links Comerciales:</p>
            <ul className="list-disc ml-5 text-sm">
                {(settlement.tradeLinks as any[]).map((link: any, i: number) => (
                <li key={i}>A {link.toSettlementId}: {link.volume.toLocaleString()}</li>
              ))}
            </ul>
          </>
        )
      }
      case 'army': {
        const army = detail.data as any
        return (
          <>
            <h4 className="text-lg font-bold">Ejército {army.id}</h4>
            <p>Fuerza Total: {army.strength.toLocaleString()} | Suministro: {army.supply}%</p>
            <p>Postura: <span className="font-semibold">{String(army.stance).toUpperCase()}</span> | Dueño: {army.stateId}</p>
            <p className="mt-2 font-semibold">Composición:</p>
            <div className="grid grid-cols-3 text-sm">
              <span>Inf: {army.composition.inf}</span>
              <span>Cav: {army.composition.cav}</span>
              <span>Art: {army.composition.arty}</span>
            </div>
            {army.orders && army.orders.length > 0 && (
              <p className="mt-2 text-sm">Orden: {army.orders[0].kind} (ETA: {army.orders[0].etaTick})</p>
            )}
          </>
        )
      }
      case 'state': {
        const faction = detail.data as any
        return (
          <>
            <h4 className="text-lg font-bold">Estado {faction.name}</h4>
            <p>Tesoro: ${faction.treasury.toLocaleString()} | Estabilidad: {faction.stability.toFixed(1)}%</p>
            <p>Fuerza Militar: {faction.militaryStrength.toLocaleString()}</p>
          </>
        )
      }
      default:
        return <p>Selecciona una entidad en el mapa para inspeccionar.</p>
    }
  }

  if (!id) return <div className="p-4 bg-gray-800 rounded-lg shadow-xl text-gray-400">Ninguna entidad seleccionada.</div>

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-xl text-gray-100 h-full">
      <h3 className="text-xl font-bold border-b border-gray-700 pb-2 mb-3">Inspector Contextual</h3>
      {detail.loading && <div className="text-sm text-gray-500">Cargando…</div>}
      {detail.error && <div className="text-sm text-red-400">{detail.error}</div>}
      {!detail.loading && !detail.error && renderContent()}
    </div>
  )
}

export default Inspector
