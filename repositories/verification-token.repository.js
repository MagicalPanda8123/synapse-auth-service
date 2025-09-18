import prisma from '../config/prisma.js'

export async function createVerificationToken(data) {
  return await prisma.verificationToken.create({ data })
}

export async function revokeVerificationTokenByJti(jti) {
  return await prisma.verificationToken.update({
    where: { jti },
    data: { revoked: true },
  })
}

export async function findVerificationTokenByJti(jti) {
  return await prisma.verificationToken.findUnique({
    where: { jti },
  })
}
