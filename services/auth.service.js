import {
  generateVerificationCode,
  hashVerificationCode,
  verifyCodeHash,
} from '../utils/verification-code.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import {
  createAccount,
  deleteAccount,
  findAccountByEmail,
  findAccountById,
  updateAccountPassword,
  verifyAccountEmail,
} from '../repositories/account.repository.js'
import {
  createVerificationToken,
  findValidVerificationToken,
  invalidateVerificationTokens,
  markVerificationTokenUsed,
} from '../repositories/verification-token.repository.js'
import {
  generateRefreshToken,
  hashRefreshToken,
  signInternalJwt,
  signJwt,
  verifyJwt,
} from '../utils/jwt.js'
import {
  createRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshTokenByHash,
  revokeAllRefreshTokensForAccount,
  revokeRefreshTokenById,
} from '../repositories/refresh-token.repository.js'
import {
  createPasswordResetToken,
  findValidPasswordResetToken,
} from '../repositories/password-reset-token.repository.js'
import {
  publishAccountRegistered,
  publishPasswordChanged,
  publishPasswordResetRequested,
} from '../events/publishers/account.publisher.js'
import axios from 'axios'

export async function registerAccount(
  email,
  password,
  username,
  firstName,
  lastName
) {
  // Check if user exists
  const existing = await findAccountByEmail(email)
  if (existing) {
    throw new Error('Email already in use')
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Save to DB
  const account = await createAccount({
    email,
    passwordHash: hashedPassword,
  })

  // Issue internal JWT for service-to-service communication
  const internalJwt = await signInternalJwt(
    {
      //custom claims
      permissions: ['users:create'],
    },
    {
      iss: 'auth-service',
      sub: 'auth-service',
      aud: 'user-service',
      expiresIn: '5m',
    }
  )

  // Send request to User service to create a new user
  let user
  try {
    user = await axios.post(
      process.env.USER_SERVICE_URL,
      {
        account_id: account.id,
        username,
        first_name: firstName,
        last_name: lastName,
      },
      {
        headers: {
          Authorization: `Bearer ${internalJwt}`,
        },
      }
    )
  } catch (err) {
    console.error(
      '[User Service] Failed to create user:',
      err.response?.data || err.message
    )

    //Rollback: delete the newly created account
    await deleteAccount(account.id)
    throw new Error('Failed to create user profile in user service')
  }

  console.log(`[User Service] user created : `, user.data)

  // Generate and store verification code
  const code = generateVerificationCode()
  const codeHash = hashVerificationCode(code)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // expiration of 15min

  await createVerificationToken({
    accountId: account.id,
    tokenHash: codeHash,
    expiresAt,
  })

  // console.log(`verification code for email ${email} : ${code}`)

  // Publish event to RabbitMQ for notification service
  await publishAccountRegistered({ email, username, code })

  return true
}

export async function resendVerificationCode(email) {
  const account = await findAccountByEmail(email)
  if (!account) throw new Error('Account not found')
  if (account.isEmailVerified) throw new Error('Email already verified')

  // Invalidate previous unused tokens
  await invalidateVerificationTokens(account.id)

  // Generate and store new code
  const code = generateVerificationCode()
  const codeHash = hashVerificationCode(code)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // expiration of 15min

  await createVerificationToken({
    accountId: account.id,
    tokenHash: codeHash,
    expiresAt,
  })

  // Publish event to RabbitMQ for notification service
  await publishAccountRegistered({ email: account.email, code })

  return { message: 'Verification code resent' }
}

export async function verifyEmailCode(email, code) {
  const account = await findAccountByEmail(email)
  if (!account) throw new Error('Account not found')
  if (account.isEmailVerified) return

  const tokenRecord = await findValidVerificationToken(account.id)

  if (!tokenRecord) {
    throw new Error('No valid verification code found or code has expired')
  }

  // compare hashes
  const codeHash = hashVerificationCode(code)
  if (tokenRecord.tokenHash !== codeHash) {
    throw new Error('Invalid verification code')
  }

  await markVerificationTokenUsed(tokenRecord.id)
  await verifyAccountEmail(account.id)

  return { message: 'Email verified successfully' }
}

export async function login(email, password) {
  const account = await findAccountByEmail(email)
  if (!account) throw new Error('Invalid email')
  if (!account.isEmailVerified) throw new Error('Email not verified')

  const valid = await verifyPassword(account.passwordHash, password)
  if (!valid) throw new Error('Incorrect password')

  // Prepare JWT payload (custom claims)
  const payload = {
    sub: account.id,
    email: account.email,
    role: account.role,
  }

  // access token
  const access_token = await signJwt(payload, {
    iss: 'auth-service',
    sub: 'auth-service',
    aud: 'user-service',
    expiresIn: '15min',
  })

  // refrsh token
  const refresh_token = generateRefreshToken()
  const hashedRefreshToken = hashRefreshToken(refresh_token)
  // console.log(`hashed refresh token : ${hashedRefreshToken}`)

  await createRefreshToken({
    accountId: account.id,
    tokenHash: hashedRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  })

  return {
    access_token,
    token_type: 'Bearer',
    expires_in: 900, // 15min in seconds
    refresh_token,
    user: {
      id: account.id,
      email: account.email,
      role: account.role,
    },
  }
}

export async function refreshAccessToken(refreshToken) {
  const tokenHash = hashRefreshToken(refreshToken)
  const tokenRecord = await findRefreshTokenByHash(tokenHash)
  if (!tokenRecord) throw new Error('Invalid or expired refresh token')

  // Rotate the refresh token
  await revokeRefreshTokenById(tokenRecord.id)

  // Get the associated account
  const account = await findAccountById(tokenRecord.accountId)
  if (!account) throw new Error('Account not found')

  //Issue new token set (access + refresh)

  // new access token
  const payload = {
    sub: account.id,
    email: account.email,
    role: account.role,
  }
  const access_token = await signJwt(payload, { expiresIn: '15min' })

  // new refresh token
  const newRefreshToken = generateRefreshToken()
  const hashedNewRefreshToken = hashRefreshToken(newRefreshToken)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  await createRefreshToken({
    accountId: account.id,
    tokenHash: hashedNewRefreshToken,
    expiresAt,
  })

  return {
    access_token,
    token_type: 'Bearer',
    expires_in: 900,
    refresh_token: newRefreshToken,
    user: {
      id: account.id,
      email: account.email,
      role: account.role,
    },
  }
}

export async function logout(refreshToken) {
  const tokenHash = hashRefreshToken(refreshToken)
  await revokeRefreshTokenByHash(tokenHash)
}

export async function changePassword(email, currentPassword, newPassword) {
  const account = await findAccountByEmail(email)
  if (!account) throw new Error('Account not found')

  const valid = await verifyPassword(account.passwordHash, currentPassword)
  if (!valid) throw new Error('Current password is incorrect')

  const newPasswordHash = await hashPassword(newPassword)
  await updateAccountPassword(account.id, newPasswordHash)
  await revokeAllRefreshTokensForAccount(account.id)

  // Publish event to RabbitMQ for notification service
  await publishPasswordChanged({ email: account.email })

  return { message: 'Password changed successfully' }
}

export async function requestPasswordReset(email) {
  const account = await findAccountByEmail(email)
  if (!account) return

  // Generate and store password-reset code
  const code = generateVerificationCode()
  const codeHash = hashVerificationCode(code)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 min

  await createPasswordResetToken({
    accountId: account.id,
    tokenHash: codeHash,
    expiresAt,
  })

  // Publish event to RabbitMQ for notification service
  await publishPasswordResetRequested({ email, code })

  return { message: 'Password reset code sent' }
}

export async function verfiyPasswordResetCode(email, code) {
  const account = await findAccountByEmail(email)
  if (!account) throw new Error('Account not found')

  const tokenRecord = await findValidPasswordResetToken(account.id)
  if (!tokenRecord) throw new Error('No valid reset code found or code expired')

  const valid = verifyCodeHash(code, tokenRecord.tokenHash)
  if (!valid) throw new Error('Invalid reset code')

  // Issue a short-lived JWT for password reset
  const payload = {
    sub: account.id,
    email: account.email,
    purpose: 'password_reset',
  }
  const reset_token = await signJwt(payload, { expiresIn: '5m' })

  return { reset_token, expires_in: 300 }
}

export async function setNewPassword(resetToken, newPassword) {
  // verify the reset token
  const payload = await verifyJwt(resetToken)

  // check purpose claim
  if (payload.purpose !== 'password_reset') {
    throw new Error('Invalid token expired')
  }

  // find the account
  const account = await findAccountByEmail(payload.email)
  if (!account) throw new Error('Account not found')

  // update password and revoke all refresh tokens
  const newPasswordHash = await hashPassword(newPassword)
  await updateAccountPassword(account.id, newPasswordHash)
  await revokeAllRefreshTokensForAccount(account.id)

  return { message: 'Password reset successfully' }
}
