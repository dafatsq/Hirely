/**
 * Zod validation schemas for API input validation
 * All user inputs MUST be validated using these schemas
 */

import { z } from 'zod'

// =============================================================================
// COMMON VALIDATORS
// =============================================================================

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format')

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email too long')
  .toLowerCase()
  .trim()

// Password validation (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// Safe string (no script tags, limited length)
export const safeStringSchema = z
  .string()
  .max(1000, 'Text too long')
  .transform((val) => val.trim())
  .refine((val) => !/<script|javascript:|on\w+=/i.test(val), 'Invalid characters detected')

// Short safe string (for fields with specific length limits like location)
export const shortStringSchema = z
  .string()
  .max(255, 'Text too long')
  .transform((val) => val.trim())
  .refine((val) => !/<script|javascript:|on\w+=/i.test(val), 'Invalid characters detected')

// Long text (for descriptions, bios, etc.)
export const longTextSchema = z
  .string()
  .max(10000, 'Text too long')
  .transform((val) => val.trim())
  .refine((val) => !/<script|javascript:|on\w+=/i.test(val), 'Invalid characters detected')

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL')
  .max(2048, 'URL too long')
  .refine(
    (url) => url.startsWith('https://') || url.startsWith('http://'),
    'URL must use HTTP or HTTPS protocol'
  )

// Phone number (basic validation)
export const phoneSchema = z
  .string()
  .max(20, 'Phone number too long')
  .regex(/^[\d\s\-+()]*$/, 'Invalid phone number format')
  .optional()

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: safeStringSchema.refine((val) => val.length >= 2, 'Name must be at least 2 characters'),
  phone: phoneSchema,
  role: z.enum(['jobseeker', 'employer']).default('jobseeker'),
})

// =============================================================================
// USER PROFILE SCHEMAS
// =============================================================================

export const updateProfileSchema = z.object({
  fullName: safeStringSchema.optional(),
  phone: phoneSchema,
  location: shortStringSchema.optional(),
  bio: longTextSchema.optional(),
  avatarUrl: urlSchema.optional().nullable(),
})

// =============================================================================
// JOB SCHEMAS
// =============================================================================

export const jobFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: shortStringSchema.optional(),
  location: shortStringSchema.optional(),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
  minSalary: z.coerce.number().int().min(0).max(10000000).optional(),
  maxSalary: z.coerce.number().int().min(0).max(10000000).optional(),
  skills: z.array(z.string().max(50)).max(20).optional(),
})

export const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).transform(val => val.trim()).refine(val => !/<script|javascript:|on\w+=/i.test(val), 'Invalid characters detected'),
  description: longTextSchema.refine(val => val.length >= 50, 'Description must be at least 50 characters'),
  requirements: longTextSchema.optional(),
  location: shortStringSchema,
  salary_min: z.number().int().min(0).max(10000000).optional(),
  salary_max: z.number().int().min(0).max(10000000).optional(),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  skills: z.array(z.string().max(50)).max(20).optional(),
})

// =============================================================================
// APPLICATION SCHEMAS
// =============================================================================

export const applyJobSchema = z.object({
  jobId: uuidSchema,
  coverLetter: longTextSchema.optional(),
})

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'accepted', 'rejected']),
})

// =============================================================================
// COMPANY SCHEMAS
// =============================================================================

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(200).transform(val => val.trim()).refine(val => !/<script|javascript:|on\w+=/i.test(val), 'Invalid characters detected'),
  description: longTextSchema.optional(),
  website: urlSchema.optional(),
  location: shortStringSchema.optional(),
  industry: z.string().max(100).transform(val => val.trim()).refine(val => !/<script|javascript:|on\w+=/i.test(val), 'Invalid characters detected').optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
  logo_url: urlSchema.optional(),
})

export const rateCompanySchema = z.object({
  applicationId: uuidSchema,
  rating: z.number().int().min(1).max(5),
  review: z.string().max(2000).transform(val => val.trim()).refine(val => !/<script|javascript:|on\w+=/i.test(val), 'Invalid characters detected').optional(),
})

// =============================================================================
// REPORT SCHEMAS
// =============================================================================

export const reportCompanySchema = z.object({
  applicationId: uuidSchema,
  reportType: z.enum([
    'fake_job',
    'fraudulent_company',
    'inappropriate_content',
    'scam',
    'misleading_info',
    'other',
  ]),
  description: z.string().min(20, 'Please provide more details').max(5000).transform(val => val.trim()).refine(val => !/<script|javascript:|on\w+=/i.test(val), 'Invalid characters detected'),
})

export const updateReportStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed', 'rejected']),
})

// =============================================================================
// ADMIN SCHEMAS
// =============================================================================

export const updateCompanyVerificationSchema = z.object({
  verified: z.boolean(),
})

export const updateJobStatusSchema = z.object({
  status: z.enum(['open', 'closed', 'paused']),
})

// =============================================================================
// CHATBOT SCHEMA
// =============================================================================

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(4000).transform(val => val.trim()).refine(val => !/<script|javascript:|on\w+=/i.test(val), 'Invalid characters detected'),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(10000),
      })
    )
    .max(50) // Limit conversation history to prevent abuse
    .optional(),
})

// =============================================================================
// PAGINATION HELPER
// =============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type JobFiltersInput = z.infer<typeof jobFiltersSchema>
export type CreateJobInput = z.infer<typeof createJobSchema>
export type ApplyJobInput = z.infer<typeof applyJobSchema>
export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type RateCompanyInput = z.infer<typeof rateCompanySchema>
export type ReportCompanyInput = z.infer<typeof reportCompanySchema>
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
