import { readFile } from 'fs/promises'
import { importPKCS8, importSPKI, jwtVerify, SignJWT } from 'jose'
import crypto, { randomUUID } from 'crypto'

const JWT_PRIVATE_KEY_PATH = process.env.JWT_PRIVATE_KEY_PATH
const JWT_PUBLIC_KEY_PATH = process.env.JWT_PUBLIC_KEY_PATH
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN

let publicKey

/**
 * PEM - Privacy Enhanced Mail
 *  A file format, a text-based encoding for cryptographic data (keys, certs)
 *
 * PKCS8 - Private Key Cryptography Standards #8
 *  A standard format for storing private keys
 *
 * CryptoKey - a JS object that the Web Crypto API can use
 */

// Load private key (PEM)
const privateKeyPem = await readFile(JWT_PRIVATE_KEY_PATH, 'utf8')

// Convert PEM to CryptoKey (RS256 - RSA with SHA-256)
const privateKey = await importPKCS8(privateKeyPem, 'RS256')

// Sign JWT
export async function signJwt(payload, options = {}) {
  // a typical jwt (header.payload.signature)
  return await new SignJWT(payload)
    .setProtectedHeader({
      // it's called "protected" because this header is also signed in conjunction with the payload.
      alg: 'RS256',
      typ: 'JWT',
      kid: 'main',
    })
    .setIssuer(options.iss)
    .setSubject(options.sub)
    .setAudience(options.setAudience)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN || '15min')
    .sign(privateKey)
}

// Sign internal JWT
export async function signInternalJwt(payload, options = {}) {
  return await new SignJWT(payload)
    .setProtectedHeader({
      alg: 'RS256',
      typ: 'JWT',
      kid: 'main',
    })
    .setIssuer(options.iss)
    .setSubject(options.sub)
    .setAudience(options.setAudience)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN || '15min')
    .sign(privateKey)
}

// generate refresh token
export async function generateRefreshJwt(account, jti) {
  // helper: convert secret string to Uint8Array (jose requires this format)
  const encoder = new TextEncoder()
  const secretKey = encoder.encode(REFRESH_TOKEN_SECRET)

  const refreshToken = await new SignJWT({
    sub: account.id,
    email: account.email,
    type: 'refresh',
    jti,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(secretKey)

  return refreshToken
}

//verify refresh token
export async function verifyRefreshJwt(token) {
  // helper: convert secret string to Uint8Array (jose requires this format)
  const encoder = new TextEncoder()
  const secretKey = encoder.encode(REFRESH_TOKEN_SECRET)
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function getPublicKey() {
  if (!publicKey) {
    const publicKeyPem = await readFile(JWT_PUBLIC_KEY_PATH, 'utf8')
    publicKey = await importSPKI(publicKeyPem, 'RS256')
  }
  return publicKey
}

export async function verifyJwt(token, options = {}) {
  const key = await getPublicKey()
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['RS256'],
      ...options,
    })
    return payload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}
