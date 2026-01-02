# 🌐 Deploy to Your Website Space

## 📦 What to Upload

Your production build is ready in: **`backend/`** folder

Upload these files to your web server:

```
backend/
├── server.production.js       # Main server file
├── webrtc-signaling.js        # WebRTC module
├── package.json               # Dependencies
├── package-lock.json          # Lock file
└── [frontend/dist/ contents]  # Static files (will be served by server)
```

---

## 🚀 Deployment Steps

### **Step 1: Upload Files**

Upload to your web hosting via:
- FTP/SFTP
- cPanel File Manager
- SSH/SCP
- Control panel upload

### **Step 2: Install Dependencies**

SSH into your server and run:
```bash
cd /path/to/your/backend
npm install
```

### **Step 3: Start Server**

```bash
# Option A: Direct run
node server.production.js

# Option B: With PM2 (keeps running)
npm install -g pm2
pm2 start server.production.js --name "enterprise-portal"
pm2 save
```

### **Step 4: Configure Port**

By default runs on port 3000. To use port 80 (standard HTTP):

```bash
# Set environment variable
export PORT=80

# Or edit server.production.js line 9:
const PORT = process.env.PORT || 80;
```

**Note**: Port 80 requires root/admin access

---

## 🔧 Web Server Configuration

### **Apache (.htaccess)**

Create `.htaccess` in your web root:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# WebSocket support
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]
```

### **Nginx**

Add to your nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **cPanel Node.js App**

1. Go to **Setup Node.js App**
2. Click **Create Application**
3. Settings:
   - Node.js version: 14+ (or latest)
   - Application root: `/home/user/backend`
   - Application URL: `yourdomain.com`
   - Application startup file: `server.production.js`
4. Click **Create**

---

## 🌐 Domain & SSL

### **HTTP vs HTTPS**

⚠️ **WebRTC requires HTTPS** for camera/microphone access!

### **Get Free SSL Certificate**

**Option 1: Let's Encrypt (Recommended)**
```bash
sudo certbot --nginx -d yourdomain.com
# Or for Apache:
sudo certbot --apache -d yourdomain.com
```

**Option 2: Cloudflare**
- Add your domain to Cloudflare (free plan)
- Enable "Flexible SSL"
- Cloudflare handles SSL automatically!

**Option 3: cPanel AutoSSL**
- Most cPanel hosts provide free AutoSSL
- Enable in SSL/TLS section

---

## 🔥 Keep Server Running (PM2)

```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start server.production.js --name "enterprise-portal"

# Auto-start on server reboot
pm2 startup
pm2 save

# Monitor
pm2 status
pm2 logs enterprise-portal

# Restart
pm2 restart enterprise-portal
```

---

## 📂 Alternative: Static + Separate Backend

If your hosting doesn't support Node.js:

### **Option A: Upload to Static Host + Backend on Render**

1. **Frontend**: Upload `frontend/dist/` contents to your website
2. **Backend**: Deploy `backend/` to Render.com (free tier)
3. **Update**: Change `frontend/src/config.js`:
   ```javascript
   SERVER_URL: 'https://your-backend.onrender.com'
   ```
4. Rebuild: `npm run build`
5. Re-upload frontend

### **Option B: Use Cloudflare Workers**

Turn backend into serverless functions (advanced, requires code changes)

---

## ✅ Verify Deployment

After deployment, test:

1. **Visit**: `https://yourdomain.com`
2. **Check browser console**: Should see "Connected to server"
3. **Test room**: Create/join room with code
4. **Test messaging**: Send messages
5. **Test calls**: Try audio/video (requires HTTPS!)

---

## 🔍 Troubleshooting

### **Port already in use**
```bash
# Find process using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### **WebSocket connection fails**
- Check firewall allows port 3000
- Verify web server proxy config
- Check CORS settings

### **Camera/mic not working**
- ⚠️ **Must use HTTPS** (not HTTP)
- Check SSL certificate is valid
- Allow permissions in browser

### **502 Bad Gateway**
- Server not running: `pm2 status`
- Wrong port in proxy config
- Check server logs: `pm2 logs`

---

## 📊 Monitor Your App

Health check endpoints:
- `https://yourdomain.com/api/health` - Server status
- `https://yourdomain.com/api/stats` - Active users/rooms

---

## 🎯 Quick Checklist

- [ ] Files uploaded to server
- [ ] `npm install` completed
- [ ] Server started (PM2 or direct)
- [ ] Domain pointing to server
- [ ] SSL certificate installed (HTTPS)
- [ ] Web server configured (nginx/Apache)
- [ ] Firewall allows port 3000
- [ ] WebSocket connections working
- [ ] Tested: room join, messaging, calls

---

## 🆘 Need Help?

Common hosting providers:

- **Shared Hosting (cPanel)**: Use "Node.js App" feature
- **VPS (DigitalOcean, Linode)**: Full SSH access, install Node.js + PM2
- **Cloud (AWS, Azure)**: Use VM or container service
- **Serverless (Vercel, Netlify)**: Deploy backend separately (Render) + static frontend

---

**Your app is production-ready!** 🚀

Choose deployment method above based on your hosting type.
