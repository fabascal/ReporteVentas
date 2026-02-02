import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface ExternalAuthRequest extends Request {
  apiUser?: {
    id: string
    api_key: string
    nombre: string
    estaciones_permitidas: string[]
    type: string
  }
}

export const authenticateExternalToken = (
  req: ExternalAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticación no proporcionado'
    })
  }

  const token = authHeader.substring(7)

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado'
      })
    }

    if (decoded.type !== 'api_external') {
      return res.status(403).json({
        success: false,
        error: 'Token no válido para API externa'
      })
    }

    req.apiUser = {
      id: decoded.id,
      api_key: decoded.api_key,
      nombre: decoded.nombre,
      estaciones_permitidas: decoded.estaciones_permitidas || [],
      type: decoded.type
    }

    next()
  })
}
