import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Bindings } from '../index'
import { successResponse, errorResponse, ErrorCodes } from '../utils/response'
import { sendEmail, createTokenEmailHtml } from '../services/mailgun'

// Schema for email request
const emailSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email address too long')
    .transform((email) => email.toLowerCase().trim()),
  token: z
    .string()
    .regex(
      /^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/,
      'Invalid token format. Expected format: XXX-XXX-XXX'
    ),
})

export const emailRoute = new Hono<{ Bindings: Bindings }>()

emailRoute.post('/', zValidator('json', emailSchema), async (c) => {
  const { email, token } = c.req.valid('json')

  // Check if Mailgun is configured
  if (!c.env.MAILGUN_API_KEY || !c.env.MAILGUN_DOMAIN) {
    console.error('Mailgun not configured')
    return errorResponse(
      c,
      ErrorCodes.INTERNAL_ERROR,
      'Email service is not configured',
      500
    )
  }

  try {
    // Verify that the token exists in the database
    const user = await c.env.DB.prepare(
      'SELECT token, email FROM users WHERE token = ?'
    )
      .bind(token)
      .first<{ token: string; email: string | null }>()

    if (!user) {
      return errorResponse(
        c,
        ErrorCodes.TOKEN_NOT_FOUND,
        'No data found for this token. Please sync your data first before sending the recovery email.',
        404
      )
    }

    // Update user's email in the database
    await c.env.DB.prepare('UPDATE users SET email = ? WHERE token = ?')
      .bind(email, token)
      .run()

    // Generate restore URL
    const baseUrl =
      c.env.ENVIRONMENT === 'development'
        ? 'http://localhost:5173'
        : 'https://prioritiz.pages.dev'
    const restoreUrl = `${baseUrl}/restore/${token}`

    // Create email HTML
    const html = createTokenEmailHtml(token, restoreUrl)

    // Send email
    const result = await sendEmail(
      {
        to: email,
        subject: 'Din Prioritiz återställningskod',
        html,
      },
      c.env.MAILGUN_API_KEY,
      c.env.MAILGUN_DOMAIN
    )

    if (!result.success) {
      console.error('Failed to send email:', result.error)
      return errorResponse(
        c,
        ErrorCodes.EMAIL_SEND_FAILED,
        'Failed to send email. Please try again later.',
        500
      )
    }

    return successResponse(c, {
      message: 'Recovery email sent successfully',
      sentTo: maskEmail(email),
    })
  } catch (error) {
    console.error('Email endpoint error:', error)
    return errorResponse(
      c,
      ErrorCodes.INTERNAL_ERROR,
      'An unexpected error occurred while sending the email',
      500
    )
  }
})

/**
 * Masks an email address for privacy in the response
 * e.g., "user@example.com" becomes "u***@example.com"
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!domain || localPart.length <= 1) {
    return email
  }

  const maskedLocal =
    localPart[0] + '*'.repeat(Math.min(localPart.length - 1, 3))
  return `${maskedLocal}@${domain}`
}
