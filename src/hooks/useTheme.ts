import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Leer del localStorage o usar 'light' como predeterminado
    const savedTheme = localStorage.getItem('theme') as Theme
    return savedTheme || 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    
    // Aplicar el tema
    if (theme === 'dark') {
      root.classList.remove('light')
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
    
    // Guardar en localStorage
    localStorage.setItem('theme', theme)
    
    // Debug: verificar que la clase se aplicó
    console.log('Theme changed to:', theme, 'HTML classes:', root.className)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return { theme, toggleTheme }
}

