import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Role } from '../types/auth.js'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: Role
    name?: string
    zona_id?: string
  }
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization']
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token as string

  if (!token) {
    // Reducir ruido en logs: solo loguear si no es un ping de health o similar
    if (!req.url.includes('/health')) {
      console.log('[authenticateToken] Token no proporcionado:', req.url)
    }
    return res.status(401).json({ message: 'Token no proporcionado' })
  }

  // Use same fallback as controller
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'

  jwt.verify(token, jwtSecret, (err, decoded: any) => {
    if (err) {
      console.error('[authenticateToken] Token verification failed:', {
        error: err.message,
        url: req.url,
        secretUsed: jwtSecret ? 'Defined' : 'Undefined', // Don't log the actual secret
        secretLength: jwtSecret.length
      })
      return res.status(403).json({ message: 'Token inválido' })
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      zona_id: decoded.zona_id,
    }
    
    next()
  })
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log('[requireRole] Acceso denegado:', {
        userRole: req.user.role,
        allowed: allowedRoles,
        url: req.url
      })
      return res.status(403).json({ message: 'Acceso denegado' })
    }

    next()
  }
}
