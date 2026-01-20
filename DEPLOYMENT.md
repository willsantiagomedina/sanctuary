# Sanctuary Deployment Guide

This guide covers deploying Sanctuary to production using Cloudflare Pages, Convex, and BetterAuth.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                          │
├─────────────────────────────────────────────────────────────┤
│  sanctuary.app (Pages)  │  assets.sanctuary.app (R2 + CDN) │
│  api.sanctuary.app (Workers)                                │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌───────────┐   ┌──────────┐
        │  Convex  │   │ BetterAuth│   │    R2    │
        │ (Backend)│   │  (Auth)   │   │ (Storage)│
        └──────────┘   └───────────┘   └──────────┘
```

## Prerequisites

1. **Cloudflare Account** with Pages and R2 enabled
2. **Convex Account** with a project created
3. **BetterAuth Account** with OAuth providers configured
4. **GitHub Repository** for CI/CD

## Step 1: Configure Convex

### 1.1 Create Production Deployment

```bash
# Login to Convex
npx convex login

# Create production deployment
npx convex deploy --prod
```

### 1.2 Get Deploy Key

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project → Settings → Deploy Keys
3. Create a new deploy key for CI/CD
4. Save as `CONVEX_DEPLOY_KEY` in GitHub Secrets

### 1.3 Configure Auth

Update `packages/convex/convex/auth.config.ts` with your BetterAuth domain:

```ts
export default {
  providers: [
    {
      domain: "https://your-project.betterauth.com",
      applicationID: "sanctuary",
    },
  ],
};
```

## Step 2: Configure BetterAuth

### 2.1 Create Project

1. Go to [BetterAuth Dashboard](https://betterauth.com)
2. Create new project "Sanctuary"
3. Configure OAuth providers (Google, GitHub, etc.)

### 2.2 Set Callback URLs

Add these callback URLs:
- `https://sanctuary.app/auth/callback`
- `https://staging.sanctuary.app/auth/callback`
- `http://localhost:3000/auth/callback`
- `sanctuary://auth/callback` (for Electron)

### 2.3 Note Configuration

Save your BetterAuth URL (e.g., `https://auth.betterauth.com/your-project`)

## Step 3: Configure Cloudflare

### 3.1 Create Pages Project

1. Go to Cloudflare Dashboard → Pages
2. Create new project → Connect to GitHub
3. Select the Sanctuary repository
4. Configure build settings:
   - **Build command**: `pnpm --filter @sanctuary/web build`
   - **Build output directory**: `apps/web/dist`
   - **Root directory**: `/`

### 3.2 Set Environment Variables

In Pages Settings → Environment Variables:

| Variable | Production Value | Preview Value |
|----------|-----------------|---------------|
| `VITE_CONVEX_URL` | `https://your-prod.convex.cloud` | `https://your-staging.convex.cloud` |
| `VITE_BETTERAUTH_URL` | `https://auth.betterauth.com/your-project` | Same |
| `VITE_APP_URL` | `https://sanctuary.app` | `https://{branch}.sanctuary.pages.dev` |
| `VITE_ASSETS_URL` | `https://assets.sanctuary.app` | Same |

### 3.3 Create R2 Bucket

1. Go to R2 → Create bucket
2. Name: `sanctuary-assets`
3. Configure public access for `/public/*` path

### 3.4 Configure Custom Domain

1. Pages → Custom domains → Add `sanctuary.app`
2. R2 → Custom domains → Add `assets.sanctuary.app`

## Step 4: Configure GitHub Secrets

Add these secrets to your GitHub repository:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages and R2 permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `CONVEX_DEPLOY_KEY` | Convex production deploy key |
| `APPLE_CERTIFICATE_P12` | Base64-encoded Apple signing certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Certificate password |
| `APPLE_ID` | Apple ID for notarization |
| `APPLE_ID_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | Apple Developer Team ID |

Add these variables (Settings → Secrets and Variables → Variables):

| Variable | Value |
|----------|-------|
| `VITE_CONVEX_URL` | Your Convex production URL |
| `VITE_BETTERAUTH_URL` | Your BetterAuth URL |
| `VITE_APP_URL` | `https://sanctuary.app` |
| `VITE_ASSETS_URL` | `https://assets.sanctuary.app` |

## Step 5: Deploy

### 5.1 Initial Deployment

```bash
# Push to main branch
git push origin main
```

The GitHub Actions workflow will:
1. Run lint and typecheck
2. Deploy Convex functions
3. Build and deploy web app to Cloudflare Pages

### 5.2 Release Electron App

```bash
# Create a release tag
git tag v1.0.0
git push origin v1.0.0
```

This triggers the Electron release workflow which:
1. Builds for macOS and Windows
2. Signs and notarizes macOS app
3. Uploads to R2 for auto-updates
4. Creates GitHub Release

## Step 6: Deploy Bible API Worker (Optional)

```bash
cd workers/bible-proxy

# Create KV namespace
npx wrangler kv:namespace create BIBLE_CACHE
npx wrangler kv:namespace create BIBLE_CACHE --preview

# Update wrangler.toml with namespace IDs

# Set API key
npx wrangler secret put BIBLE_API_KEY

# Deploy
npx wrangler deploy
```

## DNS Configuration

Configure these DNS records in Cloudflare:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | @ | sanctuary.pages.dev | ✅ |
| CNAME | www | sanctuary.app | ✅ |
| CNAME | assets | (R2 custom domain) | ✅ |
| CNAME | api | sanctuary-bible-proxy.workers.dev | ✅ |
| CNAME | staging | staging.sanctuary.pages.dev | ✅ |

## Monitoring

### Convex Dashboard
- Function execution logs
- Database usage
- Real-time subscriptions

### Cloudflare Dashboard
- Pages deployment logs
- R2 storage metrics
- Workers analytics

### BetterAuth Dashboard
- Login attempts
- OAuth flows
- Session management

## Troubleshooting

### Build Failures

1. Check environment variables are set correctly
2. Verify pnpm lockfile is up to date
3. Check Cloudflare Pages build logs

### Auth Issues

1. Verify callback URLs in BetterAuth
2. Check CORS headers in `_headers` file
3. Confirm Convex auth config matches BetterAuth domain

### Electron Updates Not Working

1. Verify R2 bucket has correct files
2. Check `latest.yml` / `latest-mac.yml` format
3. Confirm app is signed and notarized (macOS)

## Security Checklist

- [ ] All secrets stored in GitHub Secrets (not in code)
- [ ] Cloudflare WAF rules enabled
- [ ] HTTPS enforced on all domains
- [ ] CSP headers configured in `_headers`
- [ ] Electron context isolation enabled
- [ ] OAuth state validation in BetterAuth
- [ ] Rate limiting on API endpoints
