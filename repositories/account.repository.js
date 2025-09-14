import prisma from '../config/prisma.js'

export async function findAccountByEmail(email) {
  return await prisma.account.findUnique({ where: { email } })
}

export async function createAccount(data) {
  return await prisma.account.create({ data })
}

export async function verifyAccountEmail(accountId) {
  return await prisma.account.update({
    where: { id: accountId },
    data: { isEmailVerified: true, status: 'ACTIVE' },
  })
}
