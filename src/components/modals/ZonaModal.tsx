import { useState } from 'react'
import { Zona, CreateZonaData, UpdateZonaData } from '../../services/zonasEstacionesService'

interface ZonaModalProps {
  zona: Zona | null
  onClose: () => void
  onSave: (data: CreateZonaData | UpdateZonaData) => void
  isLoading: boolean
}

export default function ZonaModal({
  zona,
  onClose,
  onSave,
  isLoading,
}: ZonaModalProps) {
  const [formData, setFormData] = useState({
    nombre: zona?.nombre || '',
    activa: zona?.activa !== undefined ? zona.activa : true,
    orden_reporte: zona?.orden_reporte ?? 99,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white">
            {zona ? 'Editar Zona' : 'Nueva Zona'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Nombre de la Zona *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
              placeholder="Ej: Zona Norte"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Orden de Reporte *
            </label>
            <input
              type="number"
              min={1}
              value={formData.orden_reporte}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  orden_reporte: Math.max(1, Number.parseInt(e.target.value || '1', 10) || 1),
                })
              }
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
              placeholder="Ej: 1"
            />
            <p className="mt-1 text-xs text-[#617589] dark:text-slate-400">
              Menor número = mayor prioridad en reportes.
            </p>
          </div>

          {zona && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700">
              <div>
                <p className="font-semibold text-[#111418] dark:text-white">Estado</p>
                <p className="text-sm text-[#617589] dark:text-slate-400">Activar o desactivar la zona</p>
              </div>
              <input
                type="checkbox"
                checked={formData.activa}
                onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                className="size-5 rounded border-[#dbe0e6] dark:border-slate-600 text-[#1173d4] focus:ring-2 focus:ring-[#1173d4]"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#111418] dark:text-white bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#1173d4] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  <span>{zona ? 'Actualizar' : 'Crear'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
