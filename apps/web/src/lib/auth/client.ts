/**
 * Clerk authentication client
 * 
 * Set VITE_CLERK_PUBLISHABLE_KEY in your environment to enable auth.
 */

const publishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const clerkPublishableKey = publishableKey as string;
export const isClerkConfigured = !!publishableKey;
