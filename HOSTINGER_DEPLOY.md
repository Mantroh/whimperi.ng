# 🚀 Deploy to Hostinger - Step by Step

## ✅ What You Need

- Hostinger Business or Cloud plan (Node.js support)
- Domain: **whimperi.ng** (already set up!)
- Files ready in `backend/` folder

---

## 📦 Step 1: Prepare Files for Upload

Your files are ready! Upload the entire **`backend`** folder.

**What's included:**
```
backend/
├── server.production.js
├── webrtc-signaling.js
├── package.json
├── package-lock.json
└── (frontend dist files are served by server)
```

---

## 🌐 Step 2: Upload to Hostinger

### **Option A: File Manager (Easy)**

1. Go to **hPanel** → **File Manager**
2. Navigate to: `public_html/whimperi.ng/` (or your domain folder)
3. Upload ALL files from `backend/` folder
4. Extract if uploaded as zip

### **Option B: FTP (Faster for multiple files)**

1. **Get FTP credentials** from hPanel → **FTP Accounts**
2. Use FileZilla or WinSCP
3. Connect and upload `backend/` folder contents
4. Upload to: `/public_html/whimperi.ng/` or `/domains/whimperi.ng/public_html/`

---

## ⚙️ Step 3: Set Up Node.js App in hPanel

1. **Go to**: hPanel → **Advanced** → **Node.js**
2. **Click**: "Create Application"
3. **Fill in**:
   ```
   Application Mode: Production
   Node.js Version: 18.x or latest
   Application Root: public_html/whimperi.ng (or your path)
   Application URL: whimperi.ng (your domain)
   Application Startup File: server.production.js
   ```
4. **Click**: "Create"

---

## 📥 Step 4: Install Dependencies

After creating Node.js app:

1. In Node.js section, click **"Open Terminal"** or use SSH
2. Navigate to your app folder:
   ```bash
   cd domains/whimperi.ng/public_html
   # or
   cd public_html/whimperi.ng
   ```
3. Install packages:
   ```bash
   npm install
   ```

---

## 🔥 Step 5: Start Application

### **In hPanel Node.js Manager:**

1. Find your application
2. Click **"Start Application"**
3. Wait for status: **Running** ✅

### **Or via SSH Terminal:**

```bash
# Install PM2 globally (if not installed)
npm install -g pm2

# Start app
pm2 start server.production.js --name "enterprise-portal"

# Make it auto-start on reboot
pm2 startup
pm2 save

# Check status
pm2 status
```

---

## 🌍 Step 6: Configure Domain

### **If using main domain (whimperi.ng):**

1. **hPanel** → **Domains** → **whimperi.ng**
2. **Document Root**: Set to your app folder
3. **Save**

### **If using subdomain (app.whimperi.ng):**

1. Create subdomain in hPanel
2. Point to app folder
3. Set up in Node.js manager

---

## 🔒 Step 7: Enable SSL (Required for WebRTC!)

1. **hPanel** → **SSL**
2. Find **whimperi.ng**
3. Click **"Install SSL"** (Free Let's Encrypt)
4. Wait 5-10 minutes for activation

**⚠️ IMPORTANT**: WebRTC (video/audio calls) requires HTTPS!

---

## 🔧 Step 8: Configure Reverse Proxy

Hostinger usually auto-configures, but if needed:

1. **hPanel** → **Advanced** → **.htaccess Editor**
2. Add this to your `.htaccess`:

```apache
# Node.js Proxy
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# WebSocket Support
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]
```

---

## ✅ Step 9: Test Your App

1. **Visit**: `https://whimperi.ng`
2. **Should see**: Enterprise Portal (looks like business portal, not chat!)
3. **Create room**: Enter username and room code
4. **Test**: Send messages, try audio/video calls

---

## 🔍 Troubleshooting

### **App not starting?**

Check in hPanel Node.js section:
- Status shows "Running"
- Check logs for errors
- Verify startup file is correct: `server.production.js`

### **502 Bad Gateway?**

```bash
# SSH into server
ssh u123456789@yourdomain.com

# Check if app is running
pm2 status
# or
ps aux | grep node

# Restart
pm2 restart enterprise-portal
```

### **Port already in use?**

In Hostinger, Node.js apps auto-assign ports. Use environment variable:

Edit `server.production.js` to ensure:
```javascript
const PORT = process.env.PORT || 3000;
```

### **Dependencies not installing?**

```bash
# Clear npm cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### **WebSocket not connecting?**

- Check firewall settings in hPanel
- Verify .htaccess has WebSocket rules
- Check browser console for errors

---

## 📊 Monitor Your App

### **In hPanel:**
- Node.js section shows app status
- Resource usage
- Logs

### **Health Check Endpoints:**
- `https://whimperi.ng/api/health` - Server status
- `https://whimperi.ng/api/stats` - Active users/rooms

### **PM2 Monitoring:**
```bash
pm2 status
pm2 logs enterprise-portal
pm2 monit
```

---

## 🎯 Quick Checklist

- [ ] Hostinger plan supports Node.js (Business/Cloud)
- [ ] Files uploaded to correct domain folder
- [ ] Node.js app created in hPanel
- [ ] Dependencies installed (`npm install`)
- [ ] App started and running
- [ ] SSL certificate installed (HTTPS)
- [ ] Domain points to app folder
- [ ] Tested: room creation, messaging, calls

---

## 📞 Common Hostinger Paths

```
Main domain: /public_html/
Subdomain: /public_html/subdomain/
Addon domain: /domains/yourdomain.com/public_html/
```

Your domain **whimperi.ng** is likely at:
- `/domains/whimperi.ng/public_html/` or
- `/public_html/` (if main domain)

---

## 🆘 Need Help?

**Hostinger Support:**
- Live chat in hPanel (24/7)
- Knowledge base: https://support.hostinger.com

**Node.js Guides:**
- Search: "Hostinger Node.js app" in their knowledge base

---

## 🚀 You're Ready!

Your "Enterprise Portal" will look like a boring business site - nobody will suspect it's a chat app! 😉

**Next**: Just upload files and follow steps above!
