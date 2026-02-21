import { promises as fs } from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { pool } from '../config/database.js'

type FrecuenciaRespaldo = 'diario' | 'semanal' | 'mensual'

export interface BackupSettings {
  enabled: boolean
  frequency: FrecuenciaRespaldo
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

const BACKUP_DIR =
  process.env.BACKUP_DIR || path.resolve(process.cwd(), 'backups', 'database')

const DEFAULT_SETTINGS: BackupSettings = {
  enabled: false,
  frequency: 'diario',
  time: '00:00',
  retentionDays: 7,
  weeklyDay: 1,
  monthlyDay: 1,
  lastAutoRunAt: null,
}

const SETTINGS_KEYS = {
  enabled: 'backup_auto_enabled',
  frequency: 'backup_frequency',
  time: 'backup_time',
  retentionDays: 'backup_retention_days',
  weeklyDay: 'backup_weekly_day',
  monthlyDay: 'backup_monthly_day',
  lastAutoRunAt: 'backup_last_auto_run_at',
}

class BackupService {
  private schedulerTimer: NodeJS.Timeout | null = null
  private isRunningJob = false
  private isRestoring = false

  async ensureBackupDir() {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
  }

  getBackupDir() {
    return BACKUP_DIR
  }

  async getSettings(): Promise<BackupSettings> {
    const keys = Object.values(SETTINGS_KEYS)
    const result = await pool.query(
      `
      SELECT clave, valor
      FROM configuracion
      WHERE clave = ANY($1::text[])
      `,
      [keys]
    )

    const map = new Map<string, string>()
    for (const row of result.rows) {
      map.set(row.clave, row.valor || '')
    }

    const parsed: BackupSettings = {
      enabled: this.parseBoolean(map.get(SETTINGS_KEYS.enabled), DEFAULT_SETTINGS.enabled),
      frequency: this.parseFrequency(map.get(SETTINGS_KEYS.frequency)),
      time: this.parseTime(map.get(SETTINGS_KEYS.time)),
      retentionDays: this.parseNumber(
        map.get(SETTINGS_KEYS.retentionDays),
        DEFAULT_SETTINGS.retentionDays,
        1,
        3650
      ),
      weeklyDay: this.parseNumber(
        map.get(SETTINGS_KEYS.weeklyDay),
        DEFAULT_SETTINGS.weeklyDay,
        0,
        6
      ),
      monthlyDay: this.parseNumber(
        map.get(SETTINGS_KEYS.monthlyDay),
        DEFAULT_SETTINGS.monthlyDay,
        1,
        28
      ),
      lastAutoRunAt: map.get(SETTINGS_KEYS.lastAutoRunAt) || null,
    }

    return parsed
  }

  async updateSettings(partial: Partial<BackupSettings>) {
    const current = await this.getSettings()
    const merged: BackupSettings = {
      ...current,
      ...partial,
    }

    merged.frequency = this.parseFrequency(String(merged.frequency))
    merged.time = this.parseTime(merged.time)
    merged.retentionDays = this.parseNumber(
      String(merged.retentionDays),
      DEFAULT_SETTINGS.retentionDays,
      1,
      3650
    )
    merged.weeklyDay = this.parseNumber(String(merged.weeklyDay), DEFAULT_SETTINGS.weeklyDay, 0, 6)
    merged.monthlyDay = this.parseNumber(
      String(merged.monthlyDay),
      DEFAULT_SETTINGS.monthlyDay,
      1,
      28
    )

    await this.upsert(SETTINGS_KEYS.enabled, String(Boolean(merged.enabled)))
    await this.upsert(SETTINGS_KEYS.frequency, merged.frequency)
    await this.upsert(SETTINGS_KEYS.time, merged.time)
    await this.upsert(SETTINGS_KEYS.retentionDays, String(merged.retentionDays))
    await this.upsert(SETTINGS_KEYS.weeklyDay, String(merged.weeklyDay))
    await this.upsert(SETTINGS_KEYS.monthlyDay, String(merged.monthlyDay))

    await this.restartScheduler()
    return this.getSettings()
  }

  async listBackups(): Promise<BackupItem[]> {
    await this.ensureBackupDir()
    const files = await fs.readdir(BACKUP_DIR)
    const sqlFiles = files.filter((f) => f.endsWith('.sql'))
    const items: BackupItem[] = []

    for (const fileName of sqlFiles) {
      const fullPath = path.join(BACKUP_DIR, fileName)
      const stats = await fs.stat(fullPath)
      items.push({
        fileName,
        sizeBytes: stats.size,
        createdAt: stats.mtime.toISOString(),
        source: this.detectSource(fileName),
      })
    }

    return items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }

  resolveBackupPath(fileName: string) {
    const safeName = path.basename(fileName)
    if (safeName !== fileName || !safeName.endsWith('.sql')) {
      throw new Error('Nombre de archivo de respaldo inválido')
    }
    return path.join(BACKUP_DIR, safeName)
  }

  async createBackup(options?: { mode?: 'manual' | 'automatico'; requestedBy?: string }) {
    await this.ensureBackupDir()
    const mode = options?.mode || 'manual'
    const now = new Date()
    const stamp = this.formatFileStamp(now)
    const fileName = `backup_${stamp}_${mode}.sql`
    const filePath = path.join(BACKUP_DIR, fileName)

    const args = [
      '-h',
      process.env.DB_HOST || 'localhost',
      '-p',
      process.env.DB_PORT || '5432',
      '-U',
      process.env.DB_USER || 'postgres',
      '-d',
      process.env.DB_NAME || 'repvtas',
      '--no-owner',
      '--no-privileges',
      '-f',
      filePath,
    ]

    await this.runProcess('pg_dump', args, {
      ...process.env,
      PGPASSWORD: process.env.DB_PASSWORD || 'postgres',
    })

    const settings = await this.getSettings()
    await this.enforceRetention(settings.retentionDays)

    if (mode === 'automatico') {
      await this.upsert(SETTINGS_KEYS.lastAutoRunAt, now.toISOString())
    }

    const stat = await fs.stat(filePath)
    return {
      fileName,
      sizeBytes: stat.size,
      createdAt: stat.mtime.toISOString(),
      source: mode,
      requestedBy: options?.requestedBy || null,
    }
  }

  async deleteBackup(fileName: string) {
    if (this.isRestoring) {
      throw new Error('No se puede eliminar respaldos mientras hay una restauración en progreso.')
    }

    const filePath = this.resolveBackupPath(fileName)
    await fs.access(filePath)
    await fs.unlink(filePath)
  }

  async restoreBackup(fileName: string) {
    if (this.isRestoring) {
      throw new Error('Ya hay una restauración en progreso. Espera a que finalice.')
    }

    this.isRestoring = true
    const filePath = this.resolveBackupPath(fileName)
    try {
      await fs.access(filePath)

      console.log(`[backup] Iniciando restauración desde: ${fileName}`)

      const env = {
        ...process.env,
        PGPASSWORD: process.env.DB_PASSWORD || 'postgres',
      }
      const host = process.env.DB_HOST || 'localhost'
      const port = process.env.DB_PORT || '5432'
      const user = process.env.DB_USER || 'postgres'
      const db = process.env.DB_NAME || 'repvtas'

      // Respaldo de seguridad antes de tocar la base actual.
      const safetyBackup = await this.createBackup({
        mode: 'manual',
        requestedBy: 'pre-restore-safety-backup',
      })
      const safetyBackupPath = this.resolveBackupPath(safetyBackup.fileName)
      console.log(`[backup] Respaldo de seguridad creado: ${safetyBackup.fileName}`)

      try {
        console.log('[backup] Paso 1/2: limpiando esquema public...')
        await this.runProcess(
          'psql',
          [
            '-h',
            host,
            '-p',
            port,
            '-U',
            user,
            '-d',
            db,
            '-v',
            'ON_ERROR_STOP=1',
            '-c',
            `
            DROP SCHEMA IF EXISTS public CASCADE;
            CREATE SCHEMA public;
            GRANT ALL ON SCHEMA public TO public;
            `,
          ],
          env
        )

        console.log('[backup] Paso 2/2: importando respaldo...')
        await this.runProcess(
          'psql',
          ['-h', host, '-p', port, '-U', user, '-d', db, '-v', 'ON_ERROR_STOP=1', '-f', filePath],
          env
        )

        console.log(`[backup] Restauración completada correctamente: ${fileName}`)
      } catch (restoreError: any) {
        console.error('[backup] Falló la restauración. Intentando rollback automático...', restoreError)

        try {
          await this.runProcess(
            'psql',
            [
              '-h',
              host,
              '-p',
              port,
              '-U',
              user,
              '-d',
              db,
              '-v',
              'ON_ERROR_STOP=1',
              '-c',
              `
              DROP SCHEMA IF EXISTS public CASCADE;
              CREATE SCHEMA public;
              GRANT ALL ON SCHEMA public TO public;
              `,
            ],
            env
          )

          await this.runProcess(
            'psql',
            ['-h', host, '-p', port, '-U', user, '-d', db, '-v', 'ON_ERROR_STOP=1', '-f', safetyBackupPath],
            env
          )

          console.error(
            `[backup] Rollback automático completado con respaldo de seguridad: ${safetyBackup.fileName}`
          )
        } catch (rollbackError: any) {
          console.error('[backup] Rollback automático también falló.', rollbackError)
          throw new Error(
            `Falló la restauración y también falló el rollback automático. Restaurar manualmente desde ${safetyBackup.fileName}. Error original: ${restoreError?.message || 'desconocido'}`
          )
        }

        throw new Error(
          `Falló la restauración desde ${fileName}. Se revirtió automáticamente al estado previo con ${safetyBackup.fileName}. Detalle: ${restoreError?.message || 'desconocido'}`
        )
      }
    } finally {
      this.isRestoring = false
    }
  }

  async startScheduler() {
    await this.restartScheduler()
  }

  async restartScheduler() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer)
      this.schedulerTimer = null
    }

    const settings = await this.getSettings()
    if (!settings.enabled) {
      return
    }

    this.schedulerTimer = setInterval(() => {
      this.tickScheduler().catch((error) => {
        console.error('[backup] Error en scheduler:', error)
      })
    }, 60 * 1000)

    // Evaluar una vez al arrancar.
    await this.tickScheduler()
  }

  private async tickScheduler() {
    if (this.isRunningJob) return

    const settings = await this.getSettings()
    if (!settings.enabled) return

    const now = new Date()
    const [hh, mm] = settings.time.split(':').map((v) => parseInt(v, 10))
    if (now.getHours() !== hh || now.getMinutes() !== mm) {
      return
    }

    if (!this.matchesFrequency(now, settings)) {
      return
    }

    if (settings.lastAutoRunAt) {
      const last = new Date(settings.lastAutoRunAt)
      if (!Number.isNaN(last.getTime()) && this.isSameDay(now, last)) {
        return
      }
    }

    this.isRunningJob = true
    try {
      await this.createBackup({ mode: 'automatico' })
      console.log('[backup] Respaldo automático creado')
    } catch (error) {
      console.error('[backup] Error al crear respaldo automático:', error)
    } finally {
      this.isRunningJob = false
    }
  }

  private async enforceRetention(retentionDays: number) {
    const backups = await this.listBackups()
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000

    for (const item of backups) {
      const ts = +new Date(item.createdAt)
      if (ts < cutoff) {
        const filePath = this.resolveBackupPath(item.fileName)
        await fs.unlink(filePath).catch(() => null)
      }
    }
  }

  private detectSource(fileName: string): 'manual' | 'automatico' | 'desconocido' {
    if (fileName.includes('_manual.sql')) return 'manual'
    if (fileName.includes('_automatico.sql')) return 'automatico'
    return 'desconocido'
  }

  private parseBoolean(value: string | undefined, fallback: boolean) {
    if (value == null || value === '') return fallback
    return value === 'true' || value === '1'
  }

  private parseFrequency(value: string | undefined): FrecuenciaRespaldo {
    if (value === 'semanal' || value === 'mensual' || value === 'diario') {
      return value
    }
    return DEFAULT_SETTINGS.frequency
  }

  private parseTime(value: string | undefined) {
    if (!value) return DEFAULT_SETTINGS.time
    if (!/^\d{2}:\d{2}$/.test(value)) return DEFAULT_SETTINGS.time
    const [h, m] = value.split(':').map((v) => parseInt(v, 10))
    if (Number.isNaN(h) || Number.isNaN(m)) return DEFAULT_SETTINGS.time
    if (h < 0 || h > 23 || m < 0 || m > 59) return DEFAULT_SETTINGS.time
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  private parseNumber(value: string | undefined, fallback: number, min: number, max: number) {
    const parsed = parseInt(value || '', 10)
    if (Number.isNaN(parsed)) return fallback
    return Math.min(max, Math.max(min, parsed))
  }

  private matchesFrequency(now: Date, settings: BackupSettings) {
    if (settings.frequency === 'diario') return true
    if (settings.frequency === 'semanal') return now.getDay() === settings.weeklyDay
    if (settings.frequency === 'mensual') return now.getDate() === settings.monthlyDay
    return false
  }

  private isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  private formatFileStamp(date: Date) {
    const y = date.getFullYear()
    const mo = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const mi = String(date.getMinutes()).padStart(2, '0')
    const s = String(date.getSeconds()).padStart(2, '0')
    return `${y}${mo}${d}_${h}${mi}${s}`
  }

  private async upsert(clave: string, valor: string) {
    await pool.query(
      `
      INSERT INTO configuracion (clave, valor, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (clave)
      DO UPDATE SET valor = EXCLUDED.valor, updated_at = CURRENT_TIMESTAMP
      `,
      [clave, valor]
    )
  }

  private runProcess(command: string, args: string[], env: NodeJS.ProcessEnv) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, { env })
      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (chunk) => {
        stdout += String(chunk)
      })

      child.stderr.on('data', (chunk) => {
        stderr += String(chunk)
      })

      child.on('error', (error) => {
        reject(
          new Error(
            `No se pudo ejecutar ${command}. Verifica que esté instalado en el servidor. ${error.message}`
          )
        )
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
          return
        }
        const detail = [stderr.trim(), stdout.trim()].filter(Boolean).join('\n')
        reject(
          new Error(
            detail || `${command} ${args.join(' ')} terminó con código ${code}`
          )
        )
      })
    })
  }
}

export const backupService = new BackupService()
