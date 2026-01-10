import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AdminHeader from '../components/AdminHeader'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  productosService,
  Producto,
  CreateProductoData,
  UpdateProductoData,
} from '../services/productosService'

export default function AdminProductos() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showModal, setShowModal] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: productosService.getProductos,
  })

  const createProductoMutation = useMutation({
    mutationFn: (data: CreateProductoData) => productosService.createProducto(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      setShowModal(false)
      setSaveMessage({ type: 'success', text: 'Producto creado exitosamente' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: (error: any) => {
      setSaveMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al crear el producto',
      })
      setTimeout(() => setSaveMessage(null), 3000)
    },
  })

  const updateProductoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductoData }) =>
      productosService.updateProducto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      setShowModal(false)
      setSelectedProducto(null)
      setSaveMessage({ type: 'success', text: 'Producto actualizado exitosamente' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: (error: any) => {
      setSaveMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al actualizar el producto',
      })
      setTimeout(() => setSaveMessage(null), 3000)
    },
  })

  const deleteProductoMutation = useMutation({
    mutationFn: (id: string) => productosService.deleteProducto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      setSaveMessage({ type: 'success', text: 'Producto eliminado exitosamente' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: (error: any) => {
      setSaveMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al eliminar el producto',
      })
      setTimeout(() => setSaveMessage(null), 3000)
    },
  })

  const handleEdit = (producto: Producto) => {
    setSelectedProducto(producto)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      deleteProductoMutation.mutate(id)
    }
  }

  // Agrupar productos por tipo
  const productosPorTipo = {
    premium: productos.filter((p) => p.tipo_producto === 'premium'),
    magna: productos.filter((p) => p.tipo_producto === 'magna'),
    diesel: productos.filter((p) => p.tipo_producto === 'diesel'),
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <AdminHeader title="Catálogo de Productos" icon="inventory_2" />

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
              Catálogo de Productos
            </h1>
            <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
              <span className="material-symbols-outlined text-[20px]">info</span>
              <p className="text-base font-normal">
                Administra el catálogo de productos para mapear los nombres de la API externa a nombres de visualización.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedProducto(null)
              setShowModal(true)
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#1173d4] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-600 transition-all hover:shadow-lg"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Nuevo Producto</span>
          </button>
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

        {/* Contenedor General de Productos */}
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          {/* Header del contenedor */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#e6e8eb] dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-[#1173d4]/10 dark:bg-[#1173d4]/20 p-3 text-[#1173d4]">
                <span className="material-symbols-outlined text-3xl">inventory_2</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#111418] dark:text-white">Productos</h3>
                <p className="text-sm text-[#617589] dark:text-slate-400 mt-1">
                  {productos.length} {productos.length === 1 ? 'producto' : 'productos'} configurado
                  {productos.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          </div>

          {/* Cards de productos por tipo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['premium', 'magna', 'diesel'] as const).map((tipo) => {
              const productosTipo = productosPorTipo[tipo]
              const tipoLabels = {
                premium: 'Premium',
                magna: 'Magna',
                diesel: 'Diesel',
              }
              // Colores consistentes con los reportes
              const tipoColors = {
                premium: {
                  bg: 'bg-red-50 dark:bg-red-900/30',
                  text: 'text-red-600 dark:text-red-400',
                  border: 'border-red-200 dark:border-red-800',
                  cardBg: 'bg-red-50/50 dark:bg-red-900/20',
                  cardBorder: 'border-red-200 dark:border-red-800/50',
                },
                magna: {
                  bg: 'bg-green-50 dark:bg-green-900/30',
                  text: 'text-green-600 dark:text-green-400',
                  border: 'border-green-200 dark:border-green-800',
                  cardBg: 'bg-green-50/50 dark:bg-green-900/20',
                  cardBorder: 'border-green-200 dark:border-green-800/50',
                },
                diesel: {
                  bg: 'bg-gray-100 dark:bg-gray-800/50',
                  text: 'text-gray-700 dark:text-gray-300',
                  border: 'border-gray-300 dark:border-gray-700',
                  cardBg: 'bg-gray-50/50 dark:bg-gray-800/30',
                  cardBorder: 'border-gray-300 dark:border-gray-700/50',
                },
              }
              const colors = tipoColors[tipo]

              return (
                <div
                  key={tipo}
                  className={`rounded-xl border-2 ${colors.cardBorder} ${colors.cardBg} p-5 hover:shadow-lg transition-all duration-200`}
                >
                  {/* Header de la card por tipo */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${colors.bg} ${colors.text}`}>
                        <span className="material-symbols-outlined text-2xl">local_gas_station</span>
                      </div>
                      <div>
                        <h4 className={`text-lg font-bold ${colors.text}`}>{tipoLabels[tipo]}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Lista de productos */}
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {productosTipo.length === 0 ? (
                      <div className="text-center py-6 text-[#617589] dark:text-slate-400">
                        <span className="material-symbols-outlined text-3xl mb-2">inventory</span>
                        <p className="text-sm">No hay productos configurados</p>
                      </div>
                    ) : (
                      productosTipo.map((producto) => (
                        <div
                          key={producto.id}
                          className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/50 p-3 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h5 className="font-semibold text-[#111418] dark:text-white text-sm mb-1">
                                {producto.nombre_display}
                              </h5>
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
                                API: {producto.nombre_api}
                              </span>
                            </div>
                            {producto.activo ? (
                              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded text-xs font-semibold">
                                Activo
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs font-semibold">
                                Inactivo
                              </span>
                            )}
                          </div>

                          {/* Acciones */}
                          <div className="flex items-center justify-end gap-2 pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                            <button
                              onClick={() => handleEdit(producto)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all hover:scale-105 active:scale-95 text-xs font-medium"
                              title="Editar producto"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleDelete(producto.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all hover:scale-105 active:scale-95 text-xs font-medium"
                              title="Eliminar producto"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Modal para crear/editar Producto */}
      {showModal && (
        <ProductoModal
          producto={selectedProducto}
          onClose={() => {
            setShowModal(false)
            setSelectedProducto(null)
          }}
          onSave={(data) => {
            if (selectedProducto) {
              updateProductoMutation.mutate({ id: selectedProducto.id, data })
            } else {
              createProductoMutation.mutate(data)
            }
          }}
          isLoading={createProductoMutation.isPending || updateProductoMutation.isPending}
        />
      )}
    </div>
  )
}

// Modal para crear/editar Producto
function ProductoModal({
  producto,
  onClose,
  onSave,
  isLoading,
}: {
  producto: Producto | null
  onClose: () => void
  onSave: (data: CreateProductoData | UpdateProductoData) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    nombre_api: producto?.nombre_api || '',
    nombre_display: producto?.nombre_display || '',
    tipo_producto: producto?.tipo_producto || ('premium' as 'premium' | 'magna' | 'diesel'),
    activo: producto?.activo !== undefined ? producto.activo : true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre_api.trim() || !formData.nombre_display.trim()) {
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white">
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
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
              Nombre en la API *
            </label>
            <input
              type="text"
              value={formData.nombre_api}
              onChange={(e) => setFormData({ ...formData, nombre_api: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
              placeholder="Ej: 87 Octanos"
            />
            <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
              Nombre exacto como viene de la API externa
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Nombre para Mostrar *
            </label>
            <input
              type="text"
              value={formData.nombre_display}
              onChange={(e) => setFormData({ ...formData, nombre_display: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
              placeholder="Ej: Magna"
            />
            <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
              Nombre que se mostrará en los reportes
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">Tipo de Producto *</label>
            <select
              value={formData.tipo_producto}
              onChange={(e) =>
                setFormData({ ...formData, tipo_producto: e.target.value as 'premium' | 'magna' | 'diesel' })
              }
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
            >
              <option value="premium">Premium</option>
              <option value="magna">Magna</option>
              <option value="diesel">Diesel</option>
            </select>
          </div>

          {producto && (
            <div className="flex items-center justify-between p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700">
              <div>
                <p className="font-semibold text-[#111418] dark:text-white">Estado</p>
                <p className="text-sm text-[#617589] dark:text-slate-400">Activar o desactivar el producto</p>
              </div>
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
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
                  <span>{producto ? 'Actualizar' : 'Crear'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

