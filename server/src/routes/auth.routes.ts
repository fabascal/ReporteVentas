import express from 'express'
import { authController } from '../controllers/auth.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/login', authController.login)
router.get('/me', authenticateToken, authController.getCurrentUser)
router.get('/google', authController.googleAuth)
router.get('/google/callback', authController.googleCallback)
router.get('/github', authController.githubAuth)
router.get('/github/callback', authController.githubCallback)

export const authRoutes = router

