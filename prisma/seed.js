import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../utils/index.js'
const prisma = new PrismaClient()

async function main() {
  await prisma.account.createMany({
    data: [
      {
        id: 'acc001',
        userId: 'user001',
        email: 'testuser1@example.com',
        passwordHash: await hashPassword('password1'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: 'acc002',
        userId: 'user002',
        email: 'testuser2@example.com',
        passwordHash: await hashPassword('password2'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: 'acc003',
        userId: 'user003',
        email: 'testuser3@example.com',
        passwordHash: await hashPassword('password3'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: 'acc004',
        userId: 'user004',
        email: 'testuser4@example.com',
        passwordHash: await hashPassword('password4'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: 'acc005',
        userId: 'user005',
        email: 'testuser5@example.com',
        passwordHash: await hashPassword('password5'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE',
      },
      {
        id: 'accadmin',
        userId: 'useradmin',
        email: 'admin@example.com',
        passwordHash: await hashPassword('adminpassword'),
        isEmailVerified: true,
        role: 'SYSTEM_ADMIN',
        status: 'ACTIVE',
      },
    ],
    skipDuplicates: true,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
