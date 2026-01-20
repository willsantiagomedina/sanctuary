/**
 * Convex Auth Configuration
 * 
 * This configures Convex to validate BetterAuth JWTs.
 * Convex will fetch the JWKS from BetterAuth to verify tokens.
 */
export default {
  providers: [
    {
      // BetterAuth JWKS endpoint for token validation
      domain: process.env.AUTH_BETTERAUTH_URL || "https://auth.betterauth.com/your-project",
      applicationID: "sanctuary",
    },
  ],
};
