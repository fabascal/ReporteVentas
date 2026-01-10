import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import DocumentTitle from './components/DocumentTitle'
import Login from './pages/Login'
import DashboardGerenteEstacion from './pages/DashboardGerenteEstacion'
import DashboardGerenteZona from './pages/DashboardGerenteZona'
import DashboardDirector from './pages/DashboardDirector'
import DashboardAdmin from './pages/DashboardAdmin'
import AdminUsuarios from './pages/AdminUsuarios'
import AdminReportes from './pages/AdminReportes'
import AdminConfiguracion from './pages/AdminConfiguracion'
import AdminZonasEstaciones from './pages/AdminZonasEstaciones'
import AdminProductos from './pages/AdminProductos'
import AdminHistorial from './pages/AdminHistorial'
import AdminLogs from './pages/AdminLogs'
import { Role } from './types/auth'

function App() {
  return (
    <AuthProvider>
      <DocumentTitle />
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
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]}>
              <AdminUsuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reportes"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]}>
              <AdminReportes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/configuracion"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]}>
              <AdminConfiguracion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/zonas-estaciones"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]}>
              <AdminZonasEstaciones />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/productos"
          element={
            <ProtectedRoute allowedRoles={[Role.Administrador]}>
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
            <ProtectedRoute allowedRoles={[Role.Administrador]}>
              <AdminLogs />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App

