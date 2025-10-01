import {
  generateVerificationCode,
  hashVerificationCode,
  verifyCodeHash,
  hashPassword,
  verifyPassword,
  signJwt,
  signInternalJwt,
  generateRefreshJwt,
  verifyJwt,
  verifyRefreshJwt,
} from '../utils/index.js'

import {
  createAccount,
  deleteAccount,
  findAccountByEmail,
  findAccountById,
  updateAccountPassword,
  verifyAccountEmail,
  createRefreshToken,
  findRefreshTokenByJti,
  revokeRefreshTokenById,
  revokeAllRefreshTokensForAccount,
  revokeRefreshTokenByJti,
  addUserId,
  createVerificationCode,
  invalidateVerificationCode,
  findValidVerificationCode,
  invalidateAllVerificationCodes,
  createVerificationToken,
  revokeVerificationTokenByJti,
  findVerificationTokenByJti,
} from '../repositories/index.js'

import { publishAccountRegistered, publishPasswordChanged, publishPasswordResetRequested } from '../events/publishers/account.publisher.js'

import axios from 'axios'
import { randomUUID } from 'crypto'

/**
 *  HELPER FUNCTIONS HERE -------------------------------------------------------------------------------------
 */
async function generateTokenPair(account) {
  // access token
  const payload = {
    email: account.email,
    role: account.role,
  }
  const accessToken = await signJwt(payload, {
    sub: account.userId,
    iss: 'auth-service',
    aud: 'synapse-api',
  })

  // refresh token
  const jti = randomUUID()
  const refreshToken = await generateRefreshJwt(account, jti)

  await createRefreshToken({
    accountId: account.id,
    jti,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  return {
    accessToken,
    refreshToken,
    // tokenType: 'Bearer',
    accessTokenExpiresIn: 900, // 15 minutes in seconds
    refreshTokenExpiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    user: {
      id: account.userId,
      email: account.email,
      role: account.role,
    },
  }
}

// Create and Store the verification code with custom purpose and duration (in minutes)
async function createAndStoreVerificationCode(accountId, purpose, duration = 15) {
  const code = generateVerificationCode()
  const codeHash = hashVerificationCode(code)
  const expiresAt = new Date(Date.now() + duration * 60 * 1000) // expiration of 15min

  await createVerificationCode({
    accountId,
    codeHash,
    purpose,
    expiresAt,
  })

  return code
}

/**
 * !!! HERE COMES THE MAIN FUNCTIONS ----------------------------------------------------------------------
 */

export async function registerAccount(email, password, username, firstName, lastName, gender) {
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
  let userResponse
  try {
    userResponse = await axios.post(
      process.env.USER_SERVICE_URL,
      {
        account_id: account.id,
        username,
        first_name: firstName,
        last_name: lastName,
        gender,
      },
      {
        headers: {
          Authorization: `Bearer ${internalJwt}`,
        },
      }
    )
  } catch (err) {
    console.error('[User Service] Failed to create user:', err.response?.data || err.message)
    //Rollback: delete the newly created account
    await deleteAccount(account.id)
    throw new Error('Failed to create user profile in user service')
  }

  // add UserId to the account
  await addUserId(account.id, userResponse.data.id)

  console.log(`[User Service] user created : `, userResponse.data)

  // Generate and store verification code
  const code = await createAndStoreVerificationCode(account.id, 'VERIFY_EMAIL')

  // console.log(`verification code for email ${email} : ${code}`)

  // Publish event to RabbitMQ for notification service
  await publishAccountRegistered({ email, username, code })

  return true
}

export async function resendVerificationCode(email) {
  const account = await findAccountByEmail(email)
  if (!account) throw new Error('Account not found')
  if (account.isEmailVerified) throw new Error('Email already verified')

  // Invalidate previous unused codes
  await invalidateAllVerificationCodes(account.id)

  // Generate and store new code
  const code = await createAndStoreVerificationCode(account.id, 'VERIFY_EMAIL')

  // Publish event to RabbitMQ for notification service
  await publishAccountRegistered({ email: account.email, code })

  return { message: 'Verification code resent' }
}

export async function verifyEmailCode(email, code) {
  const account = await findAccountByEmail(email)
  if (!account) throw new Error('Account not found')
  if (account.isEmailVerified) return

  const codeRecord = await findValidVerificationCode(account.id)

  if (!codeRecord) {
    throw new Error('No valid verification code found or code has expired')
  }

  // compare hashes
  const codeHash = hashVerificationCode(code)
  if (codeRecord.codeHash !== codeHash) {
    throw new Error('Incorrect verification code')
  }

  await invalidateVerificationCode(codeRecord.id)
  await verifyAccountEmail(account.id)

  return { message: 'Email verified successfully' }
}

export async function login(email, password) {
  // find the account
  const account = await findAccountByEmail(email)
  if (!account) throw new Error('Account not found')
  if (!account.isEmailVerified) throw new Error('Email not verified')

  // compare password hashes
  const valid = await verifyPassword(account.passwordHash, password)
  if (!valid) throw new Error('Incorrect password')

  return await generateTokenPair(account)
}

export async function refreshAccessToken(refreshToken) {
  const refreshPayload = await verifyRefreshJwt(refreshToken)

  const tokenRecord = await findRefreshTokenByJti(refreshPayload.jti)
  if (tokenRecord.revoked) {
    throw new Error('Refresh token revoked')
  }

  // Get the associated account
  const account = await findAccountById(refreshPayload.sub)
  if (!account) throw new Error('Account not found')

  // revoke this refresh token
  await revokeRefreshTokenById(tokenRecord.id)

  return await generateTokenPair(account)
}

export async function logout(refreshToken) {
  const payload = await verifyRefreshJwt(refreshToken)
  await revokeRefreshTokenByJti(payload.jti)
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
  const code = await createAndStoreVerificationCode(account.id, 'RESET_PASSWORD', 5)

  // Publish event to RabbitMQ for notification service
  await publishPasswordResetRequested({ email, code })

  return { message: 'Password reset code sent' }
}

export async function verfiyPasswordResetCode(email, code) {
  const account = await findAccountByEmail(email)
  if (!account) throw new Error('Account not found')

  const codeRecord = await findValidVerificationCode(account.id)
  if (!codeRecord) throw new Error('No valid reset code found or code expired')

  const valid = verifyCodeHash(code, codeRecord.codeHash)
  if (!valid) throw new Error('Incorrect password-reset code')

  // if valid, invalidate this code
  await invalidateVerificationCode(codeRecord.id)

  // Issue a short-lived JWT for password reset
  const jti = randomUUID()
  const payload = {
    jti,
    email: account.email,
    purpose: 'RESET_PASSWORD',
  }
  const resetToken = await signJwt(payload, {
    sub: account.id,
    expiresIn: '3m',
  })

  await createVerificationToken({
    codeId: codeRecord.id,
    jti,
    expiresAt: new Date(Date.now() + 3 * 60 * 1000),
  })

  return { resetToken, expiresIn: 180 }
}

export async function setNewPassword(email, newPassword, jti) {
  // check if the token is revoked
  const tokenRecord = await findVerificationTokenByJti(jti)
  if (tokenRecord.revoked) throw new Error('Reset token revoked')
  // find the account
  const account = await findAccountByEmail(email)
  if (!account) throw new Error('Account not found')

  // update password and revoke all refresh tokens
  const newPasswordHash = await hashPassword(newPassword)
  await revokeVerificationTokenByJti(jti)
  await revokeAllRefreshTokensForAccount(account.id)
  await updateAccountPassword(account.id, newPasswordHash)

  return { message: 'Password reset successfully' }
}

export async function getMe(email) {
  return await findAccountByEmail(email)
}
