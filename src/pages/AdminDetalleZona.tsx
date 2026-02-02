import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AdminHeader from '../components/AdminHeader'
import EstacionModal from '../components/modals/EstacionModal'
import {
  zonasEstacionesService,
  Estacion,
  CreateEstacionData,
  UpdateEstacionData,
} from '../services/zonasEstacionesService'

export default function AdminDetalleZona() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showEstacionModal, setShowEstacionModal] = useState(false)
  const [selectedEstacion, setSelectedEstacion] = useState<Estacion | null>(null)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Queries
  const { data: zona, isLoading: isLoadingZona } = useQuery({
    queryKey: ['zonas', id],
    queryFn: () => zonasEstacionesService.getZonaById(id!),
    enabled: !!id,
  })

  const { data: estaciones = [] } = useQuery({
    queryKey: ['estaciones'],
    queryFn: zonasEstacionesService.getEstaciones,
  })

  const { data: zonas = [] } = useQuery({
    queryKey: ['zonas'],
    queryFn: zonasEstacionesService.getZonas,
  })

  const estacionesZona = estaciones.filter((e) => e.zonaId === id)

  // Mutations
  const createEstacionMutation = useMutation({
    mutationFn: (data: CreateEstacionData) => zonasEstacionesService.createEstacion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estaciones'] })
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

  const handleEditEstacion = (estacion: Estacion) => {
    setSelectedEstacion(estacion)
    setShowEstacionModal(true)
  }

  const handleDeleteEstacion = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta estación?')) {
      deleteEstacionMutation.mutate(id)
    }
  }

  const handleAddEstacion = () => {
    setSelectedEstacion(null)
    setShowEstacionModal(true)
  }

  if (isLoadingZona) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1173d4]"></div>
      </div>
    )
  }

  if (!zona) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Zona no encontrada</h1>
        <button
          onClick={() => navigate('/admin/zonas-estaciones')}
          className="text-[#1173d4] hover:underline"
        >
          Volver a Zonas
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <AdminHeader title={`Zona: ${zona.nombre}`} icon="location_on" />

      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/admin/zonas-estaciones')}
                className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
                {zona.nombre}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
              <span className="material-symbols-outlined text-[20px]">store</span>
              <p className="text-base font-normal">
                {estacionesZona.length} {estacionesZona.length === 1 ? 'estación' : 'estaciones'} asignada{estacionesZona.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <div>
            <button
              onClick={handleAddEstacion}
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

        {/* Tabla de Estaciones */}
        <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm border border-[#e6e8eb] dark:border-slate-700 overflow-hidden">
          {estacionesZona.length === 0 ? (
            <div className="text-center py-12 text-[#617589] dark:text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-3">store</span>
              <p className="text-base font-medium">No hay estaciones en esta zona</p>
              <button
                onClick={handleAddEstacion}
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#617589] dark:text-slate-400 uppercase">Estación</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#617589] dark:text-slate-400 uppercase">ID Externo</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#617589] dark:text-slate-400 uppercase">Productos</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#617589] dark:text-slate-400 uppercase">Estado</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
                  {estacionesZona.map((estacion) => (
                    <tr
                      key={estacion.id}
                      className="hover:bg-[#f6f7f8] dark:hover:bg-[#253240] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#1173d4] text-lg">storefront</span>
                          <span className="font-semibold text-[#111418] dark:text-white">{estacion.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {estacion.identificadorExterno ? (
                          <span className="text-xs text-[#617589] dark:text-slate-400 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {estacion.identificadorExterno}
                          </span>
                        ) : (
                          <span className="text-xs text-[#617589] dark:text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditEstacion(estacion)}
                            className="size-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                            title="Editar estación"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEstacion(estacion.id)}
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
      </main>

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
              // Asegurar que la zona ID es la correcta si se está creando
              createEstacionMutation.mutate({ ...data, zonaId: id! })
            }
          }}
          isLoading={createEstacionMutation.isPending || updateEstacionMutation.isPending}
        />
      )}
    </div>
  )
}
