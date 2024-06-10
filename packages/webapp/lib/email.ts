import Mailgun from 'mailgun.js';
import { FormData } from 'formdata-node';

const DEFAULT_FROM_ADDRESS = 'Podverse <noreply@podverse.ai>';
const DEFAULT_EMAIL_DOMAIN = 'mail1.ziggylabs.ai';
const DEFAULT_BCC_ADDRESS = 'matt@podverse.ai';

/** Send an email via Mailgun. */
export async function sendEmail({
  to,
  subject,
  from,
  bcc,
  template,
  templateVars,
  text,
}: {
  to: string;
  subject: string;
  from?: string;
  bcc?: string;
  template?: string;
  templateVars?: Record<string, string>;
  text?: string;
}): Promise<void> {
  const mailgun = new Mailgun(FormData);
  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey) {
    throw new Error('MAILGUN_API_KEY not set');
  }
  const mg = mailgun.client({ username: 'api', key: apiKey });
  const domain = process.env.MAILGUN_DOMAIN || DEFAULT_EMAIL_DOMAIN;
  // @ts-ignore
  const response = await mg.messages.create(domain, {
    from: from || DEFAULT_FROM_ADDRESS,
    to,
    subject,
    bcc: bcc || DEFAULT_BCC_ADDRESS,
    text,
    template,
    'h:X-Mailgun-Variables': JSON.stringify(templateVars),
  });
  console.log(response);
}
