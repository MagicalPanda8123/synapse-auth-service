import { readFile } from 'fs/promises'
import { importSPKI, exportJWK } from 'jose'

// Load public key (PEM)
const publicKeyPem = await readFile('./keys/public.pem', 'utf-8')

// Convert PEM to CryptoKey
const publicKey = await importSPKI(publicKeyPem, 'RS256')

// Export as JWK
const jwk = await exportJWK(publicKey)
jwk.use = 'sig' // means this key is used for signatures (not encryption)
jwk.alg = 'RS256'
jwk.kid = 'main' // match with the kid (key id) used in JWTs

// Export JWKS (array of keys)
export function getJWKS() {
  return { keys: [jwk] }
}
