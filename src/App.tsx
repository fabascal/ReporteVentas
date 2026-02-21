import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import DocumentTitle from './components/DocumentTitle'
import Login from './pages/Login'
import DashboardGerenteEstacion from './pages/DashboardGerenteEstacion'
import DashboardGerenteZona from './pages/DashboardGerenteZona'
import DashboardDirector from './pages/DashboardDirector'
import DirectorReportes from './pages/DirectorReportes'
import DirectorReporteER from './pages/DirectorReporteER'
import DirectorReporteR from './pages/DirectorReporteR'
import DirectorReporteConciliacion from './pages/DirectorReporteConciliacion'
import DirectorLiquidaciones from './pages/DirectorLiquidaciones'
import DashboardAdmin from './pages/DashboardAdmin'
import DashboardFinanciero from './pages/DashboardFinanciero'
import ReporteEficiencia from './pages/ReporteEficiencia'
import ReporteVtas from './pages/ReporteVtas'
import ReporteRevisionMensual from './pages/ReporteRevisionMensual'
import CorreccionReporte from './pages/CorreccionReporte'
import AdminUsuarios from './pages/AdminUsuarios'
import AdminReportes from './pages/AdminReportes'
import AdminConfiguracion from './pages/AdminConfiguracion'
import AdminZonasEstaciones from './pages/AdminZonasEstaciones'
import AdminProductos from './pages/AdminProductos'
import AdminHistorial from './pages/AdminHistorial'
import AdminLogs from './pages/AdminLogs'
import AdminDetalleZona from './pages/AdminDetalleZona'
import AdminReprocesar from './pages/AdminReprocesar'
import GestionPeriodos from './pages/GestionPeriodos'
import ImportarReportes from './pages/ImportarReportes'
import { Role } from './types/auth'
import { Toaster } from 'sileo'
import 'sileo/styles.css'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  )

  useEffect(() => {
    const root = document.documentElement
    const updateTheme = () => setIsDarkMode(root.classList.contains('dark'))

    updateTheme()
    const observer = new MutationObserver(updateTheme)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  return (
    <AuthProvider>
      <DocumentTitle />
      <Toaster
        position="top-right"
        offset={{ top: 74 }}
        options={
          isDarkMode
            ? {
                fill: '#0b0f14',
                styles: {
                  title: 'sileo-title-dark',
                  description: 'sileo-description-dark',
                  badge: 'sileo-badge-dark',
                },
              }
            : {
                fill: '#e8f1fb',
                styles: {
                  title: 'sileo-title-light',
                  description: 'sileo-description-light',
                },
              }
        }
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/gerente-estacion"
          element={
            <ProtectedRoute allowedRoles={[Role.GerenteEstacion]}>
              <DashboardGerenteEstacion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gerente-zona"
          element={
            <ProtectedRoute allowedRoles={[Role.GerenteZona]}>
              <DashboardGerenteZona />
            </ProtectedRoute>
          }
        />
        <Route
          path="/director"
          element={
            <ProtectedRoute allowedRoles={[Role.Direccion]}>
              <DashboardDirector />
            </ProtectedRoute>
          }
        />
        <Route
          path="/director/reportes"
          element={
            <ProtectedRoute allowedRoles={[Role.Direccion]} menuPath="/director/reportes">
              <DirectorReportes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/director/reportes/er"
          element={
            <ProtectedRoute allowedRoles={[Role.Direccion]} menuPath="/director/reportes">
              <DirectorReporteER />
            </ProtectedRoute>
          }
        />
        <Route
          path="/director/reportes/r"
          element={
            <ProtectedRoute allowedRoles={[Role.Direccion]} menuPath="/director/reportes">
              <DirectorReporteR />
            </ProtectedRoute>
          }
        />
        <Route
          path="/director/reportes/conciliacion"
          element={
            <ProtectedRoute allowedRoles={[Role.Direccion]} menuPath="/director/reportes">
              <DirectorReporteConciliacion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/director/liquidaciones"
          element={
            <ProtectedRoute allowedRoles={[Role.Direccion]} menuPath="/director/liquidaciones">
              <DirectorLiquidaciones />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]} menuPath="/admin">
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-financiero"
          element={
            <ProtectedRoute
              allowedRoles={[Role.GerenteEstacion, Role.GerenteZona, Role.Direccion, Role.Administrador]}
              menuPath="/dashboard-financiero"
            >
              <DashboardFinanciero />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]} menuPath="/admin/usuarios">
              <AdminUsuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reportes"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]} menuPath="/admin/reportes">
              <AdminReportes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/configuracion"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]} menuPath="/admin/configuracion">
              <AdminConfiguracion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/zonas-estaciones"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]} menuPath="/admin/zonas-estaciones">
              <AdminZonasEstaciones />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/zonas-estaciones/:id"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]} menuPath="/admin/zonas-estaciones">
              <AdminDetalleZona />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/productos"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]} menuPath="/admin/productos">
              <AdminProductos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/historial"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]}>
              <AdminHistorial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador, Role.Direccion]} menuPath="/admin/logs">
              <AdminLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reprocesar"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]}>
              <AdminReprocesar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reporte-eficiencia"
          element={
            <ProtectedRoute
              allowedRoles={[Role.Administrador, Role.GerenteEstacion, Role.GerenteZona, Role.Direccion]}
              menuPath="/reporte-eficiencia"
            >
              <ReporteEficiencia />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reporte-vtas"
          element={
            <ProtectedRoute
              allowedRoles={[Role.Administrador, Role.GerenteEstacion, Role.GerenteZona, Role.Direccion]}
              menuPath="/reporte-vtas"
            >
              <ReporteVtas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/revision-mensual"
          element={
            <ProtectedRoute allowedRoles={[Role.GerenteEstacion, Role.GerenteZona]} menuPath="/revision-mensual">
              <ReporteRevisionMensual />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes/:id/correccion"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador, Role.GerenteEstacion, Role.GerenteZona]}>
              <CorreccionReporte />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion-periodos"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]}>
              <GestionPeriodos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/importar-reportes"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]}>
              <ImportarReportes />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
