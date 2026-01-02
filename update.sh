#!/bin/bash

# Quick update script for whimperi.ng
# Run this on your WSL server after pushing changes to GitHub

set -e

echo "🔄 Updating whimperi.ng application..."

# Navigate to project directory
cd ~/whimperi.ng

# Stash any local changes to avoid conflicts
echo "💾 Stashing local changes..."
git stash

# Pull latest changes
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Reapply stashed changes if needed (optional)
# git stash pop

# Install dependencies if package.json changed
echo "📦 Checking for dependency updates..."
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Rebuild frontend
echo "🔨 Rebuilding frontend..."
cd frontend
npm run build

# Copy to backend
echo "📁 Copying build files..."
cp -r dist/* ../backend/dist/
cd ..

# Restart PM2 app
echo "🔄 Restarting application..."
pm2 restart whimpering-chat

# Show status
echo ""
echo "✅ Update complete!"
echo ""
pm2 status
pm2 logs whimpering-chat --lines 10

echo ""
echo "🌐 Visit https://whimperi.ng to see your changes"
