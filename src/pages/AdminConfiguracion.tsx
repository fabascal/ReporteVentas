import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import AdminHeader from '../components/AdminHeader'
import { configuracionService } from '../services/configuracionService'
import { menusService, MenuItem, CreateMenuData, UpdateMenuData } from '../services/menusService'
import { Role } from '../types/auth'
import VistaUsuarios from '../components/views/VistaUsuarios'
import VistaZonasEstaciones from '../components/views/VistaZonasEstaciones'
import VistaProductos from '../components/views/VistaProductos'

export default function AdminConfiguracion() {
  const { user } = useAuth()

  // Estados para las configuraciones
  const [generalConfig, setGeneralConfig] = useState({
    nombreSistema: 'RepVtas',
    idioma: 'es',
    zonaHoraria: 'America/Mexico_City',
    formatoFecha: 'DD/MM/YYYY',
  })

  const [notificacionesConfig, setNotificacionesConfig] = useState({
    emailNotificaciones: true,
    notificacionesPush: false,
    reportesDiarios: true,
    alertasCriticas: true,
  })

  const [seguridadConfig, setSeguridadConfig] = useState({
    sesionTimeout: 30,
    requerir2FA: false,
    longitudMinimaPassword: 8,
    historialPasswords: 5,
  })

  const [reportesConfig, setReportesConfig] = useState({
    frecuenciaBackup: 'diario',
    retencionReportes: 365,
    formatoExportacion: 'PDF',
    autoAprobacion: false,
  })

  const [apiConfig, setApiConfig] = useState({
    apiUsuario: '',
    apiContrasena: '',
  })

  const [sincronizacionConfig, setSincronizacionConfig] = useState({
    fechaInicio: '',
    fechaFin: '',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSincronizando, setIsSincronizando] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Estado para gestión de menús
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [menuEditando, setMenuEditando] = useState<MenuItem | null>(null)
  const [mostrarFormularioMenu, setMostrarFormularioMenu] = useState(false)
  const queryClient = useQueryClient()

  // Obtener menús desde la base de datos
  const { data: menus = [], isLoading: isLoadingMenus } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menusService.getMenus(),
  })

  // Filtrar menús según el rol seleccionado
  const filteredMenuItems: MenuItem[] = selectedRole
    ? menus.filter((menu) => menu.roles.includes(selectedRole))
    : menus

  // Mutaciones para CRUD de menús
  const createMenuMutation = useMutation({
    mutationFn: (data: CreateMenuData) => menusService.createMenu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
      queryClient.invalidateQueries({ queryKey: ['menus', selectedRole] })
      setMostrarFormularioMenu(false)
      setMenuEditando(null)
      setSaveMessage({ type: 'success', text: 'Menú creado exitosamente' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: (error: any) => {
      setSaveMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error al crear menú',
      })
      setTimeout(() => setSaveMessage(null), 5000)
    },
  })

  const updateMenuMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuData }) =>
      menusService.updateMenu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
      queryClient.invalidateQueries({ queryKey: ['menus', selectedRole] })
      setMostrarFormularioMenu(false)
      setMenuEditando(null)
      setSaveMessage({ type: 'success', text: 'Menú actualizado exitosamente' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: (error: any) => {
      setSaveMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error al actualizar menú',
      })
      setTimeout(() => setSaveMessage(null), 5000)
    },
  })

  const deleteMenuMutation = useMutation({
    mutationFn: (id: string) => menusService.deleteMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
      queryClient.invalidateQueries({ queryKey: ['menus', selectedRole] })
      setSaveMessage({ type: 'success', text: 'Menú eliminado exitosamente' })
      setTimeout(() => setSaveMessage(null), 3000)
    },
    onError: (error: any) => {
      setSaveMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error al eliminar menú',
      })
      setTimeout(() => setSaveMessage(null), 5000)
    },
  })

  const handleEditarMenu = (menu: MenuItem) => {
    setMenuEditando(menu)
    setMostrarFormularioMenu(true)
  }

  const handleNuevoMenu = () => {
    setMenuEditando(null)
    setMostrarFormularioMenu(true)
  }

  const handleCancelarFormulario = () => {
    setMenuEditando(null)
    setMostrarFormularioMenu(false)
  }

  // Estado para tabs de configuración
  type ConfigTab = 'menus' | 'usuarios' | 'zonas' | 'productos' | 'general' | 'notificaciones' | 'seguridad' | 'api' | 'sincronizacion' | 'reportes'
  const [activeTab, setActiveTab] = useState<ConfigTab>('menus')

  // Cargar configuración de API al montar el componente
  useEffect(() => {
    const cargarConfiguracionAPI = async () => {
      try {
        setIsLoading(true)
        const config = await configuracionService.getConfiguracionAPI()
        setApiConfig(config)
      } catch (error) {
        console.error('Error al cargar configuración de API:', error)
      } finally {
        setIsLoading(false)
      }
    }

    cargarConfiguracionAPI()
  }, [])

  const handleSave = async (section: string) => {
    setIsSaving(true)
    setSaveMessage(null)

    // Simular guardado
    setTimeout(() => {
      setIsSaving(false)
      setSaveMessage({ type: 'success', text: `${section} guardada exitosamente` })
      setTimeout(() => setSaveMessage(null), 3000)
    }, 1000)
  }

  const handleSaveAPI = async () => {
    if (!apiConfig.apiUsuario || !apiConfig.apiContrasena) {
      setSaveMessage({ type: 'error', text: 'Por favor completa usuario y contraseña' })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    setIsSaving(true)
    setSaveMessage(null)

    try {
      await configuracionService.updateConfiguracionAPI(apiConfig)
      setSaveMessage({ type: 'success', text: 'Configuración de API guardada exitosamente' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error: any) {
      console.error('Error al guardar configuración:', error)
      setSaveMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al guardar la configuración de API',
      })
      setTimeout(() => setSaveMessage(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTestMessage(null)

    if (!apiConfig.apiUsuario || !apiConfig.apiContrasena) {
      setTestMessage({ type: 'error', text: 'Por favor ingresa usuario y contraseña' })
      setTimeout(() => setTestMessage(null), 3000)
      return
    }

    try {
      setIsLoading(true)
      const result = await configuracionService.probarConexion(
        apiConfig.apiUsuario,
        apiConfig.apiContrasena
      )

      if (result.success) {
        setTestMessage({ type: 'success', text: result.message })
      } else {
        setTestMessage({ type: 'error', text: result.message })
      }
      setTimeout(() => setTestMessage(null), 5000)
    } catch (error: any) {
      setTestMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al probar la conexión',
      })
      setTimeout(() => setTestMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSincronizar = async () => {
    if (!sincronizacionConfig.fechaInicio || !sincronizacionConfig.fechaFin) {
      setSaveMessage({ type: 'error', text: 'Por favor selecciona las fechas de sincronización' })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    setIsSincronizando(true)
    setSaveMessage(null)

    try {
      const resultado = await configuracionService.sincronizarReportes(
        sincronizacionConfig.fechaInicio,
        sincronizacionConfig.fechaFin
      )

      setSaveMessage({
        type: 'success',
        text: `${resultado.message}. Creados: ${resultado.resultado.creados}, Actualizados: ${resultado.resultado.actualizados}, Errores: ${resultado.resultado.errores}`,
      })
      setTimeout(() => setSaveMessage(null), 8000)
    } catch (error: any) {
      setSaveMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al sincronizar reportes',
      })
      setTimeout(() => setSaveMessage(null), 5000)
    } finally {
      setIsSincronizando(false)
    }
  }

  const handleSincronizarEstaciones = async () => {
    if (!sincronizacionConfig.fechaInicio || !sincronizacionConfig.fechaFin) {
      setSaveMessage({ type: 'error', text: 'Por favor selecciona las fechas de sincronización' })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    setIsSincronizando(true)
    setSaveMessage(null)

    try {
      const resultado = await configuracionService.sincronizarEstaciones(
        sincronizacionConfig.fechaInicio,
        sincronizacionConfig.fechaFin
      )

      setSaveMessage({
        type: 'success',
        text: `${resultado.message}. Creadas: ${resultado.resultado.creadas}, Actualizadas: ${resultado.resultado.actualizadas}, Errores: ${resultado.resultado.errores}. Total: ${resultado.resultado.estaciones.length} estaciones`,
      })
      setTimeout(() => setSaveMessage(null), 10000)
    } catch (error: any) {
      setSaveMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al sincronizar estaciones',
      })
      setTimeout(() => setSaveMessage(null), 5000)
    } finally {
      setIsSincronizando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <AdminHeader title="Configuración del Sistema" icon="settings" />

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        {/* Page Heading */}
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
            Configuración del Sistema
          </h1>
          <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <p className="text-base font-normal">Ajusta los parámetros generales del sistema</p>
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

        {/* Tabs de Navegación */}
        <div className="mb-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <nav className="flex flex-wrap gap-2 -mb-px">
            <button
              onClick={() => setActiveTab('menus')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'menus'
                  ? 'border-[#1173d4] text-[#1173d4] dark:text-blue-400'
                  : 'border-transparent text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-2">menu</span>
              Menús
            </button>
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'usuarios'
                  ? 'border-[#1173d4] text-[#1173d4] dark:text-blue-400'
                  : 'border-transparent text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-2">people</span>
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab('zonas')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'zonas'
                  ? 'border-[#1173d4] text-[#1173d4] dark:text-blue-400'
                  : 'border-transparent text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-2">location_on</span>
              Zonas y Estaciones
            </button>
            <button
              onClick={() => setActiveTab('productos')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'productos'
                  ? 'border-[#1173d4] text-[#1173d4] dark:text-blue-400'
                  : 'border-transparent text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-2">inventory_2</span>
              Productos
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-[#1173d4] text-[#1173d4] dark:text-blue-400'
                  : 'border-transparent text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-2">tune</span>
              General
            </button>
            <button
              onClick={() => setActiveTab('notificaciones')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notificaciones'
                  ? 'border-[#1173d4] text-[#1173d4] dark:text-blue-400'
                  : 'border-transparent text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-2">notifications</span>
              Notificaciones
            </button>
            <button
              onClick={() => setActiveTab('seguridad')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'seguridad'
                  ? 'border-[#1173d4] text-[#1173d4] dark:text-blue-400'
                  : 'border-transparent text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-2">security</span>
              Seguridad
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'api'
                  ? 'border-[#1173d4] text-[#1173d4] dark:text-blue-400'
                  : 'border-transparent text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-2">api</span>
              API Externa
            </button>
            <button
              onClick={() => setActiveTab('sincronizacion')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'sincronizacion'
                  ? 'border-[#1173d4] text-[#1173d4] dark:text-blue-400'
                  : 'border-transparent text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-2">sync</span>
              Sincronización
            </button>
            <button
              onClick={() => setActiveTab('reportes')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'reportes'
                  ? 'border-[#1173d4] text-[#1173d4] dark:text-blue-400'
                  : 'border-transparent text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg align-middle mr-2">description</span>
              Reportes
            </button>
          </nav>
        </div>

        {/* Contenido según tab activo */}
        <div className="space-y-6">
          {/* Tab: Usuarios */}
          {activeTab === 'usuarios' && <VistaUsuarios />}

          {/* Tab: Zonas y Estaciones */}
          {activeTab === 'zonas' && <VistaZonasEstaciones />}

          {/* Tab: Productos */}
          {activeTab === 'productos' && <VistaProductos />}

          {/* Tab: Menús */}
          {activeTab === 'menus' && (
          <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-2 text-indigo-600 dark:text-indigo-400">
                  <span className="material-symbols-outlined text-2xl">menu</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111418] dark:text-white">Configuración de Menús</h3>
                  <p className="text-sm text-[#617589] dark:text-slate-400">Gestiona los menús de navegación por rol</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Filtro por Rol */}
              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                  Filtrar por Rol
                </label>
                <select
                  value={selectedRole || 'all'}
                  onChange={(e) => setSelectedRole(e.target.value === 'all' ? null : (e.target.value as Role))}
                  className="w-full md:w-auto px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                >
                  <option value="all">Todos los roles</option>
                  <option value={Role.Administrador}>Administrador</option>
                  <option value={Role.GerenteEstacion}>Gerente de Estación</option>
                  <option value={Role.GerenteZona}>Gerente de Zona</option>
                  <option value={Role.Direccion}>Director</option>
                </select>
              </div>

              {/* Tabla de Menús */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#e6e8eb] dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">Tipo</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">Etiqueta</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">Ruta/Vista</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">Icono</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">Roles</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMenuItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#e6e8eb] dark:border-slate-700 hover:bg-[#f6f7f8] dark:hover:bg-[#253240] transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-[#111418] dark:text-white font-mono">{item.menu_id}</td>
                        <td className="py-3 px-4 text-sm text-[#111418] dark:text-white">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              item.type === 'route'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            }`}
                          >
                            {item.type === 'route' ? 'Ruta' : 'Vista'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-[#111418] dark:text-white">{item.label}</td>
                        <td className="py-3 px-4 text-sm text-[#617589] dark:text-slate-400 font-mono">
                          {item.type === 'route' ? item.path : item.view_id}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#111418] dark:text-white">
                          <span className="material-symbols-outlined text-lg">{item.icon}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-[#111418] dark:text-white">
                          <div className="flex flex-wrap gap-1">
                            {item.roles.map((role) => (
                              <span
                                key={role}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-[#111418] dark:text-white">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditarMenu(item)}
                              className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('¿Estás seguro de eliminar este menú?')) {
                                  deleteMenuMutation.mutate(item.id)
                                }
                              }}
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

              {isLoadingMenus ? (
                <div className="text-center py-8 text-[#617589] dark:text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 animate-spin">sync</span>
                  <p>Cargando menús...</p>
                </div>
              ) : filteredMenuItems.length === 0 ? (
                <div className="text-center py-8 text-[#617589] dark:text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">menu_open</span>
                  <p>No hay items de menú para el rol seleccionado</p>
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  onClick={handleNuevoMenu}
                  className="px-5 py-2.5 bg-[#1173d4] text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  <span>Nuevo Menú</span>
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Tab: General */}
          {activeTab === 'general' && (
          <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-2 text-[#1173d4]">
                  <span className="material-symbols-outlined text-2xl">tune</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111418] dark:text-white">Configuración General</h3>
                  <p className="text-sm text-[#617589] dark:text-slate-400">Parámetros básicos del sistema</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                  Nombre del Sistema
                </label>
                <input
                  type="text"
                  value={generalConfig.nombreSistema}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, nombreSistema: e.target.value })}
                  className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">Idioma</label>
                <select
                  value={generalConfig.idioma}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, idioma: e.target.value })}
                  className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                  Zona Horaria
                </label>
                <select
                  value={generalConfig.zonaHoraria}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, zonaHoraria: e.target.value })}
                  className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                >
                  <option value="America/Mexico_City">México (GMT-6)</option>
                  <option value="America/New_York">Nueva York (GMT-5)</option>
                  <option value="America/Los_Angeles">Los Ángeles (GMT-8)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                  Formato de Fecha
                </label>
                <select
                  value={generalConfig.formatoFecha}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, formatoFecha: e.target.value })}
                  className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e6e8eb] dark:border-slate-700">
              <button
                onClick={() => handleSave('Configuración General')}
                disabled={isSaving}
                className="px-5 py-2.5 bg-[#1173d4] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
          )}

          {/* Tab: Notificaciones */}
          {activeTab === 'notificaciones' && (
          <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-50 dark:bg-purple-900/30 p-2 text-purple-600 dark:text-purple-400">
                  <span className="material-symbols-outlined text-2xl">notifications</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111418] dark:text-white">Notificaciones</h3>
                  <p className="text-sm text-[#617589] dark:text-slate-400">Configura las alertas y notificaciones</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700 hover:bg-[#f6f7f8] dark:hover:bg-[#253240] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#1173d4]">email</span>
                  <div>
                    <p className="font-semibold text-[#111418] dark:text-white">Notificaciones por Email</p>
                    <p className="text-sm text-[#617589] dark:text-slate-400">Recibir notificaciones importantes por correo</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificacionesConfig.emailNotificaciones}
                  onChange={(e) =>
                    setNotificacionesConfig({ ...notificacionesConfig, emailNotificaciones: e.target.checked })
                  }
                  className="size-5 rounded border-[#dbe0e6] dark:border-slate-600 text-[#1173d4] focus:ring-2 focus:ring-[#1173d4]"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700 hover:bg-[#f6f7f8] dark:hover:bg-[#253240] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#1173d4]">notifications_active</span>
                  <div>
                    <p className="font-semibold text-[#111418] dark:text-white">Notificaciones Push</p>
                    <p className="text-sm text-[#617589] dark:text-slate-400">Alertas en tiempo real en el navegador</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificacionesConfig.notificacionesPush}
                  onChange={(e) =>
                    setNotificacionesConfig({ ...notificacionesConfig, notificacionesPush: e.target.checked })
                  }
                  className="size-5 rounded border-[#dbe0e6] dark:border-slate-600 text-[#1173d4] focus:ring-2 focus:ring-[#1173d4]"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700 hover:bg-[#f6f7f8] dark:hover:bg-[#253240] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#1173d4]">schedule</span>
                  <div>
                    <p className="font-semibold text-[#111418] dark:text-white">Reportes Diarios</p>
                    <p className="text-sm text-[#617589] dark:text-slate-400">Enviar resumen diario de actividades</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificacionesConfig.reportesDiarios}
                  onChange={(e) =>
                    setNotificacionesConfig({ ...notificacionesConfig, reportesDiarios: e.target.checked })
                  }
                  className="size-5 rounded border-[#dbe0e6] dark:border-slate-600 text-[#1173d4] focus:ring-2 focus:ring-[#1173d4]"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700 hover:bg-[#f6f7f8] dark:hover:bg-[#253240] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#1173d4]">warning</span>
                  <div>
                    <p className="font-semibold text-[#111418] dark:text-white">Alertas Críticas</p>
                    <p className="text-sm text-[#617589] dark:text-slate-400">Notificaciones inmediatas para eventos críticos</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificacionesConfig.alertasCriticas}
                  onChange={(e) =>
                    setNotificacionesConfig({ ...notificacionesConfig, alertasCriticas: e.target.checked })
                  }
                  className="size-5 rounded border-[#dbe0e6] dark:border-slate-600 text-[#1173d4] focus:ring-2 focus:ring-[#1173d4]"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e6e8eb] dark:border-slate-700">
              <button
                onClick={() => handleSave('Configuración de Notificaciones')}
                disabled={isSaving}
                className="px-5 py-2.5 bg-[#1173d4] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
          )}

          {/* Tab: Seguridad */}
          {activeTab === 'seguridad' && (
          <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-2 text-red-600 dark:text-red-400">
                  <span className="material-symbols-outlined text-2xl">security</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111418] dark:text-white">Seguridad</h3>
                  <p className="text-sm text-[#617589] dark:text-slate-400">Parámetros de seguridad y autenticación</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                  Tiempo de Sesión (minutos)
                </label>
                <input
                  type="number"
                  value={seguridadConfig.sesionTimeout}
                  onChange={(e) =>
                    setSeguridadConfig({ ...seguridadConfig, sesionTimeout: parseInt(e.target.value) || 30 })
                  }
                  className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  min="5"
                  max="480"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                  Longitud Mínima de Contraseña
                </label>
                <input
                  type="number"
                  value={seguridadConfig.longitudMinimaPassword}
                  onChange={(e) =>
                    setSeguridadConfig({
                      ...seguridadConfig,
                      longitudMinimaPassword: parseInt(e.target.value) || 8,
                    })
                  }
                  className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  min="6"
                  max="32"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                  Historial de Contraseñas
                </label>
                <input
                  type="number"
                  value={seguridadConfig.historialPasswords}
                  onChange={(e) =>
                    setSeguridadConfig({ ...seguridadConfig, historialPasswords: parseInt(e.target.value) || 5 })
                  }
                  className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  min="0"
                  max="10"
                />
                <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
                  Número de contraseñas anteriores que no se pueden reutilizar
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700">
                <div>
                  <p className="font-semibold text-[#111418] dark:text-white">Autenticación de Dos Factores (2FA)</p>
                  <p className="text-sm text-[#617589] dark:text-slate-400">Requerir 2FA para todos los usuarios</p>
                </div>
                <input
                  type="checkbox"
                  checked={seguridadConfig.requerir2FA}
                  onChange={(e) => setSeguridadConfig({ ...seguridadConfig, requerir2FA: e.target.checked })}
                  className="size-5 rounded border-[#dbe0e6] dark:border-slate-600 text-[#1173d4] focus:ring-2 focus:ring-[#1173d4]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e6e8eb] dark:border-slate-700">
              <button
                onClick={() => handleSave('Configuración de Seguridad')}
                disabled={isSaving}
                className="px-5 py-2.5 bg-[#1173d4] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
          )}

          {/* Tab: API Externa */}
          {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-50 dark:bg-orange-900/30 p-2 text-orange-600 dark:text-orange-400">
                  <span className="material-symbols-outlined text-2xl">api</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111418] dark:text-white">Configuración de API Externa</h3>
                  <p className="text-sm text-[#617589] dark:text-slate-400">Credenciales para la API de Combustibles</p>
                </div>
              </div>
            </div>

            {/* Mensaje de prueba de conexión */}
            {testMessage && (
              <div
                className={`mb-4 p-4 rounded-lg border ${
                  testMessage.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-800 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-800 text-red-700 dark:text-red-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">
                    {testMessage.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <p className="font-medium">{testMessage.text}</p>
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveAPI()
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="api-usuario" className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                    Usuario de API
                  </label>
                  <input
                    id="api-usuario"
                    type="text"
                    value={apiConfig.apiUsuario}
                    onChange={(e) => setApiConfig({ ...apiConfig, apiUsuario: e.target.value })}
                    className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                    placeholder="globalgas"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label htmlFor="api-contrasena" className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                    Contraseña de API
                  </label>
                  <input
                    id="api-contrasena"
                    type="password"
                    value={apiConfig.apiContrasena}
                    onChange={(e) => setApiConfig({ ...apiConfig, apiContrasena: e.target.value })}
                    className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </form>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e6e8eb] dark:border-slate-700">
              <button
                onClick={handleTestConnection}
                disabled={isLoading || isSaving}
                className="px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <span>Probando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">wifi_protected_setup</span>
                    <span>Probar Conexión</span>
                  </>
                )}
              </button>
              <button
                onClick={handleSaveAPI}
                disabled={isSaving || isLoading}
                className="px-5 py-2.5 bg-[#1173d4] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
          </div>
          )}

          {/* Tab: Sincronización */}
          {activeTab === 'sincronizacion' && (
          <div className="space-y-6">
            {/* Sincronización de Reportes desde API Externa */}
            <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-2 text-green-600 dark:text-green-400">
                    <span className="material-symbols-outlined text-2xl">sync</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#111418] dark:text-white">Sincronizar Reportes desde API Externa</h3>
                    <p className="text-sm text-[#617589] dark:text-slate-400">Importa reportes automáticamente desde la API externa</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={sincronizacionConfig.fechaInicio}
                    onChange={(e) =>
                      setSincronizacionConfig({ ...sincronizacionConfig, fechaInicio: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={sincronizacionConfig.fechaFin}
                    onChange={(e) =>
                      setSincronizacionConfig({ ...sincronizacionConfig, fechaFin: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e6e8eb] dark:border-slate-700">
                <button
                  onClick={handleSincronizar}
                  disabled={isSincronizando || isLoading}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSincronizando ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">sync</span>
                      <span>Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">sync</span>
                      <span>Sincronizar Reportes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sincronizar Estaciones desde API Externa */}
            <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-2 text-blue-600 dark:text-blue-400">
                    <span className="material-symbols-outlined text-2xl">local_gas_station</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#111418] dark:text-white">Sincronizar Estaciones desde API Externa</h3>
                    <p className="text-sm text-[#617589] dark:text-slate-400">Importa estaciones automáticamente desde la API externa</p>
                  </div>
                </div>
              </div>

            <p className="text-sm text-[#617589] dark:text-slate-400 mb-4">
              Esta función extraerá las estaciones únicas de los datos de la API y las creará o actualizará en la base de datos.
              Todas las estaciones se asignarán a la zona por defecto.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={sincronizacionConfig.fechaInicio}
                  onChange={(e) =>
                    setSincronizacionConfig({ ...sincronizacionConfig, fechaInicio: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={sincronizacionConfig.fechaFin}
                  onChange={(e) =>
                    setSincronizacionConfig({ ...sincronizacionConfig, fechaFin: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e6e8eb] dark:border-slate-700">
              <button
                onClick={handleSincronizarEstaciones}
                disabled={isSincronizando || isLoading}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSincronizando ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <span>Sincronizando Estaciones...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">local_gas_station</span>
                    <span>Sincronizar Estaciones</span>
                  </>
                )}
              </button>
            </div>
          </div>
          </div>
          )}

          {/* Tab: Reportes */}
          {activeTab === 'reportes' && (
          <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-2 text-green-600 dark:text-green-400">
                  <span className="material-symbols-outlined text-2xl">description</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111418] dark:text-white">Reportes</h3>
                  <p className="text-sm text-[#617589] dark:text-slate-400">Configuración de reportes y backups</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                  Frecuencia de Backup
                </label>
                <select
                  value={reportesConfig.frecuenciaBackup}
                  onChange={(e) => setReportesConfig({ ...reportesConfig, frecuenciaBackup: e.target.value })}
                  className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                >
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                  Retención de Reportes (días)
                </label>
                <input
                  type="number"
                  value={reportesConfig.retencionReportes}
                  onChange={(e) =>
                    setReportesConfig({ ...reportesConfig, retencionReportes: parseInt(e.target.value) || 365 })
                  }
                  className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  min="30"
                  max="3650"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                  Formato de Exportación
                </label>
                <select
                  value={reportesConfig.formatoExportacion}
                  onChange={(e) => setReportesConfig({ ...reportesConfig, formatoExportacion: e.target.value })}
                  className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                >
                  <option value="PDF">PDF</option>
                  <option value="Excel">Excel</option>
                  <option value="CSV">CSV</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700">
                <div>
                  <p className="font-semibold text-[#111418] dark:text-white">Auto-Aprobación</p>
                  <p className="text-sm text-[#617589] dark:text-slate-400">Aprobar reportes automáticamente</p>
                </div>
                <input
                  type="checkbox"
                  checked={reportesConfig.autoAprobacion}
                  onChange={(e) => setReportesConfig({ ...reportesConfig, autoAprobacion: e.target.checked })}
                  className="size-5 rounded border-[#dbe0e6] dark:border-slate-600 text-[#1173d4] focus:ring-2 focus:ring-[#1173d4]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e6e8eb] dark:border-slate-700">
              <button
                onClick={() => handleSave('Configuración de Reportes')}
                disabled={isSaving}
                className="px-5 py-2.5 bg-[#1173d4] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
          )}

          {/* Modal de Formulario de Menú */}
          {mostrarFormularioMenu && (
            <FormularioMenu
              menu={menuEditando}
              onSave={(data) => {
                if (menuEditando) {
                  updateMenuMutation.mutate({ id: menuEditando.id, data })
                } else {
                  createMenuMutation.mutate(data as CreateMenuData)
                }
              }}
              onCancel={handleCancelarFormulario}
              isLoading={createMenuMutation.isPending || updateMenuMutation.isPending}
            />
          )}
        </div>
      </main>
    </div>
  )
}

// Componente FormularioMenu
interface FormularioMenuProps {
  menu: MenuItem | null
  onSave: (data: CreateMenuData | UpdateMenuData) => void
  onCancel: () => void
  isLoading: boolean
}

function FormularioMenu({ menu, onSave, onCancel, isLoading }: FormularioMenuProps) {
  // Debug: ver qué datos recibe el formulario
  console.log('FormularioMenu - menu recibido:', menu)
  
  // Inicializar el estado correctamente según el tipo del menú
  const [formData, setFormData] = useState<CreateMenuData>(() => {
    const tipoMenu = menu?.type || 'route'
    return {
      menu_id: menu?.menu_id || '',
      tipo: tipoMenu,
      path: tipoMenu === 'route' ? (menu?.path || undefined) : undefined,
      view_id: tipoMenu === 'view' ? (menu?.view_id || undefined) : undefined,
      label: menu?.label || '',
      icon: menu?.icon || '',
      orden: menu?.orden || 0,
      requiere_exact_match: menu?.requiere_exact_match || false,
      roles: menu?.roles || [],
    }
  })
  
  // Actualizar el estado cuando cambie el menú (por si se edita otro menú)
  useEffect(() => {
    if (menu) {
      const tipoMenu = menu.type || 'route'
      setFormData({
        menu_id: menu.menu_id || '',
        tipo: tipoMenu,
        path: tipoMenu === 'route' ? (menu.path || undefined) : undefined,
        view_id: tipoMenu === 'view' ? (menu.view_id || undefined) : undefined,
        label: menu.label || '',
        icon: menu.icon || '',
        orden: menu.orden || 0,
        requiere_exact_match: menu.requiere_exact_match || false,
        roles: menu.roles || [],
      })
    } else {
      // Si no hay menú, resetear al estado inicial
      setFormData({
        menu_id: '',
        tipo: 'route',
        path: undefined,
        view_id: undefined,
        label: '',
        icon: '',
        orden: 0,
        requiere_exact_match: false,
        roles: [],
      })
    }
  }, [menu])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.menu_id || !formData.label || !formData.icon || formData.roles.length === 0) {
      alert('Por favor completa todos los campos requeridos')
      return
    }
    if (formData.tipo === 'route' && !formData.path) {
      alert('El tipo "route" requiere un path')
      return
    }
    if (formData.tipo === 'view' && !formData.view_id) {
      alert('El tipo "view" requiere un view_id')
      return
    }
    // Limpiar campos que no corresponden al tipo
    const dataToSave = {
      ...formData,
      path: formData.tipo === 'route' ? formData.path : undefined,
      view_id: formData.tipo === 'view' ? formData.view_id : undefined,
    }
    onSave(dataToSave)
  }

  const toggleRole = (role: Role) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm dark:bg-black/50">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-sm p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-[#111418] dark:text-white">
          {menu ? 'Editar Menú' : 'Nuevo Menú'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Menu ID (identificador único) *
            </label>
            <input
              type="text"
              value={formData.menu_id}
              onChange={(e) => setFormData({ ...formData, menu_id: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
              disabled={!!menu}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Tipo *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => {
                const newTipo = e.target.value as 'route' | 'view'
                setFormData({ 
                  ...formData, 
                  tipo: newTipo,
                  // Limpiar campos según el tipo
                  path: newTipo === 'route' ? formData.path : undefined,
                  view_id: newTipo === 'view' ? formData.view_id : undefined,
                })
              }}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
            >
              <option value="route">Ruta (Route) - Para navegación entre páginas</option>
              <option value="view">Vista (View) - Para cambiar vistas dentro de una página</option>
            </select>
            <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
              <strong>Ruta:</strong> Navega a una página diferente (ej: /admin/usuarios).<br />
              <strong>Vista:</strong> Cambia la vista dentro de la misma página (ej: reportes, historial).
            </p>
          </div>

          {formData.tipo === 'route' ? (
            <div>
              <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                Path (Ruta) * <span className="text-xs font-normal text-[#617589]">Solo para tipo "Ruta"</span>
              </label>
              <input
                type="text"
                value={formData.path || ''}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="/admin/usuarios"
                required={formData.tipo === 'route'}
              />
              <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
                Ruta de navegación (ej: /admin/usuarios, /admin/reportes). Debe comenzar con /.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                View ID (ID de Vista) * <span className="text-xs font-normal text-[#617589]">Solo para tipo "Vista"</span>
              </label>
              <input
                type="text"
                value={formData.view_id || ''}
                onChange={(e) => setFormData({ ...formData, view_id: e.target.value })}
                className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="reportes"
                required={formData.tipo === 'view'}
              />
              <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
                Identificador de la vista interna (ej: reportes, historial, nuevaCaptura). Sin espacios ni caracteres especiales.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Etiqueta *
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Icono (Material Symbols) *
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              placeholder="dashboard"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Orden
            </label>
            <input
              type="number"
              value={formData.orden}
              onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
            />
          </div>

          {formData.tipo === 'route' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiere_exact_match}
                  onChange={(e) =>
                    setFormData({ ...formData, requiere_exact_match: e.target.checked })
                  }
                  className="size-5 rounded border-[#dbe0e6] dark:border-slate-600 text-[#1173d4] focus:ring-2 focus:ring-[#1173d4] mt-0.5"
                />
                <div>
                  <label className="text-sm font-semibold text-[#111418] dark:text-white block mb-1">
                    Requiere coincidencia exacta
                  </label>
                  <p className="text-xs text-[#617589] dark:text-slate-400">
                    Si está activado, el menú solo se resaltará cuando la ruta sea <strong>exactamente</strong> igual al path.
                    <br />
                    <strong>Ejemplo:</strong> Si el path es <code>/admin</code> y esta opción está activada, 
                    el menú solo se resaltará en <code>/admin</code>, pero NO en <code>/admin/usuarios</code>.
                    <br />
                    Si está desactivado, el menú se resaltará en <code>/admin</code> y también en cualquier ruta que comience con <code>/admin</code> (como <code>/admin/usuarios</code>).
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Roles * (selecciona al menos uno)
            </label>
            <div className="space-y-2">
              {Object.values(Role).map((role) => (
                <label key={role} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="size-5 rounded border-[#dbe0e6] dark:border-slate-600 text-[#1173d4] focus:ring-2 focus:ring-[#1173d4]"
                  />
                  <span className="text-sm text-[#111418] dark:text-white">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#1173d4] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
