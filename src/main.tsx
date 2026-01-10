import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Inicializar tema ANTES de renderizar React para evitar flash
const savedTheme = localStorage.getItem('theme') || 'light'
const root = document.documentElement
if (savedTheme === 'dark') {
  root.classList.remove('light')
  root.classList.add('dark')
} else {
  root.classList.remove('dark')
  root.classList.add('light')
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)

