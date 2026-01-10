import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usuariosService, UsuarioCompleto, CreateUsuarioData, UpdateUsuarioData, Zona, Estacion } from '../services/usuariosService'
import { reportesService } from '../services/reportesService'
import { Role } from '../types/auth'
import AdminHeader from '../components/AdminHeader'

export default function AdminUsuarios() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioCompleto | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Obtener usuarios
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: usuariosService.getUsuarios,
  })

  // Obtener zonas
  const { data: zonas = [] } = useQuery({
    queryKey: ['zonas'],
    queryFn: usuariosService.getZonas,
  })

  // Obtener estaciones
  const { data: estaciones = [] } = useQuery({
    queryKey: ['estaciones'],
    queryFn: reportesService.getEstaciones,
  })

  // Crear usuario
  const createMutation = useMutation({
    mutationFn: usuariosService.createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setShowCreateModal(false)
    },
  })

  // Actualizar usuario
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUsuarioData }) =>
      usuariosService.updateUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setShowEditModal(false)
      setSelectedUsuario(null)
    },
  })

  // Eliminar usuario
  const deleteMutation = useMutation({
    mutationFn: usuariosService.deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setDeleteConfirm(null)
    },
  })

  // Asignar estaciones/zonas
  const assignMutation = useMutation({
    mutationFn: ({ id, estaciones, zonas }: { id: string; estaciones: string[]; zonas: string[] }) =>
      Promise.all([
        usuariosService.asignarEstaciones(id, estaciones),
        usuariosService.asignarZonas(id, zonas),
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setShowAssignModal(false)
      setSelectedUsuario(null)
    },
  })

  const handleEdit = (usuario: UsuarioCompleto) => {
    setSelectedUsuario(usuario)
    setShowEditModal(true)
  }

  const handleAssign = (usuario: UsuarioCompleto) => {
    setSelectedUsuario(usuario)
    setShowAssignModal(true)
  }

  const handleDelete = (id: string) => {
    if (id === user?.id) {
      alert('No puedes eliminar tu propio usuario')
      return
    }
    deleteMutation.mutate(id)
  }

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case Role.Administrador:
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
      case Role.GerenteEstacion:
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
      case Role.GerenteZona:
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
      case Role.Direccion:
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <AdminHeader title="Gestión de Usuarios" icon="people" />

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        {/* Page Heading & Actions */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
              Administración de Usuarios
            </h1>
            <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
              <span className="material-symbols-outlined text-[20px]">group</span>
              <p className="text-base font-normal">Gestiona usuarios, roles y asignaciones del sistema</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/reportes')}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#1a2632] px-4 py-2.5 text-sm font-bold text-[#111418] dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-[#253240] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              <span>Filtros</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#1173d4] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-600 transition-all hover:shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#e6e8eb] dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#111418] dark:text-white">Lista de Usuarios</h3>
              <p className="text-sm text-[#617589] dark:text-slate-400">Total: {usuarios.length} usuarios registrados</p>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                search
              </span>
              <input
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent outline-none w-full md:w-64 transition-all"
                placeholder="Buscar usuario..."
                type="text"
              />
            </div>
          </div>
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1173d4] mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#617589] dark:text-slate-400">
                <thead className="bg-gray-50 dark:bg-[#101922] text-xs uppercase text-[#617589] dark:text-slate-500 font-bold">
                  <tr>
                    <th className="px-6 py-4" scope="col">
                      Usuario
                    </th>
                    <th className="px-6 py-4" scope="col">
                      Rol
                    </th>
                    <th className="px-6 py-4" scope="col">
                      Estaciones
                    </th>
                    <th className="px-6 py-4" scope="col">
                      Zonas
                    </th>
                    <th className="px-6 py-4 text-right" scope="col">
                      Fecha Creación
                    </th>
                    <th className="px-6 py-4 text-center" scope="col">
                      Estado
                    </th>
                    <th className="px-6 py-4" scope="col"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700 border-t border-[#e6e8eb] dark:border-slate-700">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2632] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#111418] dark:text-white flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#1173d4]"></div>
                        <div>
                          <div className="font-semibold">{usuario.name}</div>
                          <div className="text-xs text-[#617589] dark:text-slate-400">{usuario.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${getRoleBadgeColor(usuario.role)}`}>
                          {usuario.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {usuario.estaciones.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {usuario.estaciones.slice(0, 2).map((est) => (
                              <span
                                key={est.id}
                                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium"
                              >
                                {est.nombre}
                              </span>
                            ))}
                            {usuario.estaciones.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
                                +{usuario.estaciones.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#617589] dark:text-slate-400 text-xs">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {usuario.zonas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {usuario.zonas.slice(0, 2).map((zona) => (
                              <span
                                key={zona.id}
                                className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-medium"
                              >
                                {zona.nombre}
                              </span>
                            ))}
                            {usuario.zonas.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
                                +{usuario.zonas.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#617589] dark:text-slate-400 text-xs">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-display text-[#111418] dark:text-white">
                        {new Date(usuario.createdAt).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="material-symbols-outlined text-green-600 text-lg" title="Activo">
                          check_circle
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2 w-[120px] ml-auto">
                          <button
                            onClick={() => handleEdit(usuario)}
                            className="size-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleAssign(usuario)}
                            className="size-9 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                            title="Asignar Estaciones/Zonas"
                          >
                            <span className="material-symbols-outlined text-lg">settings</span>
                          </button>
                          {usuario.id !== user?.id ? (
                            <button
                              onClick={() => setDeleteConfirm(usuario.id)}
                              className="size-9 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                              title="Eliminar"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          ) : (
                            <div className="size-9" aria-hidden="true"></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {usuarios.length === 0 && !isLoading && (
            <div className="p-8 text-center text-[#617589] dark:text-slate-400">
              No hay usuarios registrados aún
            </div>
          )}
        </div>
      </main>

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <CreateUsuarioModal
          zonas={zonas}
          estaciones={estaciones}
          onClose={() => setShowCreateModal(false)}
          onCreate={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Modal Editar Usuario */}
      {showEditModal && selectedUsuario && (
        <EditUsuarioModal
          usuario={selectedUsuario}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUsuario(null)
          }}
          onUpdate={(data) => updateMutation.mutate({ id: selectedUsuario.id, data })}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Modal Asignar Estaciones/Zonas */}
      {showAssignModal && selectedUsuario && (
        <AssignModal
          usuario={selectedUsuario}
          zonas={zonas}
          estaciones={estaciones}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedUsuario(null)
          }}
          onAssign={(estaciones, zonas) =>
            assignMutation.mutate({ id: selectedUsuario.id, estaciones, zonas })
          }
          isLoading={assignMutation.isPending}
        />
      )}

      {/* Confirmación de Eliminación */}
      {deleteConfirm && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

// Modal para crear usuario
function CreateUsuarioModal({
  zonas,
  estaciones,
  onClose,
  onCreate,
  isLoading,
}: {
  zonas: Zona[]
  estaciones: Estacion[]
  onClose: () => void
  onCreate: (data: CreateUsuarioData) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<CreateUsuarioData>({
    email: '',
    password: '',
    name: '',
    role: Role.GerenteEstacion,
    estaciones: [],
    zonas: [],
  })
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.name || !formData.role) {
      setError('Email, nombre y rol son requeridos')
      return
    }

    if (!formData.password) {
      setError('La contraseña es requerida')
      return
    }

    onCreate(formData)
  }

  return (
    <div className="fixed inset-0 bg-gray-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white">Nuevo Usuario</h2>
          <button onClick={onClose} className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-1">Contraseña *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-1">Rol *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
            >
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-1">Estaciones</label>
            <select
              multiple
              value={formData.estaciones}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estaciones: Array.from(e.target.selectedOptions, (option) => option.value),
                })
              }
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              size={4}
            >
              {estaciones.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.nombre} ({est.zonaNombre})
                </option>
              ))}
            </select>
            <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
              Mantén presionado Ctrl/Cmd para seleccionar múltiples
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-1">Zonas</label>
            <select
              multiple
              value={formData.zonas}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  zonas: Array.from(e.target.selectedOptions, (option) => option.value),
                })
              }
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              size={4}
            >
              {zonas.map((zona) => (
                <option key={zona.id} value={zona.id}>
                  {zona.nombre}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
              Mantén presionado Ctrl/Cmd para seleccionar múltiples
            </p>
          </div>

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
              className="px-4 py-2 bg-[#1173d4] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal para editar usuario
function EditUsuarioModal({
  usuario,
  onClose,
  onUpdate,
  isLoading,
}: {
  usuario: UsuarioCompleto
  onClose: () => void
  onUpdate: (data: UpdateUsuarioData) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<UpdateUsuarioData>({
    email: usuario.email,
    name: usuario.name,
    role: usuario.role,
    password: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.name || !formData.role) {
      setError('Email, nombre y rol son requeridos')
      return
    }

    const dataToUpdate = { ...formData }
    if (!dataToUpdate.password || dataToUpdate.password === '') {
      delete dataToUpdate.password
    }

    onUpdate(dataToUpdate)
  }

  return (
    <div className="fixed inset-0 bg-gray-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white">Editar Usuario</h2>
          <button onClick={onClose} className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-1">
              Nueva Contraseña (dejar vacío para no cambiar)
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-1">Rol *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
            >
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

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
              className="px-4 py-2 bg-[#1173d4] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal para asignar estaciones y zonas
function AssignModal({
  usuario,
  zonas,
  estaciones,
  onClose,
  onAssign,
  isLoading,
}: {
  usuario: UsuarioCompleto
  zonas: Zona[]
  estaciones: Estacion[]
  onClose: () => void
  onAssign: (estaciones: string[], zonas: string[]) => void
  isLoading: boolean
}) {
  const [selectedEstaciones, setSelectedEstaciones] = useState<string[]>(
    usuario.estaciones.map((e) => e.id)
  )
  const [selectedZonas, setSelectedZonas] = useState<string[]>(usuario.zonas.map((z) => z.id))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAssign(selectedEstaciones, selectedZonas)
  }

  return (
    <div className="fixed inset-0 bg-gray-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white">
            Asignar Estaciones y Zonas - {usuario.name}
          </h2>
          <button onClick={onClose} className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">Estaciones</label>
            <select
              multiple
              value={selectedEstaciones}
              onChange={(e) =>
                setSelectedEstaciones(Array.from(e.target.selectedOptions, (option) => option.value))
              }
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              size={6}
            >
              {estaciones.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.nombre} ({est.zonaNombre})
                </option>
              ))}
            </select>
            <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
              Mantén presionado Ctrl/Cmd para seleccionar múltiples
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">Zonas</label>
            <select
              multiple
              value={selectedZonas}
              onChange={(e) =>
                setSelectedZonas(Array.from(e.target.selectedOptions, (option) => option.value))
              }
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              size={6}
            >
              {zonas.map((zona) => (
                <option key={zona.id} value={zona.id}>
                  {zona.nombre}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
              Mantén presionado Ctrl/Cmd para seleccionar múltiples
            </p>
          </div>

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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar Asignaciones'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal de confirmación para eliminar
function DeleteConfirmModal({
  onConfirm,
  onCancel,
  isLoading,
}: {
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  return (
    <div className="fixed inset-0 bg-gray-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-4">Confirmar Eliminación</h2>
          <p className="text-[#617589] dark:text-slate-400 mb-6">
            ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-[#111418] dark:text-white bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
