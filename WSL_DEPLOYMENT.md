# WSL Deployment Guide for whimperi.ng

This guide walks you through deploying the chat application on WSL with your domain https://whimperi.ng/

## Prerequisites

1. WSL2 installed on Windows
2. Ubuntu (or your preferred Linux distro) on WSL
3. Domain `whimperi.ng` pointing to your server's IP address
4. Port 80 and 443 open on your firewall

## Step 1: Install Required Software in WSL

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install PM2 for process management
sudo npm install -g pm2
```

## Step 2: Clone Your Project

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/Mantroh/whimperi.ng.git
cd whimperi.ng

# Install dependencies
npm run install:all
```

## Step 3: Build Frontend

```bash
cd frontend
npm run build
cd ..

# Copy built files to backend dist folder
mkdir -p backend/dist
cp -r frontend/dist/* backend/dist/
```

## Step 4: Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cd backend
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://whimperi.ng
EOF
```

## Step 5: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/whimperi.ng
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name whimperi.ng www.whimperi.ng;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name whimperi.ng www.whimperi.ng;

    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/whimperi.ng/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/whimperi.ng/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy settings for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket timeout
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Proxy other API requests
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve static files
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/whimperi.ng /etc/nginx/sites-enabled/
sudo nginx -t
```

## Step 6: Get SSL Certificate

First, temporarily comment out the SSL certificate lines in nginx config, then:

```bash
# Edit config to remove SSL lines temporarily
sudo nano /etc/nginx/sites-available/whimperi.ng

# Restart nginx
sudo systemctl restart nginx

# Get certificate
sudo certbot --nginx -d whimperi.ng -d www.whimperi.ng

# Certbot will automatically configure SSL
```

## Step 7: Start Application with PM2

```bash
cd ~/whimperi.ng/backend
pm2 start server.production.js --name whimpering-chat
pm2 save
pm2 startup
```

Follow the instructions from `pm2 startup` to enable auto-start on boot.

## Step 8: Configure Firewall (if using UFW)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## Verification

1. Visit https://whimperi.ng/ - you should see your chat application
2. Check PM2 status: `pm2 status`
3. Check Nginx status: `sudo systemctl status nginx`
4. View logs: `pm2 logs whimpering-chat`

## Maintenance Commands

```bash
# View application logs
pm2 logs whimpering-chat

# Restart application
pm2 restart whimpering-chat

# Stop application
pm2 stop whimpering-chat

# Update application
cd ~/whimperi.ng
git pull
npm run install:all
cd frontend && npm run build
cp -r dist/* ../backend/dist/
pm2 restart whimpering-chat

# Restart Nginx
sudo systemctl restart nginx

# Renew SSL (automatically handled by Certbot cron job)
sudo certbot renew --dry-run
```

## Troubleshooting

### Check if port 3000 is listening:
```bash
sudo netstat -tulpn | grep :3000
```

### Check Nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Check if domain is pointing to your server:
```bash
dig whimperi.ng
```

### Test WebSocket connection:
```bash
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3000/socket.io/
```

## Performance Tuning

For production, consider:
1. Enable Nginx caching
2. Use PM2 cluster mode: `pm2 start server.production.js -i max`
3. Monitor with PM2: `pm2 install pm2-logrotate`
4. Set up monitoring with PM2 Plus or similar

## Security Notes

- Keep Node.js and npm updated
- Regularly update SSL certificates (Certbot does this automatically)
- Monitor logs for suspicious activity
- Consider adding rate limiting in Nginx
- Keep your server OS updated
