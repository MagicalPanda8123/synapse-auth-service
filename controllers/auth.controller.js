import {
  registerAccount,
  resendVerificationCode,
  verifyEmailCode,
} from '../services/auth.service.js'

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
