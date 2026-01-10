import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  productosService,
  Producto,
  CreateProductoData,
  UpdateProductoData,
} from '../../services/productosService'

export default function VistaProductos() {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: CreateProductoData | UpdateProductoData = {
      nombre_api: formData.get('nombre_api') as string,
      nombre_display: formData.get('nombre_display') as string,
      tipo_producto: formData.get('tipo_producto') as 'premium' | 'magna' | 'diesel',
      activo: formData.get('activo') === 'true',
    }

    if (selectedProducto) {
      updateProductoMutation.mutate({ id: selectedProducto.id, data })
    } else {
      createProductoMutation.mutate(data as CreateProductoData)
    }
  }

  // Agrupar productos por tipo
  const productosPorTipo = {
    premium: productos.filter((p) => p.tipo_producto === 'premium'),
    magna: productos.filter((p) => p.tipo_producto === 'magna'),
    diesel: productos.filter((p) => p.tipo_producto === 'diesel'),
  }

  return (
    <>
      {saveMessage && (
        <div
          className={`mb-4 rounded-lg p-4 ${
            saveMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#111418] dark:text-white">Catálogo de Productos</h3>
          <p className="text-sm text-[#617589] dark:text-slate-400">Gestiona los productos del sistema</p>
        </div>
        <button
          onClick={() => {
            setSelectedProducto(null)
            setShowModal(true)
          }}
          className="flex items-center gap-2 rounded-lg bg-[#1173d4] px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-blue-600 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Productos por tipo */}
      <div className="space-y-6">
        {/* Premium */}
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <h4 className="text-md font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600">local_gas_station</span>
            Premium
          </h4>
          {productosPorTipo.premium.length === 0 ? (
            <p className="text-sm text-[#617589] dark:text-slate-400">No hay productos Premium</p>
          ) : (
            <div className="space-y-2">
              {productosPorTipo.premium.map((producto) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#e6e8eb] dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-[#101922]"
                >
                  <div>
                    <p className="font-semibold text-[#111418] dark:text-white">{producto.nombre_display}</p>
                    <p className="text-sm text-[#617589] dark:text-slate-400">{producto.nombre_api}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        producto.activo
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {producto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      onClick={() => handleEdit(producto)}
                      className="size-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(producto.id)}
                      className="size-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Magna */}
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <h4 className="text-md font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600">local_gas_station</span>
            Magna
          </h4>
          {productosPorTipo.magna.length === 0 ? (
            <p className="text-sm text-[#617589] dark:text-slate-400">No hay productos Magna</p>
          ) : (
            <div className="space-y-2">
              {productosPorTipo.magna.map((producto) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#e6e8eb] dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-[#101922]"
                >
                  <div>
                    <p className="font-semibold text-[#111418] dark:text-white">{producto.nombre_display}</p>
                    <p className="text-sm text-[#617589] dark:text-slate-400">{producto.nombre_api}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        producto.activo
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {producto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      onClick={() => handleEdit(producto)}
                      className="size-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(producto.id)}
                      className="size-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diesel */}
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <h4 className="text-md font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-600">local_gas_station</span>
            Diesel
          </h4>
          {productosPorTipo.diesel.length === 0 ? (
            <p className="text-sm text-[#617589] dark:text-slate-400">No hay productos Diesel</p>
          ) : (
            <div className="space-y-2">
              {productosPorTipo.diesel.map((producto) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#e6e8eb] dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-[#101922]"
                >
                  <div>
                    <p className="font-semibold text-[#111418] dark:text-white">{producto.nombre_display}</p>
                    <p className="text-sm text-[#617589] dark:text-slate-400">{producto.nombre_api}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        producto.activo
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {producto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      onClick={() => handleEdit(producto)}
                      className="size-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(producto.id)}
                      className="size-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm dark:bg-black/50">
          <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl max-w-md w-full border border-[#e6e8eb] dark:border-slate-700">
            <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
              <h3 className="text-lg font-bold text-[#111418] dark:text-white">
                {selectedProducto ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedProducto(null)
                }}
                className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#617589] dark:text-slate-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111418] dark:text-white mb-2">
                  Nombre API
                </label>
                <input
                  type="text"
                  name="nombre_api"
                  defaultValue={selectedProducto?.nombre_api || ''}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1173d4]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111418] dark:text-white mb-2">
                  Nombre Display
                </label>
                <input
                  type="text"
                  name="nombre_display"
                  defaultValue={selectedProducto?.nombre_display || ''}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1173d4]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111418] dark:text-white mb-2">
                  Tipo de Producto
                </label>
                <select
                  name="tipo_producto"
                  defaultValue={selectedProducto?.tipo_producto || 'premium'}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1173d4]"
                >
                  <option value="premium">Premium</option>
                  <option value="magna">Magna</option>
                  <option value="diesel">Diesel</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="activo"
                    defaultChecked={selectedProducto?.activo ?? true}
                    value="true"
                    className="rounded border-[#e6e8eb] dark:border-slate-700"
                  />
                  <span className="text-sm font-medium text-[#111418] dark:text-white">Activo</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[#1173d4] px-4 py-2 text-sm font-bold text-white hover:bg-blue-600 transition-colors"
                >
                  {selectedProducto ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedProducto(null)
                  }}
                  className="flex-1 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#101922] px-4 py-2 text-sm font-bold text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a2632] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

