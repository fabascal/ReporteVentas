import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  rolesService,
  Role as RoleItem,
  CreateRoleData,
  UpdateRoleData,
} from '../../services/rolesService'
import { sileo } from 'sileo'

type FormState = {
  codigo: string
  nombre: string
  descripcion: string
  activo: boolean
  orden: number
}

export default function VistaRoles() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RoleItem | null>(null)

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesService.getRoles,
  })

  const createRoleMutation = useMutation({
    mutationFn: (data: CreateRoleData) => rolesService.createRole(data),
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setIsModalOpen(false)
      setEditingRole(null)
      sileo.success({ title: `Rol ${role.nombre} creado correctamente` })
    },
    onError: (error: any) => {
      sileo.error({ title: error?.response?.data?.message || 'No se pudo crear el rol' })
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleData }) =>
      rolesService.updateRole(id, data),
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setIsModalOpen(false)
      setEditingRole(null)
      sileo.success({ title: `Rol ${role.nombre} actualizado correctamente` })
    },
    onError: (error: any) => {
      sileo.error({ title: error?.response?.data?.message || 'No se pudo actualizar el rol' })
    },
  })

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => rolesService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setDeleteTarget(null)
      sileo.success({ title: 'Rol eliminado correctamente' })
    },
    onError: (error: any) => {
      sileo.error({ title: error?.response?.data?.message || 'No se pudo eliminar el rol' })
    },
  })

  const openCreate = () => {
    setEditingRole(null)
    setIsModalOpen(true)
  }

  const openEdit = (role: RoleItem) => {
    setEditingRole(role)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-2 text-indigo-600 dark:text-indigo-400">
              <span className="material-symbols-outlined text-2xl">shield_person</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#111418] dark:text-white">Gestión de Roles</h3>
              <p className="text-sm text-[#617589] dark:text-slate-400">
                Crea y administra roles del sistema
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 bg-[#1173d4] text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Nuevo Rol
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
            <p>Cargando roles...</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-10 text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">shield_person</span>
            <p>No hay roles registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#e6e8eb] dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">Código</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">Nombre</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">Descripción</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">Orden</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">Estado</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    className="border-b border-[#e6e8eb] dark:border-slate-700 hover:bg-[#f6f7f8] dark:hover:bg-[#253240] transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-mono text-[#111418] dark:text-white">{role.codigo}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">{role.nombre}</td>
                    <td className="py-3 px-4 text-sm text-[#617589] dark:text-slate-400">
                      {role.descripcion || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-[#111418] dark:text-white">{role.orden}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          role.activo
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {role.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(role)}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(role)}
                          className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                        >
                          Eliminar
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

      {isModalOpen && (
        <RoleModal
          role={editingRole}
          isLoading={createRoleMutation.isPending || updateRoleMutation.isPending}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingRole(null)
          }}
          onSave={(data) => {
            if (editingRole) {
              updateRoleMutation.mutate({ id: editingRole.id, data })
            } else {
              createRoleMutation.mutate(data as CreateRoleData)
            }
          }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm dark:bg-black/50">
          <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-2">Eliminar rol</h3>
            <p className="text-sm text-[#617589] dark:text-slate-400 mb-6">
              ¿Deseas eliminar el rol <strong>{deleteTarget.nombre}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-[#dbe0e6] dark:border-slate-600 text-[#111418] dark:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteRoleMutation.mutate(deleteTarget.id)}
                disabled={deleteRoleMutation.isPending}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
              >
                {deleteRoleMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RoleModal({
  role,
  onCancel,
  onSave,
  isLoading,
}: {
  role: RoleItem | null
  onCancel: () => void
  onSave: (data: CreateRoleData | UpdateRoleData) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<FormState>({
    codigo: role?.codigo || '',
    nombre: role?.nombre || '',
    descripcion: role?.descripcion || '',
    activo: role?.activo ?? true,
    orden: role?.orden ?? 0,
  })
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      setError('Código y nombre son requeridos')
      return
    }

    if (!/^[A-Za-z0-9_]+$/.test(formData.codigo.trim())) {
      setError('El código solo puede tener letras, números y guion bajo')
      return
    }

    const payload = {
      codigo: formData.codigo.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || undefined,
      activo: formData.activo,
      orden: Number(formData.orden) || 0,
    }

    onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm dark:bg-black/50">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-xl max-w-lg w-full">
        <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <h3 className="text-xl font-bold text-[#111418] dark:text-white">
            {role ? 'Editar Rol' : 'Nuevo Rol'}
          </h3>
          <button onClick={onCancel} className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg border bg-red-50 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Código *
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData((prev) => ({ ...prev, codigo: e.target.value }))}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white"
              placeholder="SupervisorOperativo"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white"
              placeholder="Supervisor Operativo"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                Orden
              </label>
              <input
                type="number"
                value={formData.orden}
                onChange={(e) => setFormData((prev) => ({ ...prev, orden: Number(e.target.value) || 0 }))}
                className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#111418] dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, activo: e.target.checked }))}
                  className="size-4"
                />
                Rol activo
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-[#dbe0e6] dark:border-slate-600 text-[#111418] dark:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-[#1173d4] hover:bg-blue-600 text-white disabled:opacity-60"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
