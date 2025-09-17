import prisma from '../config/prisma.js'

export async function findAccountById(id) {
  return await prisma.account.findUnique({ where: { id } })
}

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

export async function updateAccountPassword(accountId, newHash) {
  return await prisma.account.update({
    where: { id: accountId },
    data: { passwordHash: newHash },
  })
}

export async function deleteAccount(accountId) {
  return await prisma.account.delete({ where: { id: accountId } })
}
