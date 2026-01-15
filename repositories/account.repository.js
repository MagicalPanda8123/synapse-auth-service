import prisma from '../config/prisma.js'

export async function findAccountById(id) {
  return await prisma.account.findUnique({ where: { id } })
}

export async function findAccountByEmail(email) {
  return await prisma.account.findUnique({ where: { email } })
}

export async function findAccountByUsername(username) {
  return await prisma.account.findUnique({ where: { username } })
}

export async function createAccount(data) {
  return await prisma.$transaction(async (tx) => {
    // Create the account
    const account = await tx.account.create({ data })

    // Log the account creation
    await log(account.id, 'ACCOUNT_CREATED', 'Account created successfully', tx)

    return account
  })
}

export async function verifyAccountEmail(accountId) {
  return await prisma.$transaction(async (tx) => {
    // Update the account to mark email as verified
    const account = await tx.account.update({
      where: { id: accountId },
      data: {
        isEmailVerified: true,
        status: 'ACTIVE',
        verifiedAt: new Date(),
      },
    })

    // Log the email verification event
    await log(account.id, 'EMAIL_VERIFIED', 'Email verified successfully', tx)

    return account
  })
}

export async function updateAccountPassword(accountId, newHash) {
  return await prisma.$transaction(async (tx) => {
    // Update the account password
    const account = await tx.account.update({
      where: { id: accountId },
      data: { passwordHash: newHash },
    })

    // Log the password update event
    await log(account.id, 'PASSWORD_CHANGED', 'Password updated successfully', tx)

    return account
  })
}

export async function deleteAccount(accountId) {
  return await prisma.account.delete({ where: { id: accountId } })
}

export async function addUserId(accountId, userId) {
  return await prisma.account.update({
    where: { id: accountId },
    data: { userId },
  })
}

export async function updatUsername(userId, newUsername) {
  return await prisma.account.update({
    where: { userId },
    data: { username: newUsername },
  })
}

export async function getLatestUserSummary() {
  return await prisma.userSummary.findFirst({
    orderBy: { summaryDate: 'desc' }, // Fetch the most recent record
  })
}

export async function getAccounts(page = 1, limit = 10, q = '') {
  const skip = (page - 1) * limit // Calculate the number of records to skip

  const accounts = await prisma.account.findMany({
    take: limit, // Fetch only the number of records specified by the limit
    skip, // Skip the appropriate number of records based on the page
    where: q ? { username: { contains: q, mode: 'insensitive' } } : {}, // Filter by query if provided
    orderBy: { createdAt: 'desc' }, // Order by creation date in descending order
    select: {
      id: true,
      userId: true,
      username: true,
      email: true,
      isEmailVerified: true,
      role: true,
      status: true,
      verifiedAt: true,
      createdAt: true,
      updatedAt: true,
    }, // Exclude passwordHash
  })

  const totalRecords = await prisma.account.count({
    where: q ? { username: { contains: q, mode: 'insensitive' } } : {}, // Count total records matching the query
  })

  const totalPages = Math.ceil(totalRecords / limit) // Calculate the total number of pages

  return {
    accounts,
    pagination: {
      currentPage: page,
      totalPages,
      totalRecords,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

export async function getAccountLogs(accountId, cursor, limit = 10) {
  const logs = await prisma.accountLog.findMany({
    where: { accountId }, // Filter logs by accountId
    take: limit + 1, // Fetch one extra item to determine pagination
    skip: cursor ? 1 : 0, // Skip the cursor if provided
    cursor: cursor ? { id: cursor.id, createdAt: cursor.createdAt } : undefined, // Use compound cursor
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], // Ensure consistent ordering
  })

  const hasMore = logs.length > limit // Determine if there are more logs
  const nextCursor = hasMore
    ? { id: logs[limit - 1].id, createdAt: logs[limit - 1].createdAt } // Use compound cursor for next page
    : null

  return {
    logs: logs.slice(0, limit), // Return only the requested number of logs
    pagination: {
      hasMore,
      nextCursor,
    },
  }
}

export async function updateAccountStatus(accountId, newStatus, performedBy) {
  return await prisma.$transaction(async (tx) => {
    // Update the account status
    const account = await tx.account.update({
      where: { id: accountId },
      data: { status: newStatus },
    })

    // Log the status update
    await tx.accountLog.create({
      data: {
        accountId,
        action: `ACCOUNT_${newStatus.toUpperCase() === 'ACTIVE' ? 'ACTIVATED' : newStatus.toUpperCase()}`, // Log action based on new status
        performedBy,
        details: `Account status updated to ${newStatus}`,
      },
    })

    return account
  })
}

export async function getUserSummaryOverTime(startDate, endDate) {
  return await prisma.userSummary.findMany({
    where: {
      summaryDate: {
        gte: new Date(startDate), // Greater than or equal to startDate
        lte: new Date(endDate), // Less than or equal to endDate
      },
    },
    orderBy: { summaryDate: 'asc' }, // Order by summaryDate in ascending order
  })
}

// Reusable log function
async function log(accountId, action, details, tx) {
  return await tx.accountLog.create({
    data: {
      accountId,
      action,
      details,
    },
  })
}
