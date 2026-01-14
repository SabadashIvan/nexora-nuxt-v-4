/**
 * Newsletter Subscription Form Validation Schema
 */

import { z } from 'zod'

export const newsletterFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must consent to receive emails',
  }),
  source: z.string().optional(),
  website: z.string().max(0, 'Honeypot field must be empty').optional(), // Honeypot
})

export type NewsletterFormValues = z.infer<typeof newsletterFormSchema>
