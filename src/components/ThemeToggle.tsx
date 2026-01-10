import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="group flex size-10 cursor-pointer items-center justify-center rounded-full bg-[#f6f7f8] dark:bg-[#2a3642] hover:bg-gray-200 dark:hover:bg-[#364350] transition-colors"
      title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
    >
      {theme === 'light' ? (
        <span className="material-symbols-outlined text-[#111418] dark:text-white group-hover:scale-110 transition-transform">
          dark_mode
        </span>
      ) : (
        <span className="material-symbols-outlined text-[#111418] dark:text-white group-hover:scale-110 transition-transform">
          light_mode
        </span>
      )}
    </button>
  )
}

