#!/bin/bash

# Quick deployment script for whimperi.ng on WSL
# Run this script after following the manual setup in WSL_DEPLOYMENT.md

set -e

echo "🚀 Starting deployment for whimperi.ng..."

# Check if running in WSL
if ! grep -q microsoft /proc/version; then
    echo "⚠️  This script is designed for WSL. Are you sure you want to continue? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update system packages
echo "📦 Updating system packages..."
sudo apt update

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "✅ Node.js $(node -v) is installed"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
else
    echo "✅ npm $(npm -v) is installed"
fi

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
else
    echo "✅ PM2 is installed"
fi

# Check Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    sudo apt install -y nginx
else
    echo "✅ Nginx is installed"
fi

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

# Copy built files to backend
echo "📁 Copying built files to backend..."
mkdir -p backend/dist
cp -r frontend/dist/* backend/dist/

# Create .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating .env file..."
    cat > backend/.env << 'EOF'
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://whimperi.ng
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Check if PM2 process exists
if pm2 list | grep -q "whimpering-chat"; then
    echo "🔄 Restarting existing PM2 process..."
    pm2 restart whimpering-chat
else
    echo "🚀 Starting new PM2 process..."
    cd backend
    pm2 start server.production.js --name whimpering-chat
    pm2 save
    cd ..
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "💡 Next steps:"
echo "   1. Configure Nginx: See WSL_DEPLOYMENT.md"
echo "   2. Get SSL certificate with Certbot"
echo "   3. Point your domain to this server's IP"
echo "   4. Test: https://whimperi.ng/"
echo ""
echo "🔍 View logs with: pm2 logs whimpering-chat"
