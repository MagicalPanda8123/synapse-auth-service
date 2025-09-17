import { readFile } from 'fs/promises'
import { importPKCS8, importSPKI, jwtVerify, SignJWT } from 'jose'
import crypto from 'crypto'

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
const privateKeyPem = await readFile('./keys/private.pem', 'utf8')

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
    .setExpirationTime(options.expiresIn || '15min')
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
    .setExpirationTime(options.expiresIn || '15min')
    .sign(privateKey)
}

export function generateRefreshToken() {
  // extremely unlikely to produce 2 identical tokens here
  return crypto.randomBytes(32).toString('hex')
}

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function getPublicKey() {
  if (!publicKey) {
    const publicKeyPem = await readFile('./keys/public.pem', 'utf8')
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
