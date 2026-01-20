/**
 * Clerk authentication client
 * 
 * Set VITE_CLERK_PUBLISHABLE_KEY in your environment to enable auth.
 * When not set, the app runs in anonymous mode.
 */

export const isClerkConfigured = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
