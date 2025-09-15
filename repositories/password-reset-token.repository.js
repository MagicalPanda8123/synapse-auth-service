import prisma from '../config/prisma.js'

export async function createPasswordResetToken(data) {
  return await prisma.passwordResetToken.create({ data })
}

export async function findValidPasswordResetToken(accountId) {
  return await prisma.passwordResetToken.findFirst({
    where: {
      accountId,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}
