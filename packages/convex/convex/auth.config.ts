/**
 * Convex Auth Configuration for Clerk
 * 
 * Convex validates Clerk JWTs automatically when you use
 * ConvexProviderWithClerk. Set CLERK_JWT_ISSUER_DOMAIN in
 * Convex environment variables.
 * 
 * @see https://docs.convex.dev/auth/clerk
 */
declare const process: {
  env: Record<string, string | undefined>;
};

export default {
  providers: [
    {
      // Clerk issuer domain - set in Convex dashboard
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
