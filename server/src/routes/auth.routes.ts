import express from 'express'
import { authController } from '../controllers/auth.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/login', authController.login)
router.post('/verify-2fa', authController.verify2FALogin)
router.post('/2fa/verify-login', authController.verify2FALogin)
router.get('/me', authenticateToken, authController.getCurrentUser)
router.get('/2fa/status', authenticateToken, authController.get2FAStatus)
router.post('/2fa/setup', authenticateToken, authController.setup2FA)
router.post('/2fa/confirm', authenticateToken, authController.confirm2FA)
router.post('/2fa/disable', authenticateToken, authController.disable2FA)
router.get('/google', authController.googleAuth)
router.get('/google/callback', authController.googleCallback)
router.get('/github', authController.githubAuth)
router.get('/github/callback', authController.githubCallback)

export const authRoutes = router

