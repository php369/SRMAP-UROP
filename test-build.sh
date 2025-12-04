#!/bin/bash

# Test Build Script for Render + Vercel Deployment
echo "🧪 Testing Build Process for Deployment"
echo "========================================"

# Test API build
echo "📦 Testing API build..."
cd apps/api
if npm run build:prod; then
    echo "✅ API build successful"
    cd ../..
else
    echo "❌ API build failed"
    cd ../..
    exit 1
fi

# Test Web build
echo "📦 Testing Web build..."
cd apps/web
if npm run build:prod; then
    echo "✅ Web build successful"
    cd ../..
else
    echo "❌ Web build failed"
    cd ../..
    exit 1
fi

echo ""
echo "🎉 All builds successful!"
echo "✅ Ready for Render + Vercel deployment"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Deploy API on Render using render.yaml"
echo "3. Deploy Frontend on Vercel"
echo "4. Configure environment variables"
echo "5. Update CORS settings with actual URLs"