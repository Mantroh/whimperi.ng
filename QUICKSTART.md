# 🚀 Quick Start Guide

Get the WhatsApp-like chat app running in 3 minutes!

## Step 1: Install Dependencies

Open PowerShell in the project root and run:

```powershell
npm run install:all
```

This will install dependencies for both backend and frontend.

## Step 2: Start Backend Server

Open a new PowerShell terminal:

```powershell
cd backend
npm run dev
```

You should see:
```
╔═══════════════════════════════════════╗
║   🚀 Chat Server Running              ║
║   📡 Port: 3000                       ║
║   🔗 http://localhost:3000            ║
╚═══════════════════════════════════════╝
```

## Step 3: Start Frontend

Open another PowerShell terminal:

```powershell
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Step 4: Test the App

1. Open http://localhost:5173 in **two different browser windows**
2. In **Window 1**:
   - Room ID: `test123`
   - Username: `Alice`
   - Click "Join Room"
3. In **Window 2**:
   - Room ID: `test123`
   - Username: `Bob`
   - Click "Join Room"
4. Start chatting! 💬

## Step 5: Test Video Call

1. Once both users are online (green dot visible)
2. Click the 📹 button to start a video call
3. Accept the call in the other window
4. Grant camera/microphone permissions
5. Enjoy the call!

## Troubleshooting

**Backend won't start?**
- Make sure port 3000 is not in use
- Check if Node.js is installed: `node --version`

**Frontend won't start?**
- Make sure port 5173 is not in use
- Try: `cd frontend && npm install` again

**Can't connect?**
- Ensure both backend and frontend are running
- Check that URLs match (localhost:3000 and localhost:5173)

**Camera not working?**
- Grant permissions in your browser
- Try Chrome or Firefox for best compatibility

---

**For full documentation, see [README.md](README.md)**
