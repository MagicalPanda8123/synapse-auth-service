import prisma from '../config/prisma.js'

export async function createRefreshToken(data) {
  return await prisma.refreshToken.create({ data })
}

// find VALID refresh token (ie. not revoked, not expired)
export async function findRefreshTokenByHash(tokenHash) {
  // use findFirst because of its lookup behavior (either returns the first match or null)
  return await prisma.refreshToken.findFirst({
    where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } },
  })
}

export async function revokeRefreshTokenById(id) {
  return await prisma.refreshToken.update({
    where: { id },
    data: { revoked: true },
  })
}
