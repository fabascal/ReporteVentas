import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ZonaModal from '../modals/ZonaModal'
import EstacionModal from '../modals/EstacionModal'
import {
  zonasEstacionesService,
  Zona,
  Estacion,
  CreateZonaData,
  UpdateZonaData,
  CreateEstacionData,
  UpdateEstacionData,
} from '../../services/zonasEstacionesService'

export default function VistaZonasEstaciones() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Estados para modales
  const [showZonaModal, setShowZonaModal] = useState(false)
  const [showEstacionModal, setShowEstacionModal] = useState(false)
  const [selectedZona, setSelectedZona] = useState<Zona | null>(null)
  const [selectedEstacion, setSelectedEstacion] = useState<Estacion | null>(null)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Función para navegar a página de detalle de zona
  const handleVerEstaciones = (zona: Zona) => {
    navigate(`/admin/zonas-estaciones/${zona.id}`)
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

  // Agrupar estaciones por zona
  const estacionesPorZona = zonas.map((zona) => ({
    zona,
    estaciones: estaciones.filter((est) => est.zonaId === zona.id),
  }))

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#111418] dark:text-white">
            Gestión de Zonas y Estaciones
          </h2>
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
          className={`p-4 rounded-lg border ${
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
    </div>
  )
}
