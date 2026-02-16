import { useMemo } from 'react'
import { ControlFinanciero } from '../types/cierreMensual'

interface ControlFinancieroZonaProps {
  controlFinanciero: ControlFinanciero | null
  isLoading: boolean
  zonaNombre: string
  mesNombre: string
}

export default function ControlFinancieroZona({
  controlFinanciero,
  isLoading,
  zonaNombre,
  mesNombre,
}: ControlFinancieroZonaProps) {
  const resumen = controlFinanciero?.resumen
  const estaciones = controlFinanciero?.estaciones || []

  // Ordenar estaciones: primero pendientes, luego liquidadas
  const estacionesOrdenadas = useMemo(() => {
    return [...estaciones].sort((a, b) => {
      if (a.estado === 'Pendiente' && b.estado === 'Liquidado') return -1
      if (a.estado === 'Liquidado' && b.estado === 'Pendiente') return 1
      return b.saldo - a.saldo // Ordenar por saldo descendente
    })
  }, [estaciones])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
            <span className="text-lg font-medium">Cargando control financiero...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!controlFinanciero || !resumen) {
    return (
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">account_balance</span>
            <p className="text-lg">No hay datos financieros disponibles</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 py-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined">account_balance</span>
          Control Financiero - {zonaNombre}
        </h3>
        <p className="text-blue-100 text-sm mt-1 capitalize">{mesNombre}</p>
      </div>

      <div className="p-6">
        {/* Resumen Financiero */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-gray-50 dark:bg-[#101922]">
            <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-1">Saldo Inicial</p>
            <p className="text-xl font-black text-[#111418] dark:text-white">
              ${resumen.saldo_inicial.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </p>
          </div>

          <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-gray-50 dark:bg-[#101922]">
            <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-1">Entregas Recibidas</p>
            <p className="text-xl font-black text-[#111418] dark:text-white">
              ${resumen.entregas_recibidas.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </p>
          </div>

          <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-gray-50 dark:bg-[#101922]">
            <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-1">Entregas a Dirección</p>
            <p className="text-xl font-black text-[#111418] dark:text-white">
              ${resumen.entregas_direccion.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </p>
          </div>

          <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-gray-50 dark:bg-[#101922]">
            <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-1">Gastos de Zona</p>
            <p className="text-xl font-black text-[#111418] dark:text-white">
              ${resumen.gastos_zona.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </p>
          </div>

          <div className="rounded-lg border-2 border-green-500 dark:border-green-600 p-4 bg-green-50 dark:bg-green-900/20">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Resguardo Actual</p>
            <p className="text-xl font-black text-green-700 dark:text-green-400">
              ${resumen.resguardo_actual.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </p>
          </div>
        </div>

        {/* Estado de Liquidación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-white dark:bg-[#1a2632]">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
              <p className="text-xs font-semibold text-[#617589] dark:text-slate-400">Estaciones Liquidadas</p>
            </div>
            <p className="text-3xl font-black text-green-600 dark:text-green-400">{resumen.estaciones_liquidadas}</p>
          </div>

          <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-white dark:bg-[#1a2632]">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">pending</span>
              <p className="text-xs font-semibold text-[#617589] dark:text-slate-400">Estaciones Pendientes</p>
            </div>
            <p className="text-3xl font-black text-orange-600 dark:text-orange-400">{resumen.estaciones_pendientes}</p>
          </div>

          <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-white dark:bg-[#1a2632]">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">analytics</span>
              <p className="text-xs font-semibold text-[#617589] dark:text-slate-400">% Liquidación</p>
            </div>
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {resumen.porcentaje_liquidacion.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Tabla de Estaciones */}
        <div>
          <h4 className="text-lg font-bold text-[#111418] dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1173d4]">store</span>
            Estaciones de la Zona
          </h4>
          <div className="overflow-x-auto rounded-lg border border-[#e6e8eb] dark:border-slate-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estación
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Merma
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Entregas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Gastos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1a2632] divide-y divide-gray-200 dark:divide-gray-700">
                {estacionesOrdenadas.map((est) => (
                  <tr
                    key={est.estacion_id}
                    className={
                      est.estado === 'Pendiente'
                        ? 'bg-orange-50 dark:bg-orange-900/10'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                    }
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{est.estacion_nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {est.dias_aprobados}/{est.total_dias} días aprobados
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100 font-semibold">
                      ${est.merma.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                      ${est.entregas.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                      ${est.gastos.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold">
                      <span className={est.saldo > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}>
                        ${est.saldo.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {est.estado === 'Liquidado' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Liquidado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                          <span className="material-symbols-outlined text-sm">pending</span>
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
