import Mailgun from 'mailgun.js';
import { FormData } from 'formdata-node';
import { getUser, userPrimaryEmailAddress } from '@/lib/users';

const DEFAULT_TO_ADDRESS = 'matt@ziggylabs.ai';
const DEFAULT_FROM_ADDRESS = 'Podverse <noreply@podverse.ai>';
const DEFAULT_EMAIL_DOMAIN = 'mail1.podverse.ai';
const DEFAULT_BCC_ADDRESS = 'matt@podverse.ai';

/** Send an email via Mailgun. */
export async function sendEmail({
  subject,
  to,
  from,
  bcc,
  userId,
  template,
  templateVars,
  text,
}: {
  subject: string;
  to?: string;
  from?: string;
  bcc?: string;
  userId?: string;
  template?: string;
  templateVars?: Record<string, string>;
  text?: string;
}): Promise<void> {
  if (to && userId) {
    throw new Error('Cannot specify both to and userId');
  }
  let toAddress;
  if (userId) {
    const user = await getUser(userId);
    toAddress = userPrimaryEmailAddress(user);
    if (!toAddress) {
      throw new Error(`User ${userId} has no email address`);
    }
  } else {
    toAddress = to || DEFAULT_TO_ADDRESS;
  }

  console.log(`Sending email to ${toAddress} with subject ${subject}`);
  try {
    const mailgun = new Mailgun(FormData);
    const apiKey = process.env.MAILGUN_API_KEY;
    if (!apiKey) {
      throw new Error('MAILGUN_API_KEY not set');
    }
    const mg = mailgun.client({ username: 'api', key: apiKey });
    const domain = process.env.MAILGUN_DOMAIN || DEFAULT_EMAIL_DOMAIN;
    let response;
    if (text) {
      // @ts-ignore
      response = await mg.messages.create(domain, {
        from: from || DEFAULT_FROM_ADDRESS,
        to: toAddress,
        subject,
        bcc: bcc || DEFAULT_BCC_ADDRESS,
        text,
      });
    } else {
      // @ts-ignore
      response = await mg.messages.create(domain, {
        from: from || DEFAULT_FROM_ADDRESS,
        to: toAddress,
        subject,
        bcc: bcc || DEFAULT_BCC_ADDRESS,
        template,
        'h:X-Mailgun-Variables': templateVars ? JSON.stringify(templateVars) : undefined,
      });
    }
    console.log(`Sent email: ${JSON.stringify(response)}`);
  } catch (error) {
    console.error(`Error sending email: ${JSON.stringify(error)}`);
    console.trace(error);
  }
}
