import Joi from 'joi'

export const getAccountsQuerySchema = Joi.object({
  page: Joi.number().integer().positive().default(1), // Limit for pagination
  limit: Joi.number().integer().positive().default(10), // Limit for pagination
  q: Joi.string().optional().allow(''), // Search query for username
})

export const getAccountLogsQuerySchema = Joi.object({
  cursorId: Joi.string().optional(), // Separate field for cursor ID
  cursorCreatedAt: Joi.date().optional(), // Separate field for cursor createdAt
  limit: Joi.number().integer().positive().default(10), // Limit for pagination
})

export const getUserSummaryOverTimeQuerySchema = Joi.object({
  startDate: Joi.date()
    .default(() => {
      const today = new Date()
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 7)
      return sevenDaysAgo.toISOString()
    })
    .optional(), // Default to 7 days ago

  endDate: Joi.date()
    .default(() => new Date().toISOString()) // Default to today
    .optional(), // Default to today
})
