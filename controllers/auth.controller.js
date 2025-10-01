import {
  changePassword,
  getMe,
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
import { verifyJwt } from '../utils/jwt.js'

export async function register(req, res, next) {
  try {
    const { email, password, username, firstName, lastName, gender } = req.body
    // const username = `${req.body.firstName} ${req.body.lastName}`
    if (!email || !password || !username || !firstName || !lastName || !gender) {
      return res.status(400).json({
        error: 'email, password, username, firstName, lastName, gender are required',
      })
    }
    await registerAccount(email, password, username, firstName, lastName, gender)
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
    const { refreshToken, accessToken, accessTokenExpiresIn, refreshTokenExpiresIn, ...filtered } = result
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenExpiresIn * 1000, // convert to ms
    })
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessTokenExpiresIn * 1000, // convert to ms
    })
    res.json(filtered)
  } catch (error) {
    next(error)
  }
}

export async function refreshController(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }
    const result = await refreshAccessToken(refreshToken)

    const { refreshToken: newRefreshToken, accessToken, accessTokenExpiresIn, refreshTokenExpiresIn, ...filtered } = result
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenExpiresIn * 1000, // convert to ms
    })
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessTokenExpiresIn * 1000, // convert to ms
    })
    res.json(filtered)
  } catch (error) {
    if (error.message.includes('Refresh token revoked')) {
      res.status(401).json({ error: 'Refresh token revoked' })
    }
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
    res.clearCookie('accessToken')
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

    const { resetToken, expiresIn } = result
    res.cookie('resetToken', resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expiresIn * 1000, // convert seconds to miliseconds
    })

    res.json({
      message: 'Reset code verified successfully',
      expiresIn,
    })
  } catch (error) {
    next(error)
  }
}

export async function setNewPasswordController(req, res, next) {
  try {
    const { newPassword } = req.body

    // Read reset token from cookie
    const resetToken = req.cookies.resetToken
    if (!resetToken) {
      return res.status(400).json({ error: 'Reset token is required' })
    }
    if (!newPassword) {
      return res.status(400).json({ error: 'newPassword is required' })
    }

    let payload
    try {
      payload = await verifyJwt(resetToken)
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired reset token' })
    }

    const { jti, email, purpose } = payload
    if (purpose !== 'RESET_PASSWORD') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const result = await setNewPassword(email, newPassword, jti)

    //Clear the reset token cookie after successful password reset
    res.clearCookie('resetToken')

    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getMeController(req, res, next) {
  try {
    const email = req.user.email

    const user = await getMe(email)
    res.json({
      id: user.userId,
      email: user.email,
      role: user.role,
    })
  } catch (error) {
    next(error)
  }
}
