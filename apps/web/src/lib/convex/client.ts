import { ConvexReactClient } from 'convex/react';

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

if (!convexUrl) {
  console.error('Missing VITE_CONVEX_URL; Convex client is not configured.');
}

export const convexClient = new ConvexReactClient(convexUrl);
