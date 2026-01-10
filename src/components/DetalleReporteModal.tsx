import { ReporteVentas } from '../types/reportes'
import { ReactNode } from 'react'

interface DetalleReporteModalProps {
  reporte: ReporteVentas
  onClose: () => void
  onExportar?: () => void
  renderAccionesAdicionales?: () => ReactNode
  titulo?: string
}

export default function DetalleReporteModal({
  reporte,
  onClose,
  onExportar,
  renderAccionesAdicionales,
  titulo,
}: DetalleReporteModalProps) {
  const calcularTotalVentas = (reporte: ReporteVentas) => {
    return reporte.premium.importe + reporte.magna.importe + reporte.diesel.importe + (reporte.aceites || 0)
  }

  const totalVentas = calcularTotalVentas(reporte)

  return (
    <div className="fixed inset-0 bg-gray-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700 sticky top-0 bg-white dark:bg-[#1a2632]">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white">
            {titulo || 'Detalle del Reporte'}
          </h2>
          <div className="flex items-center gap-2">
            {onExportar && (
              <button
                onClick={onExportar}
                className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-green-600 dark:text-green-400 transition-colors"
                title="Exportar a Excel"
              >
                <span className="material-symbols-outlined">download</span>
              </button>
            )}
            {renderAccionesAdicionales && renderAccionesAdicionales()}
            <button
              onClick={onClose}
              className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-[#617589] dark:text-slate-400">Estación</p>
              <p className="text-lg font-bold text-[#111418] dark:text-white mt-1">{reporte.estacionNombre}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#617589] dark:text-slate-400">Fecha</p>
              <p className="text-lg font-bold text-[#111418] dark:text-white mt-1">
                {new Date(reporte.fecha).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#617589] dark:text-slate-400">Creado Por</p>
              <p className="text-lg font-bold text-[#111418] dark:text-white mt-1">{reporte.creadoPor}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#617589] dark:text-slate-400">Estado</p>
              <p className="text-lg font-bold text-[#111418] dark:text-white mt-1">{reporte.estado}</p>
            </div>
          </div>

          {/* Detalles de Combustibles */}
          <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
            <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4">Detalles de Ventas</h3>
            <div className="space-y-4">
              {/* Premium */}
              <div className="p-4 rounded-lg bg-gray-50/30 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800">
                <div className="mb-3">
                  <p className="font-semibold text-[#111418] dark:text-white mb-3">Premium</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Volumen</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {reporte.premium.litros.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Importe</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        ${reporte.premium.importe.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Precio</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        ${reporte.premium.precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  {/* Volumen Neto (Venta - Merma) */}
                  {(reporte.premium.mermaVolumen > 0 || reporte.premium.mermaImporte > 0) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-2">Volumen Neto (Venta - Merma)</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Volumen</p>
                          <p className="font-semibold text-[#111418] dark:text-white">
                            {(reporte.premium.litros - (reporte.premium.mermaVolumen || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                          </p>
                        </div>
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Importe</p>
                          <p className="font-semibold text-[#111418] dark:text-white">
                            ${(reporte.premium.importe - (reporte.premium.mermaImporte || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {(reporte.premium.mermaVolumen > 0 || reporte.premium.mermaImporte > 0) && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-2">Merma</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Volumen</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {reporte.premium.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Importe</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          ${reporte.premium.mermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Porcentaje</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {reporte.premium.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Nuevos campos de Inventario y Compras */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-3">
                  <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-2">Inventario y Compras</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">I.I.B.</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.premium.iib || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Compras (C)</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.premium.compras || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">CCT</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.premium.cct || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">V. Dsc</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.premium.vDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">DC</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.premium.dc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Dif V. Dsc</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.premium.difVDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">I.F.</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.premium.if || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">I.F.F.B.</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.premium.iffb || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Magna */}
              <div className="p-4 rounded-lg bg-gray-50/30 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800">
                <div className="mb-3">
                  <p className="font-semibold text-[#111418] dark:text-white mb-3">Magna</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Volumen</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {reporte.magna.litros.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Importe</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        ${reporte.magna.importe.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Precio</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        ${reporte.magna.precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  {/* Volumen Neto (Venta - Merma) */}
                  {(reporte.magna.mermaVolumen > 0 || reporte.magna.mermaImporte > 0) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-2">Volumen Neto (Venta - Merma)</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Volumen</p>
                          <p className="font-semibold text-[#111418] dark:text-white">
                            {(reporte.magna.litros - (reporte.magna.mermaVolumen || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                          </p>
                        </div>
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Importe</p>
                          <p className="font-semibold text-[#111418] dark:text-white">
                            ${(reporte.magna.importe - (reporte.magna.mermaImporte || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {(reporte.magna.mermaVolumen > 0 || reporte.magna.mermaImporte > 0) && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-2">Merma</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Volumen</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {reporte.magna.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Importe</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          ${reporte.magna.mermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Porcentaje</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {reporte.magna.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Nuevos campos de Inventario y Compras */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-3">
                  <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-2">Inventario y Compras</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">I.I.B.</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.magna.iib || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Compras (C)</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.magna.compras || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">CCT</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.magna.cct || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">V. Dsc</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.magna.vDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">DC</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.magna.dc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Dif V. Dsc</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.magna.difVDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">I.F.</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.magna.if || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">I.F.F.B.</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.magna.iffb || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diesel */}
              <div className="p-4 rounded-lg bg-gray-50/30 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700">
                <div className="mb-3">
                  <p className="font-semibold text-[#111418] dark:text-white mb-3">Diesel</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Volumen</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {reporte.diesel.litros.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Importe</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        ${reporte.diesel.importe.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Precio</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        ${reporte.diesel.precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  {/* Volumen Neto (Venta - Merma) */}
                  {(reporte.diesel.mermaVolumen > 0 || reporte.diesel.mermaImporte > 0) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-2">Volumen Neto (Venta - Merma)</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Volumen</p>
                          <p className="font-semibold text-[#111418] dark:text-white">
                            {(reporte.diesel.litros - (reporte.diesel.mermaVolumen || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                          </p>
                        </div>
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Importe</p>
                          <p className="font-semibold text-[#111418] dark:text-white">
                            ${(reporte.diesel.importe - (reporte.diesel.mermaImporte || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {(reporte.diesel.mermaVolumen > 0 || reporte.diesel.mermaImporte > 0) && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-2">Merma</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Volumen</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {reporte.diesel.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Importe</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          ${reporte.diesel.mermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Porcentaje</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {reporte.diesel.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Nuevos campos de Inventario y Compras */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-3">
                  <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-2">Inventario y Compras</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">I.I.B.</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.diesel.iib || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Compras (C)</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.diesel.compras || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">CCT</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.diesel.cct || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">V. Dsc</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.diesel.vDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">DC</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.diesel.dc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Dif V. Dsc</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.diesel.difVDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">I.F.</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.diesel.if || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">I.F.F.B.</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(reporte.diesel.iffb || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aceites */}
              {reporte.aceites !== undefined && reporte.aceites > 0 && (
                <div className="p-4 rounded-lg bg-gray-50/30 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800">
                  <div className="mb-3">
                    <p className="font-semibold text-[#111418] dark:text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#617589] dark:text-slate-400">oil_barrel</span>
                      Aceites
                    </p>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Importe</p>
                        <p className="font-semibold text-[#111418] dark:text-white text-base">
                          ${reporte.aceites.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800">
                <p className="text-lg font-bold text-[#111418] dark:text-white">Total de Ventas</p>
                <p className="text-2xl font-black text-green-700 dark:text-green-400">
                  ${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          {(reporte.revisadoPor || reporte.comentarios) && (
            <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
              <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4">Información de Revisión</h3>
              {reporte.revisadoPor && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-[#617589] dark:text-slate-400">Revisado Por</p>
                  <p className="text-base text-[#111418] dark:text-white">{reporte.revisadoPor}</p>
                </div>
              )}
              {reporte.fechaRevision && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-[#617589] dark:text-slate-400">Fecha de Revisión</p>
                  <p className="text-base text-[#111418] dark:text-white">
                    {new Date(reporte.fechaRevision).toLocaleString('es-MX')}
                  </p>
                </div>
              )}
              {reporte.comentarios && (
                <div>
                  <p className="text-sm font-semibold text-[#617589] dark:text-slate-400 mb-2">Comentarios</p>
                  <p className="text-base text-[#111418] dark:text-white bg-gray-50 dark:bg-[#101922] p-3 rounded-lg">
                    {reporte.comentarios}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#1173d4] text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

