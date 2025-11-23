# ✅ Vercel Deployment Checklist

## Pre-Deployment ✅

- [x] Frontend code ready
- [x] Build passes locally (`npm run build`)
- [x] Backend API deployed and accessible
- [x] Backend SSL certificate installed
- [x] Environment variables documented

## Deployment Steps

### 1. Git Preparation
- [ ] Code committed to Git
- [ ] Code pushed to repository
- [ ] Repository is accessible from Vercel

### 2. Vercel Project Setup
- [ ] Vercel account created
- [ ] Project created in Vercel
- [ ] Repository connected
- [ ] Framework auto-detected (Next.js)

### 3. Environment Variables ⚠️ CRITICAL
Set these in Vercel Dashboard → Settings → Environment Variables:

**For Production:**
```
NEXT_PUBLIC_API_URL=https://pharmecyapi.pixelforgebd.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://pharmecyapi.pixelforgebd.com
```

**For Preview:**
```
NEXT_PUBLIC_API_URL=https://pharmecyapi.pixelforgebd.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://pharmecyapi.pixelforgebd.com
```

### 4. Deploy
- [ ] Click "Deploy" button
- [ ] Wait for build to complete
- [ ] Note your Vercel URL (e.g., `https://your-app.vercel.app`)

### 5. Backend CORS Update ⚠️ REQUIRED
After deployment, update backend CORS:

```bash
ssh root@146.190.86.14
cd /opt/pharma360-backend/backend
nano .env
```

Update `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://your-app.vercel.app
```

Restart backend:
```bash
docker-compose restart backend
```

### 6. Verification
- [ ] Frontend loads without errors
- [ ] Can access login page
- [ ] API connection works (test login)
- [ ] No CORS errors in browser console
- [ ] Socket.IO connection works (if applicable)
- [ ] All routes accessible

## 🎉 Deployment Complete!

Your frontend is now live on Vercel!

## 📝 Important URLs

- **Backend API**: `https://pharmecyapi.pixelforgebd.com`
- **Frontend**: `https://your-app.vercel.app` (your Vercel URL)
- **Health Check**: `https://pharmecyapi.pixelforgebd.com/health`

## 🔧 Troubleshooting

### CORS Errors
- Update `ALLOWED_ORIGINS` in backend `.env`
- Restart backend: `docker-compose restart backend`

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` in Vercel settings
- Check browser console for errors
- Test API directly: `https://pharmecyapi.pixelforgebd.com/health`

### Build Failures
- Check Vercel build logs
- Run `npm run build` locally
- Ensure all dependencies are in `package.json`

