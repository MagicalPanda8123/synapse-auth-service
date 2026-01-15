import * as accountRepo from '../repositories/account.repository.js'

export async function getUserSummary() {
  const summary = await accountRepo.getLatestUserSummary()
  return summary
}

export async function getAccounts(page, limit, q) {
  return await accountRepo.getAccounts(page, limit, q)
}

export async function getAccountLogs(accountId, cursor, limit) {
  return await accountRepo.getAccountLogs(accountId, cursor, limit)
}

export async function updateAccountStatus(accountId, newStatus, performedBy) {
  const validTransitions = {
    PENDING: ['ACTIVE'], // A pending account can be activated
    ACTIVE: ['SUSPENDED'], // An active account can be suspended
    SUSPENDED: ['ACTIVE'], // a suspended account can be re-activated
  }

  // Fetch the current account status
  const account = await accountRepo.findAccountById(accountId)
  if (!account) {
    throw new Error('Account not found')
  }

  // Validate the status transition
  if (!validTransitions[account.status]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${account.status} to ${newStatus}`)
  }

  // Update the account status
  return await accountRepo.updateAccountStatus(accountId, newStatus, performedBy)
}

export async function getUserSummaryOverTime(startDate, endDate) {
  return await accountRepo.getUserSummaryOverTime(startDate, endDate)
}
