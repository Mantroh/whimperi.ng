# 🔍 Quick Hostinger Troubleshooting

## ✅ Files Verified - Everything is in the zip!

Your `enterprise-portal-hostinger.zip` contains:
- ✅ `server.production.js` (main server)
- ✅ `dist/` folder with frontend files
- ✅ `webrtc-signaling.js`
- ✅ `package.json` with correct start script
- ✅ All dependencies

---

## 🎯 Hostinger Deployment Settings

### **In the Hostinger deployment interface, use these EXACT settings:**

```
Framework preset: Express
Node version: 22.x
Root directory: /
Entry file: server.production.js
Package manager: npm
```

**IMPORTANT**: After uploading, wait for:
1. "Extracting files..." 
2. "Installing dependencies..." (this takes 2-3 minutes!)
3. "Starting application..."
4. Status shows: "Running" ✅

---

## 🚨 If Still Getting 403 Forbidden:

### **Option 1: Check Deployment Logs**

In Hostinger dashboard:
- Click on your deployment
- Look for "Logs" or "Console" tab
- Check for errors like:
  - "Cannot find module"
  - "Port already in use"
  - "Permission denied"

### **Option 2: Manual Start via SSH**

1. **SSH into your server**:
   ```bash
   ssh u123456789@whimperi.ng
   ```

2. **Navigate to your app**:
   ```bash
   cd public_html
   # or
   cd domains/whimperi.ng/public_html
   ```

3. **Check if files are there**:
   ```bash
   ls -la
   ```
   Should see: `server.production.js`, `dist/`, `package.json`, etc.

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Start manually**:
   ```bash
   node server.production.js
   ```

6. **If you see this, it's working**:
   ```
   🚀 Chat Server Running
   📡 Port: 3000
   🌍 Environment: PRODUCTION
   ```

### **Option 3: Check .htaccess**

Make sure `.htaccess` in your domain root has:

```apache
RewriteEngine On

# Proxy to Node.js app
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]

# WebSocket support
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^/?(.*) "ws://127.0.0.1:3000/$1" [P,L]

# Enable proxy
ProxyPreserveHost On
ProxyPass / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/
```

---

## 🔧 Alternative: Try Port 8080

Hostinger sometimes requires specific ports. Edit `server.production.js`:

Change line 11 from:
```javascript
const PORT = process.env.PORT || 3000;
```

To:
```javascript
const PORT = process.env.PORT || 8080;
```

Then update `.htaccess` to use port 8080 instead of 3000.

---

## 📞 Hostinger-Specific Issues

### **Check Your Hosting Plan**

403 Forbidden can happen if:
- Your plan doesn't support Node.js (need Business or Cloud plan)
- Node.js feature not enabled in hPanel

**To verify**: 
- Go to hPanel → Advanced → Node.js
- If you don't see "Node.js" option, contact Hostinger support to enable it

### **Alternative Deployment Method**

If the automatic deployment interface isn't working:

1. **Use File Manager** to upload files manually
2. **Go to**: hPanel → Advanced → Node.js
3. **Create Application** manually:
   - Application root: `public_html`
   - Startup file: `server.production.js`
   - Mode: Production
4. **Install & Start** using the Node.js manager interface

---

## 🎯 Test Locally First

Before deploying again, test the new zip locally:

```bash
# Extract the zip to a test folder
cd e:\test
Expand-Archive e:\whimperi.ng\enterprise-portal-hostinger.zip -DestinationPath .

# Install and run
npm install
node server.production.js

# Visit http://localhost:3000
# Should see Enterprise Portal login!
```

If it works locally, the zip is good and it's a Hostinger configuration issue.

---

## 📧 What to Tell Hostinger Support

If nothing works, contact Hostinger support with:

```
Subject: 403 Forbidden - Node.js App Not Starting

I'm trying to deploy a Node.js Express application to whimperi.ng.

Setup:
- Node.js: 22.x
- Framework: Express
- Entry file: server.production.js
- Port: 3000

Issue: Getting 403 Forbidden when visiting the domain.

Files are uploaded correctly (verified in File Manager).
npm install completes successfully.

Can you help me:
1. Verify Node.js is enabled for my plan
2. Check if there are any firewall/proxy issues
3. Review deployment logs for errors
```

---

## ✅ Next Step

**Try this first**: 
1. Check the deployment LOGS in Hostinger
2. Look for any error messages during npm install or app start
3. Share the error messages so I can help debug!

The zip file is correct - it's likely a Hostinger configuration or port issue.
