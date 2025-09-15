import crypto from 'crypto'

// Generate a 6-digit numeric code
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Hash the code (for secure DB storage)
export function hashVerificationCode(code) {
  // interpreted as "take this token and hash it, then ouputs in hexadecimal format"
  return crypto.createHash('sha256').update(code).digest('hex')
}

// Verify a code against a hash
export function verifyCodeHash(code, hash) {
  return hashVerificationCode(code) === hash
}
