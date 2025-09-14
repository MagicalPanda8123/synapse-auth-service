import prisma from '../config/prisma.js'
import { publishAccountRegistered } from '../events/publishers/accountRegistered.publisher.js'
import {
  generateVerificationCode,
  hashVerificationCode,
} from '../utils/verificationCode.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import {
  createAccount,
  findAccountByEmail,
  verifyAccountEmail,
} from '../repositories/account.repository.js'
import {
  createVerificationToken,
  findValidVerificationToken,
  invalidateVerificationTokens,
  markVerificationTokenUsed,
} from '../repositories/verificationToken.repository.js'
import { signJwt } from '../utils/jwt.js'

export async function registerAccount(email, password, username) {
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

  return account
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

  // Prepare JWT payload
  const payload = {
    sub: account.id,
    email: account.email,
    role: account.role,
  }

  const access_token = await signJwt(payload, { expiresAt: '15min' })
  const refresh_token = 'daddy chill </3'

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
