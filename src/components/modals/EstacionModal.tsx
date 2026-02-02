import { useState, useEffect } from 'react'
import { Estacion, Zona, CreateEstacionData, UpdateEstacionData } from '../../services/zonasEstacionesService'

interface EstacionModalProps {
  estacion: Estacion | null
  zonas: Zona[]
  onClose: () => void
  onSave: (data: CreateEstacionData | UpdateEstacionData) => void
  isLoading: boolean
}

export default function EstacionModal({
  estacion,
  zonas,
  onClose,
  onSave,
  isLoading,
}: EstacionModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    zonaId: '',
    activa: true,
    identificadorExterno: '',
    tienePremium: true,
    tieneMagna: true,
    tieneDiesel: true,
  })

  useEffect(() => {
    if (estacion) {
      setFormData({
        nombre: estacion.nombre,
        zonaId: estacion.zonaId,
        activa: estacion.activa,
        identificadorExterno: estacion.identificadorExterno || '',
        tienePremium: estacion.tienePremium !== undefined ? estacion.tienePremium : true,
        tieneMagna: estacion.tieneMagna !== undefined ? estacion.tieneMagna : true,
        tieneDiesel: estacion.tieneDiesel !== undefined ? estacion.tieneDiesel : true,
      })
    } else {
      setFormData({
        nombre: '',
        zonaId: zonesDefaultId(),
        activa: true,
        identificadorExterno: '',
        tienePremium: true,
        tieneMagna: true,
        tieneDiesel: true,
      })
    }
  }, [estacion, zonas])

  const zonesDefaultId = () => {
    const activeZones = zonas.filter(z => z.activa)
    return activeZones.length > 0 ? activeZones[0].id : ''
  }

  // Initialize zonaId if creating new and not set
  useEffect(() => {
    if (!estacion && !formData.zonaId && zonas.length > 0) {
       setFormData(prev => ({ ...prev, zonaId: zonesDefaultId() }))
    }
  }, [zonas, estacion])


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim() || !formData.zonaId) {
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white">
            {estacion ? 'Editar Estación' : 'Nueva Estación'}
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
              Nombre de la Estación *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
              placeholder="Ej: Estación Central"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">Zona *</label>
            <select
              value={formData.zonaId}
              onChange={(e) => setFormData({ ...formData, zonaId: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
            >
              <option value="">Selecciona una zona</option>
              {zonas
                .filter((z) => z.activa)
                .map((zona) => (
                  <option key={zona.id} value={zona.id}>
                    {zona.nombre}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Identificador Externo
            </label>
            <input
              type="text"
              value={formData.identificadorExterno}
              onChange={(e) => setFormData({ ...formData, identificadorExterno: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              placeholder="Ej: 10195 (ID de la API externa)"
            />
            <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
              Identificador de la estación en la API externa (se sincroniza automáticamente)
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Productos Disponibles
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-[#e6e8eb] dark:border-slate-700">
                <div>
                  <p className="font-semibold text-[#111418] dark:text-white">Premium</p>
                  <p className="text-xs text-[#617589] dark:text-slate-400">Estación vende Premium</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.tienePremium}
                  onChange={(e) => setFormData({ ...formData, tienePremium: e.target.checked })}
                  className="size-5 rounded border-[#dbe0e6] dark:border-slate-600 text-[#1173d4] focus:ring-2 focus:ring-[#1173d4]"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-[#e6e8eb] dark:border-slate-700">
                <div>
                  <p className="font-semibold text-[#111418] dark:text-white">Magna</p>
                  <p className="text-xs text-[#617589] dark:text-slate-400">Estación vende Magna</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.tieneMagna}
                  onChange={(e) => setFormData({ ...formData, tieneMagna: e.target.checked })}
                  className="size-5 rounded border-[#dbe0e6] dark:border-slate-600 text-[#1173d4] focus:ring-2 focus:ring-[#1173d4]"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-[#e6e8eb] dark:border-slate-700">
                <div>
                  <p className="font-semibold text-[#111418] dark:text-white">Diesel</p>
                  <p className="text-xs text-[#617589] dark:text-slate-400">Estación vende Diesel</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.tieneDiesel}
                  onChange={(e) => setFormData({ ...formData, tieneDiesel: e.target.checked })}
                  className="size-5 rounded border-[#dbe0e6] dark:border-slate-600 text-[#1173d4] focus:ring-2 focus:ring-[#1173d4]"
                />
              </div>
            </div>
          </div>

          {estacion && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700">
              <div>
                <p className="font-semibold text-[#111418] dark:text-white">Estado</p>
                <p className="text-sm text-[#617589] dark:text-slate-400">Activar o desactivar la estación</p>
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
                  <span>{estacion ? 'Actualizar' : 'Crear'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
