import argon2 from 'argon2'

// Hash a password
export async function hashPassword(password) {
  return await argon2.hash(password, { type: argon2.argon2id })
}

export async function verifyPassword(hash, password) {
  return await argon2.verify(hash, password)
}
