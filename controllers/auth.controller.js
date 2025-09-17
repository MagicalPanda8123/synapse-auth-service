import {
  changePassword,
  login,
  logout,
  refreshAccessToken,
  registerAccount,
  requestPasswordReset,
  resendVerificationCode,
  setNewPassword,
  verfiyPasswordResetCode,
  verifyEmailCode,
} from '../services/auth.service.js'
import { getJWKS } from '../utils/jwks.js'

export async function register(req, res, next) {
  try {
    const { email, password, username, first_name, last_name, gender } =
      req.body
    // const username = `${req.body.firstName} ${req.body.lastName}`
    if (
      !email ||
      !password ||
      !username ||
      !first_name ||
      !last_name ||
      !gender
    ) {
      return res.status(400).json({
        error:
          'email, password, username, first_name, last_name, gender are required',
      })
    }
    await registerAccount(
      email,
      password,
      username,
      first_name,
      last_name,
      gender
    )
    res.status(201).json({ message: 'Account created successfully' })
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
    const { email, current_password, new_password } = req.body
    if (!email || !current_password || !new_password) {
      return res.status(400).json({
        error:
          'Missing required fields (email, current_password, new_password)',
      })
    }
    await changePassword(email, current_password, new_password)
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    next(error)
  }
}

export async function requestPasswordResetController(req, res, next) {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }
    await requestPasswordReset(email)
    res.json({ message: 'Reset code sent' })
  } catch (error) {
    next(error)
  }
}

export async function verifyPasswordResetCodeController(req, res, next) {
  try {
    const { email, code } = req.body
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and reset code are reuired' })
    }
    const result = await verfiyPasswordResetCode(email, code)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function setNewPasswordController(req, res, next) {
  try {
    const { reset_token, new_password } = req.body
    if (!reset_token || !new_password) {
      return res
        .status(400)
        .json({ error: 'Reset token and new password are required' })
    }
    const result = await setNewPassword(reset_token, new_password)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
