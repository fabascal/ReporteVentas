import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface ConfiguracionAPI {
  apiUsuario: string
  apiContrasena: string
}

export interface BackupSettings {
  enabled: boolean
  frequency: 'diario' | 'semanal' | 'mensual'
  time: string
  retentionDays: number
  weeklyDay: number
  monthlyDay: number
  lastAutoRunAt: string | null
}

export interface BackupItem {
  fileName: string
  sizeBytes: number
  createdAt: string
  source: 'manual' | 'automatico' | 'desconocido'
}

export const configuracionService = {
  async getConfiguracionAPI(): Promise<ConfiguracionAPI> {
    const response = await api.get<ConfiguracionAPI>('/configuracion/api')
    return response.data
  },

  async updateConfiguracionAPI(data: ConfiguracionAPI): Promise<void> {
    await api.put('/configuracion/api', data)
  },

  async getBackupSettings(): Promise<BackupSettings> {
    const response = await api.get<BackupSettings>('/configuracion/backups/settings')
    return response.data
  },

  async updateBackupSettings(data: Partial<BackupSettings>): Promise<{
    message: string
    settings: BackupSettings
  }> {
    const response = await api.put('/configuracion/backups/settings', data)
    return response.data
  },

  async listBackups(): Promise<BackupItem[]> {
    const response = await api.get<{ backups: BackupItem[] }>('/configuracion/backups')
    return response.data.backups || []
  },

  async createManualBackup(): Promise<{ message: string }> {
    const response = await api.post('/configuracion/backups/manual')
    return response.data
  },

  async downloadBackup(fileName: string): Promise<Blob> {
    const response = await api.get(`/configuracion/backups/${encodeURIComponent(fileName)}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  async deleteBackup(fileName: string): Promise<{ message: string }> {
    const response = await api.delete(`/configuracion/backups/${encodeURIComponent(fileName)}`)
    return response.data
  },

  async restoreBackup(fileName: string): Promise<{ message: string }> {
    const url = `/configuracion/backups/${encodeURIComponent(fileName)}/restore`
    const payload = { confirmacion: 'RESTAURAR' }

    try {
      const response = await api.post(url, payload)
      return response.data
    } catch (error: any) {
      // Si el backend se está reiniciando, dar un segundo intento corto.
      if (error?.code === 'ERR_NETWORK') {
        await new Promise((resolve) => setTimeout(resolve, 1200))
        const retry = await api.post(url, payload)
        return retry.data
      }
      throw error
    }
  },

  async sincronizarReportes(fechaInicio: string, fechaFin: string): Promise<{
    message: string
    resultado: { creados: number; actualizados: number; errores: number }
  }> {
    const response = await api.post('/reportes/sincronizar', {
      fechaInicio,
      fechaFin,
    })
    return response.data
  },

  async probarConexion(usuario: string, contrasena: string): Promise<{
    success: boolean
    message: string
    token?: string
  }> {
    const response = await api.post('/reportes/probar-conexion', {
      usuario,
      contrasena,
    })
    return response.data
  },

  async sincronizarEstaciones(fechaInicio: string, fechaFin: string, zonaId?: string): Promise<{
    message: string
    resultado: {
      creadas: number
      actualizadas: number
      errores: number
      estaciones: Array<{ identificadorExterno: string; nombre: string }>
    }
  }> {
    const response = await api.post('/reportes/sincronizar-estaciones', {
      fechaInicio,
      fechaFin,
      zonaId,
    })
    return response.data
  },
}

