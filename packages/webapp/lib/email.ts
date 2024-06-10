import Mailgun from 'mailgun.js';
import { FormData } from 'formdata-node';

const DEFAULT_TO_ADDRESS = 'matt@ziggylabs.ai';
const DEFAULT_FROM_ADDRESS = 'Podverse <noreply@podverse.ai>';
const DEFAULT_EMAIL_DOMAIN = 'mail1.podverse.ai';
const DEFAULT_BCC_ADDRESS = 'matt@podverse.ai';

/** Send an email via Mailgun. */
export async function sendEmail({
  subject,
  to = DEFAULT_TO_ADDRESS,
  from = DEFAULT_FROM_ADDRESS,
  bcc = DEFAULT_BCC_ADDRESS,
  template,
  templateVars,
  text,
}: {
  subject: string;
  to?: string;
  from?: string;
  bcc?: string;
  template?: string;
  templateVars?: Record<string, string>;
  text?: string;
}): Promise<void> {
  console.log(`Sending email to ${to} with subject ${subject}`);
  try {
    const mailgun = new Mailgun(FormData);
    const apiKey = process.env.MAILGUN_API_KEY;
    if (!apiKey) {
      throw new Error('MAILGUN_API_KEY not set');
    }
    const mg = mailgun.client({ username: 'api', key: apiKey });
    const domain = process.env.MAILGUN_DOMAIN || DEFAULT_EMAIL_DOMAIN;
    // @ts-ignore
    const response = await mg.messages.create(domain, {
      from,
      to,
      subject,
      bcc,
      text,
      template,
      'h:X-Mailgun-Variables': templateVars ? JSON.stringify(templateVars) : undefined,
    });
    console.log(`Sent email: ${JSON.stringify(response)}`);
  } catch (error) {
    console.error(`Error sending email: ${JSON.stringify(error)}`);
    console.trace(error);
  }
}
