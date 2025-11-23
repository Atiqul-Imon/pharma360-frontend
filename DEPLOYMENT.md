# Vercel Deployment Guide

This guide will help you deploy the Pharma360 frontend to Vercel.

## Prerequisites

1. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Backend API**: Your backend should be deployed and publicly accessible (e.g., DigitalOcean, AWS, etc.)

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your code is pushed to your Git repository:

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Select the repository containing the frontend code

### 3. Configure Project Settings

Vercel should auto-detect Next.js, but verify these settings:

- **Framework Preset**: Next.js
- **Root Directory**: `frontend` (if your repo has a monorepo structure, otherwise leave blank)
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (leave default)
- **Install Command**: `npm install`

### 4. Set Environment Variables

In the Vercel project settings, go to **Settings** → **Environment Variables** and add:

#### Required Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api/v1` | Backend API URL (must include `/api/v1`) |

#### Optional Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SOCKET_URL` | `https://api.yourdomain.com` | Socket.IO server URL (if different from API) |

**Important**: 
- Set these variables for **Production**, **Preview**, and **Development** environments
- Use different URLs for staging vs production if needed
- Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser

### 5. Deploy

1. Click **"Deploy"** button
2. Vercel will:
   - Install dependencies
   - Run the build command
   - Deploy to production

### 6. Verify Deployment

After deployment completes:

1. Visit your deployment URL (e.g., `https://your-project.vercel.app`)
2. Check the browser console for any errors
3. Test login functionality to verify API connection
4. Verify all routes are working correctly

## Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Environment variables are correctly set
- [ ] API connection is working (test login)
- [ ] Socket.IO connection works (if applicable)
- [ ] All routes are accessible
- [ ] Authentication flow works correctly
- [ ] Images and assets load properly

## Custom Domain Setup

1. Go to **Settings** → **Domains**
2. Add your custom domain (e.g., `app.yourdomain.com`)
3. Follow Vercel's DNS configuration instructions
4. Vercel automatically provisions SSL certificates

## Environment-Specific Deployments

Vercel automatically creates:
- **Production**: Deployed from your main branch
- **Preview**: Deployed from pull requests and other branches

You can use different environment variables for each:
- Production: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1`
- Preview: `NEXT_PUBLIC_API_URL=https://staging-api.yourdomain.com/api/v1`

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Run `npm run build` locally to identify issues
3. Ensure all environment variables are set

### API Connection Issues

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check CORS settings on your backend
3. Ensure backend is publicly accessible

### Socket.IO Connection Issues

1. Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly
2. Check if Socket.IO server supports WebSocket connections
3. Verify firewall/security group settings on backend

### 404 Errors

1. Check if routes are properly configured in `next.config.mjs`
2. Verify `vercel.json` rewrites are correct
3. Ensure dynamic routes are using proper syntax

## CI/CD Integration

Vercel automatically deploys:
- **Production**: Every push to main branch
- **Preview**: Every pull request

You can also:
- Trigger deployments manually
- Set up deployment webhooks
- Integrate with GitHub Actions

## Performance Optimization

After deployment, consider:

1. **Vercel Analytics**: Enable in project settings for performance insights
2. **Image Optimization**: Vercel automatically optimizes Next.js Image components
3. **Edge Functions**: Migrate API routes to Edge Functions if needed
4. **Caching**: Configure cache headers in `next.config.mjs`

## Monitoring

Set up monitoring:

1. **Error Tracking**: Integrate Sentry or LogRocket
2. **Analytics**: Use Vercel Analytics or Google Analytics
3. **Uptime Monitoring**: Use services like UptimeRobot

## Rollback

If something goes wrong:

1. Go to **Deployments** tab
2. Find the last working deployment
3. Click **"..."** → **"Promote to Production"**

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Support](https://vercel.com/support)

