import { clerkClient } from '@clerk/nextjs/server';

/** Return the Clerk user with the given user ID. */
export async function getUser(userId: string): Promise<any> {
  return await clerkClient.users.getUser(userId);
}

/** Return the primary email address of the given user. */
export function userPrimaryEmailAddress(user: any): string | null {
  // Try with both snake_case and camelCase, since different Clerk APIs provide different forms.
  let retval = user.email_addresses?.find((e: any) => e.id === user.primary_email_address_id)?.email_address;
  if (!retval) {
    retval = user.emailAddresses?.find((e: any) => e.id === user.primaryEmailAddressId)?.emailAddress;
  }
  return retval || null;
}
