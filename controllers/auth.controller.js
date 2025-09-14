import {
  changePassword,
  login,
  logout,
  refreshAccessToken,
  registerAccount,
  resendVerificationCode,
  verifyEmailCode,
} from '../services/auth.service.js'
import { getJWKS } from '../utils/jwks.js'

export async function register(req, res, next) {
  try {
    const { email, password } = req.body
    const username = `${req.body.firstName} ${req.body.lastName}`
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const account = await registerAccount(email, password, username)
    res.status(201).json({ account })
  } catch (error) {
    next(error)
  }
}

export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }
    await resendVerificationCode(email)
    res.json({ message: 'Verification code resent' })
  } catch (error) {
    next(error)
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' })
    }
    await verifyEmailCode(email, code)
    res.json({ message: 'Email verified successfully' })
  } catch (error) {
    next(error)
  }
}

export function serveJWKS(req, res, next) {
  return res.status(200).json(getJWKS())
}

export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const result = await login(email, password)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function refreshController(req, res, next) {
  try {
    const { refresh_token } = req.body
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }
    const result = await refreshAccessToken(refresh_token)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function logoutController(req, res, next) {
  try {
    const { refresh_token } = req.body
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }
    await logout(refresh_token)
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    next(error)
  }
}

export async function changePassWordController(req, res, next) {
  try {
    const { account_id, current_password, new_password } = req.body
    if (!account_id || !current_password || !new_password) {
      return res.status(400).json({
        error:
          'Missing required fields (account_id, current_password, new_password)',
      })
    }
    await changePassword(account_id, current_password, new_password)
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    next(error)
  }
}
