import express from 'express'
import { authMiddleware, adminAuthMiddleware } from '../middleware/auth.middleware.js'
import { validateBody, validateQuery } from '../middleware/validation.middleware.js'
import { getAccountLogsQuerySchema, getAccountsQuerySchema, getUserSummaryOverTimeQuerySchema } from '../validations/admin.query.schema.js'
import * as adminController from '../controllers/admin.controller.js'
import { updateAccountStatusSchema } from '../validations/admin.body.schema.js'

const router = express.Router()

// Summarized data
router.get('/accounts/summary', authMiddleware, adminAuthMiddleware, adminController.getUserSummaryController)

// All accounts
router.get('/accounts', authMiddleware, adminAuthMiddleware, validateQuery(getAccountsQuerySchema), adminController.getAllAccountsController)

// // Account logs
router.get('/accounts/:id/logs', authMiddleware, adminAuthMiddleware, validateQuery(getAccountLogsQuerySchema), adminController.getAccountLogsController)

// // Update account status
router.patch('/accounts/:id', authMiddleware, adminAuthMiddleware, validateBody(updateAccountStatusSchema), adminController.updateAccountStatusController)

// // Delete account
// router.delete('/accounts/:id', authMiddleware, adminAuthMiddleware, adminController.deleteAccountController)

// // User summary over time
router.get('/accounts/summary-over-time', authMiddleware, adminAuthMiddleware, validateQuery(getUserSummaryOverTimeQuerySchema), adminController.getUserSummaryOverTimeController)

export default router
