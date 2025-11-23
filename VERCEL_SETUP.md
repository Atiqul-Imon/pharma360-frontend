# Quick Vercel Deployment Checklist

## Before Deployment

✅ Build passes locally: `npm run build`  
✅ All environment variables documented  
✅ `.env.local` file is in `.gitignore`  

## Environment Variables to Set in Vercel

Go to **Settings → Environment Variables** and add:

### Production
```
NEXT_PUBLIC_API_URL=https://pharmecyapi.pixelforgebd.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://pharmecyapi.pixelforgebd.com
```

### Preview (optional - for staging)
```
NEXT_PUBLIC_API_URL=https://pharmecyapi.pixelforgebd.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://pharmecyapi.pixelforgebd.com
```

### Development (for local testing)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Deployment Steps

1. **Push to Git**: Ensure all changes are pushed to your repository
2. **Connect to Vercel**: Import your Git repository in Vercel dashboard
3. **Configure Project**:
   - Framework: Next.js (auto-detected)
   - Root Directory: `frontend` (if monorepo) or leave blank
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
4. **Set Environment Variables**: Add the variables listed above
5. **Deploy**: Click "Deploy" and wait for build to complete

## Post-Deployment

- [ ] Test the deployed URL
- [ ] Verify API connection works
- [ ] Test authentication flow
- [ ] Check all routes are accessible
- [ ] Verify Socket.IO connection (if applicable)

## Custom Domain

1. Go to **Settings → Domains**
2. Add your domain (e.g., `app.yourdomain.com`)
3. Update DNS records as instructed
4. SSL certificate is automatic

## Troubleshooting

**Build fails?**
- Check build logs in Vercel dashboard
- Run `npm run build` locally to see errors

**API not connecting?**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings on backend
- Ensure backend is publicly accessible

**404 errors?**
- Verify routes are properly configured
- Check if dynamic routes use correct syntax

For detailed instructions, see `DEPLOYMENT.md`.

