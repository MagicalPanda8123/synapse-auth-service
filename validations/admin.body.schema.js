import Joi from 'joi'

export const updateAccountStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'SUSPENDED').required(), // Allow only valid statuses
})
