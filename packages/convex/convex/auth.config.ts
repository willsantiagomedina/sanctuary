/**
 * Convex Auth Configuration
 * 
 * This configures Convex to validate BetterAuth JWTs.
 * Convex will fetch the JWKS from BetterAuth to verify tokens.
 * 
 * Note: Set AUTH_BETTERAUTH_URL in Convex environment variables
 * when authentication is enabled.
 */
export default {
  providers: [
    // Uncomment when BetterAuth is configured:
    // {
    //   domain: process.env.AUTH_BETTERAUTH_URL || "https://auth.betterauth.com/your-project",
    //   applicationID: "sanctuary",
    // },
  ],
};
