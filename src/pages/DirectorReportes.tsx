import { useNavigate } from 'react-router-dom'
import DynamicHeader from '../components/DynamicHeader'

export default function DirectorReportes() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <DynamicHeader />

      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1400px] mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
            Reportes Directivos
          </h1>
          <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400 mt-2">
            <span className="material-symbols-outlined text-[20px]">description</span>
            <p className="text-base font-normal">Consulta reportes consolidados por zona y estación</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <button
            onClick={() => navigate('/director/reportes/er')}
            className="text-left rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3 text-[#1173d4]">
                <span className="material-symbols-outlined text-3xl">table_chart</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-[#1173d4]/10 text-[#1173d4]">
                Disponible
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#111418] dark:text-white">Reporte ER</h2>
            <p className="text-sm text-[#617589] dark:text-slate-400 mt-2">
              Muestra el indicador E% por estación y producto para la zona seleccionada.
            </p>
          </button>

          <button
            onClick={() => navigate('/director/reportes/r')}
            className="text-left rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-3 text-indigo-600 dark:text-indigo-400">
                <span className="material-symbols-outlined text-3xl">analytics</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                Disponible
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#111418] dark:text-white">Reporte R</h2>
            <p className="text-sm text-[#617589] dark:text-slate-400 mt-2">
              Resume E.E., D, E.R., V.C. y porcentajes por estación en las tres zonas.
            </p>
          </button>

          <button
            onClick={() => navigate('/director/reportes/conciliacion')}
            className="text-left rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-3 text-emerald-600 dark:text-emerald-400">
                <span className="material-symbols-outlined text-3xl">balance</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                Disponible
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#111418] dark:text-white">Reporte Conciliación</h2>
            <p className="text-sm text-[#617589] dark:text-slate-400 mt-2">
              Desglose por estación con bloques por producto, total, entregado y diferencia.
            </p>
          </button>

        </div>
      </main>
    </div>
  )
}
