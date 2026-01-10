import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Role } from '../types/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, loginWithOAuth } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        // Redirigir según el rol
        switch (user.role) {
          case Role.Administrador:
            navigate('/admin')
            break
          case Role.GerenteEstacion:
            navigate('/gerente-estacion')
            break
          case Role.GerenteZona:
            navigate('/gerente-zona')
            break
          case Role.Direccion:
            navigate('/director')
            break
          default:
            navigate('/login')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: string) => {
    try {
      await loginWithOAuth(provider)
    } catch (err) {
      setError('Error al iniciar sesión con OAuth')
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-row bg-[#f6f7f8]">
      {/* Left Side: Visual / Context */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-between overflow-hidden bg-[#1173d4]">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBAQ2T8P1vAj8y2VmQ4h-SaUs5km9IMCwhT-AyS5FTzsHWFMEv7gf0L3BvpfyDIMeI1xiCi3Sq9E5LGKPfc_AoZDQuGKQMmg6wlO7GOEdnm_JBQq_K91R3hndTXOZQMFZ_cGwL9LlZIMi72Ukixbb4UqTL3fLoGVp9_IAoWtrYsa7SAFtsVg8fxFgutLOK7iQ2K3SjPFK_PP4ua69WizB5D3sO2SXww6Er0gK9o9N1Rk2EgHSmtX6sm19Ps8JsRX2ePg8td8Ub12g0")',
          }}
        ></div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1173d4] via-[#1173d4]/80 to-transparent opacity-90"></div>
        {/* Content Container */}
        <div className="relative z-10 flex h-full flex-col justify-between p-16 text-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-lg bg-white/10 p-2 backdrop-blur-sm">
              <span className="material-symbols-outlined text-3xl">analytics</span>
            </div>
            <h2 className="text-xl font-bold tracking-wide">SalesForce Combu-Express</h2>
          </div>
          <div className="flex flex-col gap-6">
            <h1 className="max-w-lg text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
              Visión Estratégica <br />
              <span className="text-white/70">Basada en Datos.</span>
            </h1>
            <p className="max-w-md text-lg font-medium text-white/80 leading-relaxed">
              Acceda a métricas en tiempo real, análisis de rendimiento por zona y proyecciones de
              crecimiento para la toma de decisiones ejecutivas.
            </p>
            {/* Stats Grid */}
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/20 pt-8">
              <div>
                {/* <p className="text-3xl font-bold">32</p>
                <p className="text-sm font-medium text-white/60">Estados Cubiertos</p> */}
              </div>
              <div>
                {/* <p className="text-3xl font-bold">99.9%</p>
                <p className="text-sm font-medium text-white/60">Uptime del Sistema</p> */}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm font-medium text-white/50">
            <p>© 2025 Corporativo de Ventas Combu-Express</p>
            <div className="flex gap-4">
              <span className="cursor-pointer hover:text-white">Privacidad</span>
              <span className="cursor-pointer hover:text-white">Términos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex w-full flex-1 flex-col justify-center bg-white px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24">
        {/* Header for Mobile */}
        <div className="lg:hidden mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#1173d4]/10 text-[#1173d4]">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <h2 className="text-[#1173d4] text-lg font-bold">SalesForce MX</h2>
        </div>

        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Login Header */}
          <div className="mb-10">
            <h2 className="text-[#111418] tracking-tight text-3xl font-bold leading-tight">
              Bienvenido
            </h2>
            <p className="mt-2 text-[#617589] text-base font-normal leading-normal">
              Ingrese sus credenciales para acceder al tablero de control.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" method="POST">
            {/* User Input */}
            <div>
              <label
                className="block text-[#111418] text-sm font-bold leading-normal pb-2"
                htmlFor="email"
              >
                Usuario Corporativo
              </label>
              <div className="relative">
                <input
                  autoComplete="email"
                  className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-[#1173d4]/20 border border-[#dbe0e6] bg-white focus:border-[#1173d4] h-14 placeholder:text-[#617589] p-[15px] text-base font-normal leading-normal transition-all"
                  id="email"
                  name="email"
                  placeholder="ej. nombre.apellido@empresa.mx"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <span className="material-symbols-outlined text-[#617589]">person</span>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                className="block text-[#111418] text-sm font-bold leading-normal pb-2"
                htmlFor="password"
              >
                Contraseña
              </label>
              <div className="flex w-full flex-1 items-stretch rounded-lg relative group">
                <input
                  autoComplete="current-password"
                  className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-2 focus:ring-[#1173d4]/20 border border-[#dbe0e6] bg-white focus:border-[#1173d4] h-14 placeholder:text-[#617589] p-[15px] pr-12 text-base font-normal leading-normal transition-all"
                  id="password"
                  name="password"
                  placeholder="Ingrese su contraseña"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div
                  className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-4 text-[#617589] hover:text-[#1173d4] transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </div>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  className="h-4 w-4 rounded border-gray-300 text-[#1173d4] focus:ring-[#1173d4]"
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                />
                <label className="ml-2 block text-sm text-[#617589]" htmlFor="remember-me">
                  Recordar sesión
                </label>
              </div>
              <div className="text-sm">
                <a className="font-medium text-[#1173d4] hover:text-[#1173d4]/80" href="#">
                  ¿Olvidó su contraseña?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-lg bg-[#1173d4] py-4 px-4 text-sm font-bold leading-normal text-white shadow-md hover:bg-[#1173d4]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1173d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="truncate">{isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}</span>
                <span className="material-symbols-outlined ml-2 text-lg">arrow_forward</span>
              </button>
            </div>

            {/* Secure Badge */}
            <div className="flex items-center justify-center gap-2 py-4 opacity-70">
              <span className="material-symbols-outlined text-green-600" style={{ fontSize: '16px' }}>
                lock
              </span>
              <p className="text-xs text-[#617589] font-medium">Conexión Segura SSL 256-bit</p>
            </div>
          </form>

          {/* Help Link */}
          <div className="mt-8 border-t border-[#f0f2f4] pt-6 text-center">
            <p className="text-sm text-[#617589]">
              ¿Problemas para acceder?{' '}
              <a className="font-bold text-[#111418] hover:underline" href="#">
                Contactar Soporte TI
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

