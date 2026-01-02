# Quick Start for WSL Deployment

## One-Command Setup

After cloning the repo in WSL, run:

```bash
chmod +x deploy-wsl.sh
./deploy-wsl.sh
```

## Manual Setup (if needed)

### 1. Prerequisites in WSL

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

### 2. Build and Deploy

```bash
# Install dependencies
npm run install:all

# Build frontend
cd frontend && npm run build
mkdir -p ../backend/dist
cp -r dist/* ../backend/dist/

# Create environment
cat > backend/.env << 'EOF'
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://whimperi.ng
EOF

# Start with PM2
cd backend
pm2 start server.production.js --name whimpering-chat
pm2 save
pm2 startup
```

### 3. Configure Nginx

```bash
# Copy config
sudo cp nginx.conf /etc/nginx/sites-available/whimperi.ng
sudo ln -s /etc/nginx/sites-available/whimperi.ng /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Get SSL Certificate

```bash
sudo certbot --nginx -d whimperi.ng -d www.whimperi.ng
```

### 5. Configure DNS

Point your domain to your server:
- Type: A
- Name: @
- Value: [Your Server IP]

- Type: A  
- Name: www
- Value: [Your Server IP]

## Verify Deployment

```bash
# Check PM2
pm2 status

# Check Nginx
sudo systemctl status nginx

# Test locally
curl http://localhost:3000

# View logs
pm2 logs whimpering-chat
```

## Access Your Site

Visit: https://whimperi.ng/

## Updating the Application

```bash
cd ~/whimperi.ng
git pull
npm run install:all
cd frontend && npm run build
cp -r dist/* ../backend/dist/
pm2 restart whimpering-chat
```

## Troubleshooting

**Can't connect to server:**
```bash
# Check if Node.js is running
pm2 status
pm2 logs whimpering-chat

# Check ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :443
```

**SSL issues:**
```bash
sudo certbot renew --dry-run
sudo systemctl restart nginx
```

**WebSocket connection failed:**
- Check firewall: `sudo ufw status`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Ensure WebSocket upgrade headers are in nginx config

For detailed instructions, see [WSL_DEPLOYMENT.md](WSL_DEPLOYMENT.md)
