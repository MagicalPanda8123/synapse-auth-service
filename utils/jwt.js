import { readFile } from 'fs/promises'
import { importPKCS8, SignJWT } from 'jose'

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
    // it's called "protected" because this header is also signed in conjunction with the payload.
    .setProtectedHeader({
      alg: 'RS256',
      typ: 'JWT',
      kid: 'main',
    })
    .setIssuedAt()
    .setExpirationTime(options.expiresIn || '15min')
    .sign(privateKey)
}
