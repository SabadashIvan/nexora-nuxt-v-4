/**
 * Contact Form Validation Schema
 * Example form schema using Zod
 */

import { z } from 'zod'

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
  type: z.enum(['general', 'technical', 'billing', 'other']).default('general'),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>
