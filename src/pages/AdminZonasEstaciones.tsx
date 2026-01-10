import { useState } from 'react'
import AdminHeader from '../components/AdminHeader'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  zonasEstacionesService,
  Zona,
  Estacion,
  CreateZonaData,
  UpdateZonaData,
  CreateEstacionData,
  UpdateEstacionData,
} from '../services/zonasEstacionesService'

export default function AdminZonasEstaciones() {
  const queryClient = useQueryClient()

  // Estados para modales
  const [showZonaModal, setShowZonaModal] = useState(false)
  const [showEstacionModal, setShowEstacionModal] = useState(false)
  const [showEstacionesModal, setShowEstacionesModal] = useState(false)
  const [selectedZona, setSelectedZona] = useState<Zona | null>(null)
  const [selectedEstacion, setSelectedEstacion] = useState<Estacion | null>(null)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Función para abrir modal de estaciones de una zona
  const handleVerEstaciones = (zona: Zona) => {
    setSelectedZona(zona)
    setShowEstacionesModal(true)
  }

  // Queries
  const { data: zonas = [] } = useQuery({
    queryKey: ['zonas'],
    queryFn: zonasEstacionesService.getZonas,
  })

  const { data: estaciones = [] } = useQuery({
    queryKey: ['estaciones'],
    queryFn: zonasEstacionesService.getEstaciones,
  })

  // Mutations para Zonas
  const createZonaMutation = useMutation({
    mutationFn: (data: CreateZonaData) => zonasEstacionesService.createZona(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zonas'] })
      setShowZonaModal(false)
      setSaveMessage({ type: 'success', text: 'Zona creada exitosamente' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: () => {
      setSaveMessage({ type: 'error', text: 'Error al crear la zona' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
  })

  const updateZonaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateZonaData }) =>
      zonasEstacionesService.updateZona(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zonas'] })
      queryClient.invalidateQueries({ queryKey: ['estaciones'] })
      setShowZonaModal(false)
      setSelectedZona(null)
      setSaveMessage({ type: 'success', text: 'Zona actualizada exitosamente' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: () => {
      setSaveMessage({ type: 'error', text: 'Error al actualizar la zona' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
  })

  const deleteZonaMutation = useMutation({
    mutationFn: (id: string) => zonasEstacionesService.deleteZona(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zonas'] })
      queryClient.invalidateQueries({ queryKey: ['estaciones'] })
      setSaveMessage({ type: 'success', text: 'Zona eliminada exitosamente' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: (error: any) => {
      setSaveMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al eliminar la zona',
      })
      setTimeout(() => setSaveMessage(null), 3000)
    },
  })

  // Mutations para Estaciones
  const createEstacionMutation = useMutation({
    mutationFn: (data: CreateEstacionData) => zonasEstacionesService.createEstacion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estaciones'] })
      queryClient.invalidateQueries({ queryKey: ['zonas'] })
      setShowEstacionModal(false)
      setSaveMessage({ type: 'success', text: 'Estación creada exitosamente' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: () => {
      setSaveMessage({ type: 'error', text: 'Error al crear la estación' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
  })

  const updateEstacionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEstacionData }) =>
      zonasEstacionesService.updateEstacion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estaciones'] })
      queryClient.invalidateQueries({ queryKey: ['zonas'] })
      setShowEstacionModal(false)
      setSelectedEstacion(null)
      setSaveMessage({ type: 'success', text: 'Estación actualizada exitosamente' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: () => {
      setSaveMessage({ type: 'error', text: 'Error al actualizar la estación' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
  })

  const deleteEstacionMutation = useMutation({
    mutationFn: (id: string) => zonasEstacionesService.deleteEstacion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estaciones'] })
      queryClient.invalidateQueries({ queryKey: ['zonas'] })
      setSaveMessage({ type: 'success', text: 'Estación eliminada exitosamente' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: (error: any) => {
      setSaveMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al eliminar la estación',
      })
      setTimeout(() => setSaveMessage(null), 3000)
    },
  })

  const handleEditZona = (zona: Zona) => {
    setSelectedZona(zona)
    setShowZonaModal(true)
  }

  const handleEditEstacion = (estacion: Estacion) => {
    setSelectedEstacion(estacion)
    setShowEstacionModal(true)
  }

  const handleDeleteZona = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta zona?')) {
      deleteZonaMutation.mutate(id)
    }
  }

  const handleDeleteEstacion = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta estación?')) {
      deleteEstacionMutation.mutate(id)
    }
  }

  // Agrupar estaciones por zona
  const estacionesPorZona = zonas.map((zona) => ({
    zona,
    estaciones: estaciones.filter((est) => est.zonaId === zona.id),
  }))

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <AdminHeader title="Zonas y Estaciones" icon="location_on" />

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        {/* Page Heading */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
              Gestión de Zonas y Estaciones
            </h1>
            <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
              <span className="material-symbols-outlined text-[20px]">info</span>
              <p className="text-base font-normal">
                Administra las zonas y sus estaciones. Los gerentes de zona verán reportes de todas las estaciones de sus zonas asignadas.
              </p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                setSelectedZona(null)
                setShowZonaModal(true)
              }}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#1a2632] px-4 py-2.5 text-sm font-bold text-[#111418] dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-[#253240] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">add_location</span>
              <span>Nueva Zona</span>
            </button>
            <button
              onClick={() => {
                setSelectedEstacion(null)
                setShowEstacionModal(true)
              }}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#1173d4] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-600 transition-all hover:shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">add_business</span>
              <span>Nueva Estación</span>
            </button>
          </div>
        </div>

        {/* Success/Error Message */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              saveMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-800 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-800 text-red-700 dark:text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">
                {saveMessage.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <p className="font-medium">{saveMessage.text}</p>
            </div>
          </div>
        )}

        {/* Zonas como Cards */}
        {estacionesPorZona.length === 0 ? (
          <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-12 shadow-sm text-center">
            <span className="material-symbols-outlined text-6xl text-[#617589] dark:text-slate-400 mb-4">location_off</span>
            <p className="text-lg font-semibold text-[#111418] dark:text-white mb-2">No hay zonas registradas</p>
            <p className="text-sm text-[#617589] dark:text-slate-400">Comienza creando tu primera zona</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {estacionesPorZona.map(({ zona, estaciones }) => (
              <div
                key={zona.id}
                className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handleVerEstaciones(zona)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="rounded-lg bg-orange-50 dark:bg-orange-900/30 p-2.5 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">location_on</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-1">{zona.nombre}</h3>
                      {zona.activa ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
                          <span className="material-symbols-outlined text-xs">cancel</span>
                          Inactiva
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditZona(zona)
                      }}
                      className="size-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                      title="Editar zona"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <span className="material-symbols-outlined text-[#617589] dark:text-slate-400 group-hover:text-[#1173d4] transition-colors">
                      chevron_right
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-[#617589] dark:text-slate-400">
                      <span className="material-symbols-outlined text-lg">store</span>
                      <span>
                        {estaciones.length} {estaciones.length === 1 ? 'estación' : 'estaciones'}
                      </span>
                    </div>
                    <span className="text-xs text-[#617589] dark:text-slate-400 group-hover:text-[#1173d4] transition-colors">
                      Ver detalles →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal para Zona */}
      {showZonaModal && (
        <ZonaModal
          zona={selectedZona}
          onClose={() => {
            setShowZonaModal(false)
            setSelectedZona(null)
          }}
          onSave={(data) => {
            if (selectedZona) {
              updateZonaMutation.mutate({ id: selectedZona.id, data })
            } else {
              createZonaMutation.mutate(data)
            }
          }}
          isLoading={createZonaMutation.isPending || updateZonaMutation.isPending}
        />
      )}

      {/* Modal para Estación */}
      {showEstacionModal && (
        <EstacionModal
          estacion={selectedEstacion}
          zonas={zonas}
          onClose={() => {
            setShowEstacionModal(false)
            setSelectedEstacion(null)
          }}
          onSave={(data) => {
            if (selectedEstacion) {
              updateEstacionMutation.mutate({ id: selectedEstacion.id, data })
            } else {
              createEstacionMutation.mutate(data)
            }
          }}
          isLoading={createEstacionMutation.isPending || updateEstacionMutation.isPending}
        />
      )}

      {/* Modal para ver Estaciones de una Zona */}
      {showEstacionesModal && selectedZona && (
        <EstacionesZonaModal
          zona={selectedZona}
          estaciones={estaciones.filter((e) => e.zonaId === selectedZona.id)}
          zonas={zonas}
          onClose={() => {
            setShowEstacionesModal(false)
            setSelectedZona(null)
          }}
          onEditZona={handleEditZona}
          onDeleteZona={handleDeleteZona}
          onEditEstacion={handleEditEstacion}
          onDeleteEstacion={handleDeleteEstacion}
          onAddEstacion={() => {
            setShowEstacionesModal(false)
            setSelectedEstacion(null)
            // Mantener la zona seleccionada para el modal de estación
            setTimeout(() => {
              setShowEstacionModal(true)
            }, 100)
          }}
        />
      )}
    </div>
  )
}

// Modal para crear/editar Zona
function ZonaModal({
  zona,
  onClose,
  onSave,
  isLoading,
}: {
  zona: Zona | null
  onClose: () => void
  onSave: (data: CreateZonaData | UpdateZonaData) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    nombre: zona?.nombre || '',
    activa: zona?.activa !== undefined ? zona.activa : true,
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

// Modal para crear/editar Estación
function EstacionModal({
  estacion,
  zonas,
  onClose,
  onSave,
  isLoading,
}: {
  estacion: Estacion | null
  zonas: Zona[]
  onClose: () => void
  onSave: (data: CreateEstacionData | UpdateEstacionData) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    nombre: estacion?.nombre || '',
    zonaId: estacion?.zonaId || zonas[0]?.id || '',
    activa: estacion?.activa !== undefined ? estacion.activa : true,
    identificadorExterno: estacion?.identificadorExterno || '',
    tienePremium: estacion?.tienePremium !== undefined ? estacion.tienePremium : true,
    tieneMagna: estacion?.tieneMagna !== undefined ? estacion.tieneMagna : true,
    tieneDiesel: estacion?.tieneDiesel !== undefined ? estacion.tieneDiesel : true,
  })

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

// Modal para ver Estaciones de una Zona
function EstacionesZonaModal({
  zona,
  estaciones,
  zonas,
  onClose,
  onEditZona,
  onDeleteZona,
  onEditEstacion,
  onDeleteEstacion,
  onAddEstacion,
}: {
  zona: Zona
  estaciones: Estacion[]
  zonas: Zona[]
  onClose: () => void
  onEditZona: (zona: Zona) => void
  onDeleteZona: (id: string) => void
  onEditEstacion: (estacion: Estacion) => void
  onDeleteEstacion: (id: string) => void
  onAddEstacion: () => void
}) {
  return (
    <div className="fixed inset-0 bg-gray-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-orange-50 dark:bg-orange-900/30 p-3 text-orange-600 dark:text-orange-400">
              <span className="material-symbols-outlined text-3xl">location_on</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#111418] dark:text-white">{zona.nombre}</h2>
              <p className="text-sm text-[#617589] dark:text-slate-400 mt-1">
                {estaciones.length} {estaciones.length === 1 ? 'estación' : 'estaciones'} asignada
                {estaciones.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de que deseas eliminar esta zona?')) {
                  onDeleteZona(zona.id)
                  onClose()
                }
              }}
              className="size-9 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              title="Eliminar zona"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
            <button
              onClick={onClose}
              className="size-9 rounded-lg bg-gray-100 dark:bg-gray-700 text-[#111418] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#111418] dark:text-white">Estaciones</h3>
            <button
              onClick={onAddEstacion}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1173d4] text-white hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Nueva Estación</span>
            </button>
          </div>

          {estaciones.length === 0 ? (
            <div className="text-center py-12 text-[#617589] dark:text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-3">store</span>
              <p className="text-base font-medium">No hay estaciones en esta zona</p>
              <button
                onClick={onAddEstacion}
                className="mt-4 px-4 py-2 rounded-lg bg-[#1173d4] text-white hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Agregar primera estación
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#101922] border-b border-[#e6e8eb] dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#617589] dark:text-slate-400 uppercase">Estación</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#617589] dark:text-slate-400 uppercase">ID Externo</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#617589] dark:text-slate-400 uppercase">Productos</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#617589] dark:text-slate-400 uppercase">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
                  {estaciones.map((estacion) => (
                    <tr
                      key={estacion.id}
                      className="hover:bg-[#f6f7f8] dark:hover:bg-[#253240] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1173d4] text-lg">storefront</span>
                          <span className="font-semibold text-[#111418] dark:text-white">{estacion.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {estacion.identificadorExterno ? (
                          <span className="text-xs text-[#617589] dark:text-slate-400 font-mono">
                            {estacion.identificadorExterno}
                          </span>
                        ) : (
                          <span className="text-xs text-[#617589] dark:text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {estacion.tienePremium && (
                            <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs font-medium">
                              Premium
                            </span>
                          )}
                          {estacion.tieneMagna && (
                            <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                              Magna
                            </span>
                          )}
                          {estacion.tieneDiesel && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                              Diesel
                            </span>
                          )}
                          {!estacion.tienePremium && !estacion.tieneMagna && !estacion.tieneDiesel && (
                            <span className="text-xs text-[#617589] dark:text-slate-400 italic">Sin productos</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {estacion.activa ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                            <span className="material-symbols-outlined text-xs">check_circle</span>
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
                            <span className="material-symbols-outlined text-xs">cancel</span>
                            Inactiva
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEditEstacion(estacion)}
                            className="size-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                            title="Editar estación"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('¿Estás seguro de que deseas eliminar esta estación?')) {
                                onDeleteEstacion(estacion.id)
                              }
                            }}
                            className="size-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                            title="Eliminar estación"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

