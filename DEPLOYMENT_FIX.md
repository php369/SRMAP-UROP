# Deployment Fix Guide

## Changes Made

1. ✅ Created `apps/web/.env.production` with production API URL
2. ✅ Removed unused three.js dependencies from `vite.config.ts`
3. ✅ Build now works successfully

## Next Steps

### 1. Commit and Push Changes

```bash
git add apps/web/.env.production apps/web/vite.config.ts
git commit -m "fix: configure production environment and remove unused three.js dependencies"
git push
```

### 2. Configure Vercel Environment Variables

Go to your Vercel project dashboard:
- Navigate to: **Settings → Environment Variables**
- Add these variables for **Production** environment:

```
VITE_API_BASE_URL=https://srm-portal-api.onrender.com
VITE_API_URL=https://srm-portal-api.onrender.com
VITE_API_VERSION=v1
VITE_GOOGLE_CLIENT_ID=991881977285-78os7d1b0id4orsn1etvi87t9ofhe6nc.apps.googleusercontent.com
VITE_ENVIRONMENT=production
VITE_WEBSOCKET_URL=wss://srm-portal-api.onrender.com
VITE_CLOUDINARY_CLOUD_NAME=dz1ytivuu
```

### 3. Trigger Deployment

After pushing, Vercel will automatically deploy. Or you can:
- Go to Vercel dashboard → **Deployments**
- Click **Redeploy** on the latest deployment

### 4. Verify Deployment

Once deployed, check:
- ✅ Frontend loads: https://srmap-urop-web.vercel.app
- ✅ API connection works (no more CORS errors)
- ✅ Console shows correct API URL (not localhost)

## What Was Fixed

### Problem 1: CORS Errors
**Cause:** Frontend was trying to connect to `http://localhost:3001` in production
**Fix:** Created `.env.production` with correct production API URL

### Problem 2: Build Failure
**Cause:** Vite config referenced `three.js` packages that weren't installed
**Fix:** Removed three.js from manual chunks and optimizeDeps

## Testing

Your API is already deployed and working:
- Health: https://srm-portal-api.onrender.com/health
- Status: https://srm-portal-api.onrender.com/api/v1/status

After redeployment, your frontend will connect to the correct backend!
