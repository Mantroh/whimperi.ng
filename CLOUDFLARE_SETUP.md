# Cloudflare Setup Guide for whimperi.ng

Your server IP: **119.252.201.210**

## Step 1: Configure DNS Records in Cloudflare

1. **Go to Cloudflare Dashboard** → Select your domain `whimperi.ng` → **DNS** → **Records**

2. **Add/Update these records:**

### Root Domain Record
```
Type: A
Name: @ (or whimperi.ng)
IPv4 address: 119.252.201.210
Proxy status: ✅ Proxied (Orange Cloud) - RECOMMENDED
TTL: Auto
```

### WWW Subdomain Record
```
Type: A
Name: www
IPv4 address: 119.252.201.210
Proxy status: ✅ Proxied (Orange Cloud)
TTL: Auto
```

### Why Use Proxied (Orange Cloud)?
- ✅ Free SSL/TLS encryption
- ✅ DDoS protection
- ✅ CDN and caching
- ✅ Hides your real server IP
- ✅ WebSocket support included
- ✅ No need for Let's Encrypt on server

## Step 2: Configure SSL/TLS Settings

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to: **Flexible** (easiest) or **Full** (more secure)

### SSL Mode Options:

**Flexible (Easiest - Start with this):**
- Cloudflare → Server: HTTP only
- User → Cloudflare: HTTPS
- No SSL certificate needed on your server

**Full (More Secure):**
- Requires SSL on your server
- Can use self-signed certificate

**Full (Strict) (Most Secure):**
- Requires valid SSL certificate on server
- Use Cloudflare Origin Certificate or Let's Encrypt

## Step 3: Current Server Setup

Since your app is already running on PM2, just configure Nginx:

### Use HTTP-only config (for Flexible SSL mode):

```bash
# Remove existing config if any
sudo rm /etc/nginx/sites-enabled/whimperi.ng 2>/dev/null

# Copy the temporary HTTP config
sudo cp ~/whimperi.ng/nginx-temp.conf /etc/nginx/sites-available/whimperi.ng

# Enable site
sudo ln -s /etc/nginx/sites-available/whimperi.ng /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 4: Configure Cloudflare for WebSocket

WebSocket support is automatic with proxied mode, but verify these settings:

1. Go to **Network** tab in Cloudflare
2. Ensure **WebSockets** is **ON** (it should be by default)

## Step 5: Optional - Page Rules for Better Performance

Go to **Rules** → **Page Rules** (if available):

```
URL: whimperi.ng/*
Settings:
- SSL: Full
- Cache Level: Standard
- Browser Cache TTL: Respect Existing Headers
```

## Step 6: Test Your Setup

After DNS propagates (usually 2-5 minutes):

```bash
# Check DNS resolution
dig whimperi.ng

# Should show Cloudflare IP, not your server IP (119.252.201.210)
```

Then visit:
- https://whimperi.ng ✅
- https://www.whimperi.ng ✅

## Step 7: Verify Everything Works

### Check PM2:
```bash
pm2 status
pm2 logs whimpering-chat
```

### Check Nginx:
```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log
```

### Check if your app is accessible:
```bash
# From your server
curl http://localhost:3000

# Should return your app's HTML
```

## Troubleshooting

### Issue: Can't connect to site
**Solution:**
1. Check DNS propagation: https://dnschecker.org (search for whimperi.ng)
2. Verify Cloudflare proxy is enabled (orange cloud)
3. Check Nginx is running: `sudo systemctl status nginx`
4. Check PM2 is running: `pm2 status`

### Issue: WebSocket connection failed
**Solution:**
1. Verify WebSockets enabled in Cloudflare Network settings
2. Check browser console for errors
3. Verify Socket.IO location in nginx config
4. Check logs: `pm2 logs whimpering-chat`

### Issue: 502 Bad Gateway
**Solution:**
```bash
# Check if Node.js is running
pm2 status

# Restart if needed
pm2 restart whimpering-chat

# Check Nginx can reach port 3000
curl http://localhost:3000
```

### Issue: Mixed content warnings
**Solution:**
- Ensure frontend config uses HTTPS
- Set SSL mode to "Full" in Cloudflare

## Windows Firewall Configuration (Important!)

Since you're using WSL, ensure Windows Firewall allows traffic:

### In PowerShell (Run as Administrator on Windows):
```powershell
# Allow port 80
New-NetFirewallRule -DisplayName "WSL Nginx HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# Allow port 443 (if using SSL on server)
New-NetFirewallRule -DisplayName "WSL Nginx HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow

# Allow port 3000 (Node.js app)
New-NetFirewallRule -DisplayName "WSL Node App" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

## Router/NAT Configuration (If Behind Router)

If your server is behind a router, forward these ports:

```
External Port 80 → Internal IP [WSL Host] Port 80
External Port 443 → Internal IP [WSL Host] Port 443
```

Most home routers: Look for "Port Forwarding" or "NAT" settings.

## Security Recommendations

With Cloudflare proxy enabled:
1. Your real IP (119.252.201.210) is hidden ✅
2. DDoS protection is active ✅
3. SSL is handled by Cloudflare ✅

Additional security in Cloudflare:
- Enable "Under Attack Mode" if needed (Security → Settings)
- Set up rate limiting (Security → WAF)
- Enable Bot Fight Mode (Security → Bots)

## Next Steps

1. ✅ Add DNS records in Cloudflare
2. ✅ Set SSL mode to Flexible
3. ✅ Configure Nginx with HTTP-only config
4. ✅ Configure Windows Firewall
5. ✅ Test https://whimperi.ng

Your app should be live in 5-10 minutes! 🚀
