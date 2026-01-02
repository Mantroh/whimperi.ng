# Deploy to Render.com

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

This will deploy both frontend and backend as a single service.

## Manual Deployment Steps

### Option 1: Deploy to Render (Recommended)

1. **Push code to GitHub** (if not already)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create Render account**: https://render.com

3. **Create New Web Service**:
   - Connect your GitHub repository
   - Build Command: `cd frontend && npm install && npm run build && cd ../backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment: Node
   - Plan: Free

4. **Environment Variables** (Optional):
   - `PORT` = 10000 (default)
   - `NODE_ENV` = production

5. **Deploy!** - Render will build and deploy automatically

---

### Option 2: Deploy to Railway

1. **Create Railway account**: https://railway.app

2. **New Project from GitHub**:
   - Connect repository
   - Railway auto-detects Node.js

3. **Configure**:
   - Root Directory: `/backend`
   - Build Command: `cd ../frontend && npm install && npm run build && cd ../backend && npm install`
   - Start Command: `npm start`

4. **Deploy!**

---

### Option 3: Deploy to Heroku

1. **Install Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli

2. **Create app**:
   ```bash
   heroku create your-app-name
   ```

3. **Create Procfile** (already included):
   ```
   web: cd backend && npm start
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

---

### Option 4: Deploy to Vercel (Frontend) + Render (Backend)

**Frontend (Vercel)**:
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `cd frontend && vercel --prod`

**Backend (Render)**:
1. Follow Render steps above
2. Update `FRONTEND_URL` env variable with Vercel URL

---

### Option 5: Self-Hosted (VPS/Cloud)

**Requirements**:
- Node.js 16+
- PM2 (process manager)

**Steps**:
1. **Upload code to server**:
   ```bash
   scp -r whimperi.ng user@your-server:/var/www/
   ```

2. **Install dependencies**:
   ```bash
   cd /var/www/whimperi.ng
   cd frontend && npm install && npm run build
   cd ../backend && npm install
   ```

3. **Install PM2**:
   ```bash
   npm install -g pm2
   ```

4. **Start with PM2**:
   ```bash
   cd backend
   pm2 start server.production.js --name whimpering-chat
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx** (optional, for custom domain):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

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

---

## Environment Variables

For production deployment, set these environment variables:

```bash
PORT=3000                    # Server port
NODE_ENV=production          # Environment
FRONTEND_URL=*              # Allow all origins (or specify your domain)
```

---

## Testing Production Build Locally

```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start

# Open http://localhost:3000
```

---

## Post-Deployment

1. **Test all features**:
   - Join room
   - Send messages
   - Make video/audio calls

2. **Update Socket.IO connection** (already configured to auto-detect)

3. **Monitor logs** on your platform

4. **Share your URL!** 🎉

---

## Troubleshooting

### WebSocket not connecting
- Ensure your hosting platform supports WebSocket
- Render/Railway/Heroku all support it by default

### Camera/Mic not working
- **HTTPS required** for WebRTC on production domains
- Localhost works with HTTP
- Most platforms provide free SSL

### CORS errors
- Update `FRONTEND_URL` in backend
- Or set to `*` to allow all origins

---

## Cost

- **Render Free Tier**: $0/month (with limitations)
- **Railway Free Tier**: $5 credit/month
- **Heroku**: Eco dyno ~$5/month
- **VPS**: $5-10/month

---

**Choose your platform and deploy! 🚀**
