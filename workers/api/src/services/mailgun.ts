interface SendEmailParams {
  to: string
  subject: string
  html: string
}

interface MailgunResponse {
  id?: string
  message?: string
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 * when interpolating dynamic values into HTML templates.
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char])
}

/**
 * Sends an email using the Mailgun API
 */
export async function sendEmail(
  params: SendEmailParams,
  apiKey: string,
  domain: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, html } = params

  // Create form data for Mailgun API
  const formData = new FormData()
  formData.append('from', `Prioritiz <noreply@${domain}>`)
  formData.append('to', to)
  formData.append('subject', subject)
  formData.append('html', html)

  // Add plain text version for email clients that don't support HTML
  const plainText = htmlToPlainText(html)
  formData.append('text', plainText)

  try {
    const response = await fetch(
      `https://api.mailgun.net/v3/${domain}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
        },
        body: formData,
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Mailgun API error:', response.status, errorText)
      return {
        success: false,
        error: `Mailgun returned ${response.status}: ${errorText}`,
      }
    }

    const result: MailgunResponse = await response.json()
    return {
      success: true,
      messageId: result.id,
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Converts HTML to plain text for email clients that don't support HTML
 */
function htmlToPlainText(html: string): string {
  return html
    // Remove HTML tags
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Creates the HTML template for the token recovery email
 */
export function createTokenEmailHtml(token: string, restoreUrl: string): string {
  // Escape all dynamic values to prevent XSS attacks
  const safeToken = escapeHtml(token)
  const safeRestoreUrl = escapeHtml(restoreUrl)

  return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Din Prioritiz kod</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a1a; color: #ffffff;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a1a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff;">
                Prioritiz
              </h1>
            </td>
          </tr>

          <!-- Main content card -->
          <tr>
            <td style="background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%); border-radius: 16px; padding: 40px 32px; border: 1px solid rgba(255,255,255,0.1);">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 24px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                      Din aterställningskod
                    </h2>
                    <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #a0a0a0;">
                      Spara detta mail for att kunna aterstalla din lista om du rensar webblasardata eller byter enhet.
                    </p>
                  </td>
                </tr>

                <!-- Token display -->
                <tr>
                  <td style="padding: 24px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: rgba(99, 102, 241, 0.15); border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.3);">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6366f1;">
                            Din kod
                          </p>
                          <p style="margin: 0; font-size: 36px; font-family: 'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-weight: 700; letter-spacing: 4px; color: #ffffff;">
                            ${safeToken}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td style="padding: 8px 0 24px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${safeRestoreUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Aterstall min lista
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Instructions -->
                <tr>
                  <td style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #a0a0a0;">
                      <strong style="color: #ffffff;">Sa har gor du:</strong>
                    </p>
                    <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #a0a0a0;">
                      <li>Klicka pa knappen ovan, eller</li>
                      <li>Ga till prioritiz.pages.dev</li>
                      <li>Valj "Aterstall" och ange koden</li>
                    </ol>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #666666;">
                Om du inte begarde denna kod kan du ignorera detta mail.
              </p>
              <p style="margin: 0; font-size: 12px; color: #666666;">
                &copy; ${new Date().getFullYear()} Prioritiz. Alla rattigheter forbehallna.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
