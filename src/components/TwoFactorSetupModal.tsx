import { useState, useEffect } from 'react'
import { authService } from '../services/authService'

interface TwoFactorSetupModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TwoFactorSetupModal({ isOpen, onClose }: TwoFactorSetupModalProps) {
  const [step, setStep] = useState<'status' | 'setup' | 'confirm'>('status')
  const [isEnabled, setIsEnabled] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      checkStatus()
    }
  }, [isOpen])

  const checkStatus = async () => {
    try {
      const status = await authService.get2FAStatus()
      setIsEnabled(status.enabled)
      setStep('status')
    } catch (err) {
      console.error('Error al obtener estado 2FA', err)
    }
  }

  const handleStartSetup = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await authService.setup2FA()
      setQrCodeUrl(data.qrCodeUrl)
      setSecret(data.secret)
      setStep('setup')
    } catch (err) {
      setError('Error al iniciar configuración de 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    setError('')
    try {
      await authService.confirm2FA(code)
      setIsEnabled(true)
      setStep('status')
      setCode('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código inválido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!window.confirm('¿Estás seguro de desactivar la doble verificación?')) return
    setIsLoading(true)
    try {
      await authService.disable2FA()
      setIsEnabled(false)
      setStep('status')
    } catch (err) {
      setError('Error al desactivar 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1a2632] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1173d4]">security</span>
            Doble Verificación (2FA)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 'status' && (
          <div className="space-y-6 text-center">
            <div className={`mx-auto flex size-16 items-center justify-center rounded-full ${isEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              <span className="material-symbols-outlined text-4xl">{isEnabled ? 'verified_user' : 'shield_person'}</span>
            </div>
            <div>
              <p className="text-lg font-semibold dark:text-white">
                La doble verificación está {isEnabled ? 'activada' : 'desactivada'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Añade una capa extra de seguridad a tu cuenta usando una aplicación como Google Authenticator o Authy.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {!isEnabled ? (
                <button
                  onClick={handleStartSetup}
                  disabled={isLoading}
                  className="w-full rounded-lg bg-[#1173d4] py-3 font-bold text-white hover:bg-[#1173d4]/90 disabled:opacity-50"
                >
                  {isLoading ? 'Cargando...' : 'Activar Doble Verificación'}
                </button>
              ) : (
                <button
                  onClick={handleDisable}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-red-200 py-3 font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Desactivar
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Escanea este código QR con tu aplicación de autenticación:
            </p>
            <div className="mx-auto bg-white p-2 inline-block rounded-lg shadow-inner">
              <img src={qrCodeUrl} alt="QR Code" className="size-48" />
            </div>
            <div className="text-left bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs font-bold text-gray-400 uppercase">Clave manual:</p>
              <p className="font-mono text-sm break-all dark:text-blue-300">{secret}</p>
            </div>
            <button
              onClick={() => setStep('confirm')}
              className="w-full rounded-lg bg-[#1173d4] py-3 font-bold text-white hover:bg-[#1173d4]/90"
            >
              Ya lo escaneé, continuar
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ingresa el código de 6 dígitos que aparece en tu aplicación:
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              maxLength={6}
              className="w-full text-center text-3xl tracking-[0.5em] font-bold py-3 border rounded-xl dark:bg-gray-800 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setStep('setup')}
                className="flex-1 rounded-lg border py-3 font-semibold dark:text-white"
              >
                Atrás
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading || code.length < 6}
                className="flex-[2] rounded-lg bg-[#1173d4] py-3 font-bold text-white hover:bg-[#1173d4]/90 disabled:opacity-50"
              >
                {isLoading ? 'Verificando...' : 'Confirmar y Activar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
