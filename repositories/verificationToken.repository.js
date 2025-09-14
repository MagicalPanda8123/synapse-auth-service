import prisma from '../config/prisma.js'

export async function createVerificationToken(data) {
  return await prisma.verificationToken.create({ data })
}

// invalidate previous unused verification tokens
export async function invalidateVerificationTokens(accountId) {
  return await prisma.verificationToken.updateMany({
    where: { accountId, used: false, expiresAt: { gt: new Date() } },
    data: { used: true },
  })
}

// find the latest, unused, unexpired verification token for an account
export async function findValidVerificationToken(accountId) {
  return await prisma.verificationToken.findFirst({
    where: {
      accountId,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function markVerificationTokenUsed(tokenId) {
  return await prisma.verificationToken.update({
    where: { id: tokenId },
    data: { used: true },
  })
}
