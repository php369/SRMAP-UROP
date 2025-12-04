#!/bin/bash

# Render Build Script
# This script ensures a clean build without workspace dependencies

set -e  # Exit on error

echo "🚀 Starting Render build..."

# Ensure we're in the API directory
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"

# Remove any existing node_modules and lock files
echo "🧹 Cleaning previous builds..."
rm -rf node_modules package-lock.json

# Install dependencies with legacy peer deps
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --no-package-lock

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Build complete!"
