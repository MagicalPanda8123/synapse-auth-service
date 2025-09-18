import prisma from '../config/prisma.js'

export async function createVerificationCode(data) {
  return await prisma.verificationCode.create({ data })
}

// Mark all codes' status to "used"
export async function invalidateAllVerificationCodes(accountId) {
  return await prisma.verificationCode.updateMany({
    where: { accountId, used: false, expiresAt: { gt: new Date() } },
    data: { used: true },
  })
}

// Mark a code's status to "used"
export async function invalidateVerificationCode(id) {
  return await prisma.verificationCode.update({
    where: { id },
    data: { used: true },
  })
}

// Find the latest valid, unused code
export async function findValidVerificationCode(accountId) {
  return await prisma.verificationCode.findFirst({
    where: { accountId, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
}
