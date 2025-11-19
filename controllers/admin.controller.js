import * as adminService from '../services/admin.service.js'

export async function getUserSummaryController(req, res, next) {
  try {
    const summary = await adminService.getUserSummary()
    res.json(summary)
  } catch (error) {
    next(error)
  }
}

export async function getAllAccountsController(req, res, next) {
  try {
    const { page = 1, limit = 10, q = '' } = req.validatedQuery

    const accounts = await adminService.getAccounts(parseInt(page), parseInt(limit), q)
    res.json(accounts)
  } catch (error) {
    next(error)
  }
}

export async function getAccountLogsController(req, res, next) {
  try {
    const { id } = req.params // Extract account ID from route params
    const { cursorId, cursorCreatedAt, limit = 10 } = req.validatedQuery // Extract validated query parameters

    // Construct the cursor object if both fields are provided
    const cursor = cursorId && cursorCreatedAt ? { id: cursorId, createdAt: cursorCreatedAt } : null

    const logs = await adminService.getAccountLogs(id, cursor, parseInt(limit))
    res.json(logs)
  } catch (error) {
    next(error)
  }
}

export async function updateAccountStatusController(req, res, next) {
  try {
    const { id } = req.params // Extract account ID from route params
    const { status } = req.validatedBody // Extract new status from request body
    const performedBy = req.user.sub // Extract admin ID from authenticated user

    const updatedAccount = await adminService.updateAccountStatus(id, status, performedBy)
    res.json(updatedAccount)
  } catch (error) {
    next(error)
  }
}

export async function getUserSummaryOverTimeController(req, res, next) {
  try {
    const { startDate, endDate } = req.validatedQuery // Extract validated query parameters

    const summaries = await adminService.getUserSummaryOverTime(startDate, endDate)
    res.json(summaries)
  } catch (error) {
    next(error)
  }
}
