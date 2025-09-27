import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../utils/index.js'
const prisma = new PrismaClient()

async function main() {
  await prisma.account.createMany({
    data: [
      {
        id: 'acc999',
        userId: 'user999',
        email: 'm.khang8123@gmail.com',
        passwordHash: await hashPassword('minhkhang123'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      },
      {
        id: 'acc888',
        userId: 'user888',
        email: 'dhlananh2309@gmail.com',
        passwordHash: await hashPassword('lananh123'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      },
      {
        id: 'acc001',
        userId: 'user001',
        email: 'testuser1@example.com',
        passwordHash: await hashPassword('password1'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      },
      {
        id: 'acc002',
        userId: 'user002',
        email: 'testuser2@example.com',
        passwordHash: await hashPassword('password2'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      },
      {
        id: 'acc003',
        userId: 'user003',
        email: 'testuser3@example.com',
        passwordHash: await hashPassword('password3'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      },
      {
        id: 'acc004',
        userId: 'user004',
        email: 'testuser4@example.com',
        passwordHash: await hashPassword('password4'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      },
      {
        id: 'acc005',
        userId: 'user005',
        email: 'testuser5@example.com',
        passwordHash: await hashPassword('password5'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      },
      {
        id: 'acc006',
        userId: 'user006',
        email: 'testuser6@example.com',
        passwordHash: await hashPassword('password6'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      },
      {
        id: 'acc007',
        userId: 'user007',
        email: 'testuser7@example.com',
        passwordHash: await hashPassword('password7'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      },
      {
        id: 'acc008',
        userId: 'user008',
        email: 'testuser8@example.com',
        passwordHash: await hashPassword('password8'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      },
      {
        id: 'acc009',
        userId: 'user009',
        email: 'testuser9@example.com',
        passwordHash: await hashPassword('password9'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      },
      {
        id: 'acc010',
        userId: 'user010',
        email: 'testuser10@example.com',
        passwordHash: await hashPassword('password10'),
        isEmailVerified: true,
        role: 'USER',
        status: 'ACTIVE'
      },
      {
        id: 'accadmin',
        userId: 'useradmin',
        email: 'admin@example.com',
        passwordHash: await hashPassword('adminpassword'),
        isEmailVerified: true,
        role: 'SYSTEM_ADMIN',
        status: 'ACTIVE'
      }
    ],
    skipDuplicates: true
  })

  console.log('✅ Auth seed data created successfully!')
  console.log('👤 Accounts: 11 (10 USER + 1 SYSTEM_ADMIN)')
  console.log('🔑 All accounts have default passwords (password1-10, adminpassword)')
  console.log('✅ All accounts are verified and active')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
