import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { reportesService } from '../services/reportesService'
import axios from 'axios'
import { ArrowLeft, RefreshCw, Calendar, Building2, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface Estacion {
  id: string
  nombre: string
  identificadorExterno: string | null
  zonaNombre?: string
}

interface ReprocesarResult {
  success: boolean
  message: string
  resultado: {
    estacion: {
      id: string
      nombre: string
      identificador_externo: string
    }
    rango: {
      fechaInicio: string
      fechaFin: string
    }
    creados: number
    actualizados: number
    errores: number
    detalles: Array<{
      fecha: string
      estado: string
      premium_litros?: number
      magna_litros?: number
      diesel_litros?: number
      mensaje?: string
    }>
  }
}

export default function AdminReprocesar() {
  const [estacionSeleccionada, setEstacionSeleccionada] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [resultado, setResultado] = useState<ReprocesarResult | null>(null)

  // Obtener todas las estaciones
  const { data: estaciones, isLoading: isLoadingEstaciones } = useQuery<Estacion[]>({
    queryKey: ['estaciones-todas'],
    queryFn: reportesService.getEstaciones,
  })

  // Mutación para reprocesar
  const reprocesarMutation = useMutation({
    mutationFn: async (data: { estacionId: string; fechaInicio: string; fechaFin: string }) => {
      const response = await api.post('/reportes/reprocesar-estacion', data)
      return response.data
    },
    onSuccess: (data) => {
      setResultado(data)
    },
  })

  const handleReprocesar = () => {
    if (!estacionSeleccionada || !fechaInicio || !fechaFin) {
      alert('Por favor completa todos los campos')
      return
    }

    if (fechaInicio > fechaFin) {
      alert('La fecha de inicio debe ser menor o igual a la fecha de fin')
      return
    }

    const estacion = estaciones?.find(e => e.id === estacionSeleccionada)
    if (!estacion?.identificadorExterno) {
      alert('La estación seleccionada no tiene identificador externo configurado')
      return
    }

    if (confirm(`¿Estás seguro de reprocesar la estación "${estacion.nombre}" del ${fechaInicio} al ${fechaFin}?\n\nEsto actualizará los datos existentes con información de la API externa.`)) {
      setResultado(null)
      reprocesarMutation.mutate({
        estacionId: estacionSeleccionada,
        fechaInicio,
        fechaFin,
      })
    }
  }

  const estacionesConIdentificador = estaciones?.filter(e => e.identificadorExterno) || []

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'creado':
      case 'actualizado':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
      case 'error_mapeo':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'sin_datos':
        return <Info className="w-4 h-4 text-gray-400" />
      default:
        return null
    }
  }

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'creado':
        return 'Creado'
      case 'actualizado':
        return 'Actualizado'
      case 'error':
        return 'Error'
      case 'error_mapeo':
        return 'Error de mapeo'
      case 'sin_datos':
        return 'Sin datos'
      default:
        return estado
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Reprocesar Estación</h1>
          <p className="text-gray-600 mt-2">
            Actualiza los datos de una estación consultando la API externa día por día
          </p>
        </div>

        {/* Advertencia */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Importante</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Esta operación consultará la API externa día por día y actualizará los reportes existentes.
                Solo disponible para estaciones con identificador externo configurado.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-6">
            {/* Seleccionar Estación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Estación
              </label>
              {isLoadingEstaciones ? (
                <p className="text-gray-500">Cargando estaciones...</p>
              ) : estacionesConIdentificador.length === 0 ? (
                <p className="text-red-600">No hay estaciones con identificador externo configurado</p>
              ) : (
                <select
                  value={estacionSeleccionada}
                  onChange={(e) => setEstacionSeleccionada(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={reprocesarMutation.isPending}
                >
                  <option value="">Seleccionar estación...</option>
                  {estacionesConIdentificador.map((estacion) => (
                    <option key={estacion.id} value={estacion.id}>
                      {estacion.nombre} ({estacion.identificadorExterno})
                      {estacion.zonaNombre && ` - ${estacion.zonaNombre}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Fecha Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={reprocesarMutation.isPending}
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Fecha Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={reprocesarMutation.isPending}
              />
            </div>

            {/* Botón Reprocesar */}
            <button
              onClick={handleReprocesar}
              disabled={reprocesarMutation.isPending || !estacionSeleccionada || !fechaInicio || !fechaFin}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {reprocesarMutation.isPending ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Reprocesando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Reprocesar Estación
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mensaje de Error */}
        {reprocesarMutation.isError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">
                  {(reprocesarMutation.error as any)?.response?.data?.message || 'Error al reprocesar estación'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resultado del Reprocesamiento</h2>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Estación</p>
                <p className="text-2xl font-bold text-blue-900">
                  {resultado.resultado.estacion.nombre}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  ID Externo: {resultado.resultado.estacion.identificador_externo}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Creados</p>
                <p className="text-2xl font-bold text-green-900">{resultado.resultado.creados}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-600 font-medium">Actualizados</p>
                <p className="text-2xl font-bold text-yellow-900">{resultado.resultado.actualizados}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium">Errores</p>
                <p className="text-2xl font-bold text-red-900">{resultado.resultado.errores}</p>
              </div>
            </div>

            {/* Detalles por día */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles por Día</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Premium (L)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Magna (L)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Diesel (L)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Mensaje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {resultado.resultado.detalles.map((detalle, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(detalle.fecha + 'T00:00:00').toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {getEstadoIcon(detalle.estado)}
                            <span className="ml-2 text-sm text-gray-900">
                              {getEstadoTexto(detalle.estado)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {detalle.premium_litros !== undefined ? detalle.premium_litros.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {detalle.magna_litros !== undefined ? detalle.magna_litros.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {detalle.diesel_litros !== undefined ? detalle.diesel_litros.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {detalle.mensaje || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
