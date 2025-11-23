# Vercel Deployment - Ready to Deploy! 🚀

## ✅ Pre-Deployment Checklist

- [x] Backend API deployed and accessible
- [x] API URL configured: `https://pharmecyapi.pixelforgebd.com`
- [x] SSL certificate installed on backend
- [x] Frontend code ready
- [x] Environment variables documented

## 🌐 Production API Configuration

Your backend is live at:
- **API Base URL**: `https://pharmecyapi.pixelforgebd.com/api/v1`
- **Socket.IO URL**: `https://pharmecyapi.pixelforgebd.com`
- **Health Check**: `https://pharmecyapi.pixelforgebd.com/health`

## 📋 Vercel Deployment Steps

### Step 1: Push Code to Git

```bash
cd frontend
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Select the repository

### Step 3: Configure Project Settings

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `frontend` (if monorepo) or leave blank
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### Step 4: Set Environment Variables ⚠️ IMPORTANT

Go to **Settings** → **Environment Variables** and add:

#### For Production Environment:
```
NEXT_PUBLIC_API_URL = https://pharmecyapi.pixelforgebd.com/api/v1
NEXT_PUBLIC_SOCKET_URL = https://pharmecyapi.pixelforgebd.com
```

#### For Preview Environment (optional):
```
NEXT_PUBLIC_API_URL = https://pharmecyapi.pixelforgebd.com/api/v1
NEXT_PUBLIC_SOCKET_URL = https://pharmecyapi.pixelforgebd.com
```

#### For Development Environment (optional):
```
NEXT_PUBLIC_API_URL = http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL = http://localhost:5000
```

**Important Notes:**
- ✅ Set these for **Production**, **Preview**, and **Development** environments
- ✅ Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- ✅ Make sure the API URL includes `/api/v1` at the end

### Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (usually 2-5 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## ✅ Post-Deployment Verification

After deployment, verify:

- [ ] Application loads without errors
- [ ] Can access login page
- [ ] API connection works (test login)
- [ ] Socket.IO connection works (if applicable)
- [ ] All routes are accessible
- [ ] Authentication flow works
- [ ] No CORS errors in browser console

## 🔧 Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Run `npm run build` locally to see errors
3. Ensure all dependencies are in `package.json`

### API Connection Issues

1. Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
2. Check browser console for CORS errors
3. Verify backend CORS allows your Vercel domain
4. Test API directly: `https://pharmecyapi.pixelforgebd.com/health`

### CORS Errors

If you see CORS errors, update backend `.env` file:
```
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

Then restart backend:
```bash
ssh root@146.190.86.14
cd /opt/pharma360-backend/backend
docker-compose restart backend
```

## 🌍 Custom Domain Setup

1. Go to **Settings** → **Domains** in Vercel
2. Add your custom domain (e.g., `app.pixelforgebd.com`)
3. Follow DNS configuration instructions
4. SSL certificate is automatic

## 📊 Current Backend Status

- ✅ **Backend URL**: `https://pharmecyapi.pixelforgebd.com`
- ✅ **SSL Certificate**: Valid until Feb 21, 2026
- ✅ **Status**: Running and healthy
- ✅ **CORS**: Configured (may need to add Vercel domain)

## 🚀 Quick Deploy Command

If using Vercel CLI:

```bash
cd frontend
vercel --prod
```

## 📝 Environment Variables Summary

| Variable | Production Value | Description |
|----------|-----------------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://pharmecyapi.pixelforgebd.com/api/v1` | Backend API endpoint |
| `NEXT_PUBLIC_SOCKET_URL` | `https://pharmecyapi.pixelforgebd.com` | Socket.IO server URL |

## 🎉 You're Ready!

Your frontend is now ready for Vercel deployment. Just follow the steps above and you'll be live in minutes!

