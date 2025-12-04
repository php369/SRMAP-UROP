#!/bin/bash
set -e

echo "🚀 Starting build..."

# Clean
echo "🧹 Cleaning..."
rm -rf node_modules dist package-lock.json

# Install
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build
echo "🔨 Building..."
npm run build

echo "✅ Build complete!"
