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
    const { email, password, username, firstName, lastName, gender } = req.body
    // const username = `${req.body.firstName} ${req.body.lastName}`
    if (
      !email ||
      !password ||
      !username ||
      !firstName ||
      !lastName ||
      !gender
    ) {
      return res.status(400).json({
        error:
          'email, password, username, firstName, lastName, gender are required',
      })
    }
    await registerAccount(
      email,
      password,
      username,
      firstName,
      lastName,
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

    // extract refreshToken and set in HTTP-only cookie
    const { refreshToken, ...filtered } = result
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, //  7 days of expiry
    })
    res.json(filtered)
  } catch (error) {
    next(error)
  }
}

export async function refreshController(req, res, next) {
  try {
    // Read refresh token from cookie
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }
    const result = await refreshAccessToken(refreshToken)

    // extract refreshToken and set in HTTP-only cookie
    const { refreshToken: newRefreshToken, ...filtered } = result
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, //  7 days of expiry
    })
    res.json(filtered)
  } catch (error) {
    next(error)
  }
}

export async function logoutController(req, res, next) {
  try {
    // Read refresh token from cookie
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }
    await logout(refreshToken)

    // clear the cookie after logging out
    res.clearCookie('refreshToken')
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    next(error)
  }
}

export async function changePassWordController(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body

    // The user object is appended by auth middleware
    const { email } = req.user
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields (currentPassword, newPassword)',
      })
    }
    await changePassword(email, currentPassword, newPassword)
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
    const { newPassword } = req.body
    const { email, purpose } = req.user
    if (!newPassword) {
      return res.status(400).json({ error: 'newPassword is required' })
    }
    if (purpose !== 'password_reset') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const result = await setNewPassword(email, newPassword)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
