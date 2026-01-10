import AdminHeader from '../components/AdminHeader'
import VistaLogs from '../components/views/VistaLogs'

export default function AdminLogs() {
  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <AdminHeader title="Logs del Sistema" icon="history" />
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        <VistaLogs />
      </main>
    </div>
  )
}
