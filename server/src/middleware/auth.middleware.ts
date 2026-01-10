import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Role } from '../types/auth.js'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: Role
  }
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' })
  }

  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

  jwt.verify(token, jwtSecret, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' })
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    }
    next()
  })
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' })
    }

    console.log('[requireRole] Usuario role:', req.user.role, 'Tipos permitidos:', allowedRoles)
    console.log('[requireRole] Incluido?', allowedRoles.includes(req.user.role))

    if (!allowedRoles.includes(req.user.role)) {
      console.log('[requireRole] ERROR: Acceso denegado. Role del usuario:', req.user.role, 'Roles permitidos:', allowedRoles)
      return res.status(403).json({ message: 'Acceso denegado' })
    }

    next()
  }
}

