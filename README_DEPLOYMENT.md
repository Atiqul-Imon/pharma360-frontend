# 🚀 Frontend Deployment - Ready for Vercel

## ✅ Status: Ready to Deploy

Your frontend is ready for Vercel deployment!

- ✅ Build passes successfully
- ✅ Backend API is live and accessible
- ✅ Environment variables documented
- ✅ Configuration files in place

## 🌐 Backend API Information

- **Production API URL**: `https://pharmecyapi.pixelforgebd.com/api/v1`
- **Socket.IO URL**: `https://pharmecyapi.pixelforgebd.com`
- **Health Check**: `https://pharmecyapi.pixelforgebd.com/health`

## 📋 Quick Deployment Steps

### 1. Set Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables**:

**Production:**
```
NEXT_PUBLIC_API_URL=https://pharmecyapi.pixelforgebd.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://pharmecyapi.pixelforgebd.com
```

**Preview:**
```
NEXT_PUBLIC_API_URL=https://pharmecyapi.pixelforgebd.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://pharmecyapi.pixelforgebd.com
```

### 2. Deploy

1. Push your code to Git
2. Import repository in Vercel
3. Set environment variables (see above)
4. Click "Deploy"

### 3. Update Backend CORS (After Deployment)

Once you have your Vercel URL, update backend CORS:

```bash
ssh root@146.190.86.14
cd /opt/pharma360-backend/backend
nano .env
```

Add your Vercel domain to `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

Then restart:
```bash
docker-compose restart backend
```

## 📚 Documentation

- **Quick Setup**: `VERCEL_SETUP.md`
- **Detailed Guide**: `VERCEL_DEPLOYMENT.md`
- **Full Deployment**: `DEPLOYMENT.md`

## ✅ Pre-Deployment Checklist

- [x] Code pushed to Git
- [x] Build passes locally (`npm run build`)
- [x] Backend API is accessible
- [x] Environment variables documented
- [ ] Vercel project created
- [ ] Environment variables set in Vercel
- [ ] First deployment completed
- [ ] Backend CORS updated with Vercel domain

## 🎉 You're All Set!

Your frontend is ready. Just follow the steps above and deploy to Vercel!

