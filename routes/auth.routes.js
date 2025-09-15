import { Router } from 'express'
import {
  changePassWordController,
  loginController,
  logoutController,
  refreshController,
  register,
  requestPasswordResetController,
  resendVerification,
  serveJWKS,
  setNewPasswordController,
  verifyEmail,
  verifyPasswordResetCodeController,
} from '../controllers/auth.controller.js'

const router = Router()

router.get('/', (req, res) => {
  res.json('hello world')
})

router.post('/register', register)

router.post('/resend-verification', resendVerification)

router.post('/verify-email', verifyEmail)

router.get('/jwks.json', serveJWKS)

router.post('/login', loginController)

router.post('/refresh', refreshController)

router.post('/logout', logoutController)

router.post('/change-password', changePassWordController)

router.post('/request-password-reset', requestPasswordResetController)

router.post('/verify-reset-code', verifyPasswordResetCodeController)

router.post('/set-new-password', setNewPasswordController)

export default router
