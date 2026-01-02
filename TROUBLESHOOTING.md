# Troubleshooting Guide

Common issues and solutions for the WhatsApp-like Chat application.

## 🔧 Installation Issues

### Issue: `npm: command not found`
**Solution**: Install Node.js from https://nodejs.org/ (includes npm)

### Issue: `Permission denied` errors during installation
**Solution**: 
- Windows: Run PowerShell as Administrator
- Or use: `npm install --no-optional`

### Issue: Dependencies fail to install
**Solution**:
1. Delete `node_modules` folders
2. Delete `package-lock.json` files
3. Run `npm cache clean --force`
4. Try installation again

---

## 🚀 Server Issues

### Issue: Backend won't start
**Symptoms**: Error when running `npm run dev` in backend folder

**Solutions**:
1. **Port 3000 already in use**:
   ```powershell
   # Find process using port 3000
   netstat -ano | findstr :3000
   
   # Kill the process (replace PID)
   taskkill /PID <PID> /F
   ```

2. **Missing dependencies**:
   ```powershell
   cd backend
   npm install
   ```

3. **Check server.js for errors**:
   - Look for syntax errors
   - Check console output

### Issue: Frontend won't start
**Symptoms**: Vite fails to start

**Solutions**:
1. **Port 5173 already in use**:
   ```powershell
   # Kill process on port 5173
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```

2. **Change port** in `vite.config.js`:
   ```javascript
   server: {
     port: 5174  // Changed from 5173
   }
   ```
   Then update `SERVER_URL` in `frontend/src/hooks/useSocket.js`

### Issue: `nodemon: command not found`
**Solution**:
```powershell
cd backend
npm install
```

---

## 🔌 Connection Issues

### Issue: "Cannot connect to server" in browser console
**Solutions**:
1. **Verify backend is running**:
   - Open http://localhost:3000 in browser
   - Should see JSON response

2. **Check CORS settings** in `backend/server.js`:
   ```javascript
   cors: {
     origin: "http://localhost:5173",  // Must match frontend URL
   }
   ```

3. **Check Socket.IO URL** in `frontend/src/hooks/useSocket.js`:
   ```javascript
   const SERVER_URL = 'http://localhost:3000';  // Must match backend
   ```

### Issue: WebSocket connection keeps disconnecting
**Solutions**:
1. Check firewall settings (allow ports 3000, 5173)
2. Disable VPN temporarily
3. Try different browser
4. Check antivirus isn't blocking WebSocket

### Issue: "Room Full" error immediately
**Solution**:
- Each room only supports 2 users
- Use a different Room ID
- Wait for other user to leave
- Refresh backend to clear rooms

### Issue: "Username Taken" error
**Solution**:
- Choose a different username in the same room
- Or join a different room

---

## 💬 Chat Issues

### Issue: Messages not appearing
**Solutions**:
1. **Check if other user is online**:
   - Look for green dot (● Online)
   - If offline, wait for them to join

2. **Check browser console**:
   - Press F12 → Console tab
   - Look for errors

3. **Refresh page**:
   - Messages are in-memory only
   - Both users should refresh if issue persists

### Issue: Typing indicator not working
**Solutions**:
1. Type slower (indicator has 1s debounce)
2. Check WebSocket connection
3. Verify both users are in same room

### Issue: Read receipts (blue ticks) not showing
**Solutions**:
1. Ensure recipient has viewed the message
2. Check that both users are in the same room
3. Refresh both browsers

### Issue: Messages disappear
**Expected behavior**: 
- Messages are NOT stored
- Refresh = all messages gone
- This is intentional (in-memory only)

---

## 📞 Calling Issues

### Issue: Call button not showing
**Solutions**:
1. **Other user must be online** (● Online status)
2. Wait for other user to join room
3. Refresh page

### Issue: Cannot make calls
**Solutions**:
1. **Grant camera/microphone permissions**:
   - Browser will prompt on first call
   - Chrome: Settings → Privacy → Site Settings → Camera/Microphone
   - Allow access for localhost

2. **Check browser compatibility**:
   - ✅ Chrome 60+
   - ✅ Firefox 60+
   - ✅ Safari 11+
   - ✅ Edge 79+

3. **Disable browser extensions**:
   - Some ad blockers interfere with WebRTC
   - Try incognito/private mode

### Issue: "Connecting..." never ends
**Solutions**:
1. **Check STUN servers** in `frontend/src/components/VideoCall.jsx`:
   ```javascript
   const ICE_SERVERS = {
     iceServers: [
       { urls: 'stun:stun.l.google.com:19302' },
     ]
   };
   ```

2. **Firewall blocking UDP**:
   - WebRTC uses UDP ports
   - Check firewall settings
   - Try different network

3. **Both users on same restrictive network**:
   - May need TURN server (relay)
   - Try different networks

### Issue: No audio/video during call
**Solutions**:
1. **Check device permissions**:
   - Browser address bar → Camera icon
   - Allow camera/microphone

2. **Check if device is in use**:
   - Close other apps using camera/microphone
   - Close other browser tabs with video calls

3. **Try different browser**:
   - Chrome has best WebRTC support

4. **Check system settings**:
   - Windows: Settings → Privacy → Camera/Microphone
   - Ensure browser has permissions

### Issue: Can hear audio but no video
**Solutions**:
1. Check if call was started as audio-only (📞 button)
2. Click video toggle during call
3. Restart call as video call (📹 button)

### Issue: Video is black screen
**Solutions**:
1. Camera in use by another app
2. Camera driver issues (restart computer)
3. Wrong camera selected (check browser settings)

---

## 🌐 Browser-Specific Issues

### Chrome
- **Issue**: Camera permission not persisting
- **Solution**: Clear site data, allow again

### Firefox
- **Issue**: Audio crackling
- **Solution**: Disable hardware acceleration

### Safari
- **Issue**: WebSocket not connecting
- **Solution**: Update to Safari 11+

### Edge
- **Issue**: Video call freezes
- **Solution**: Update to Edge 79+ (Chromium-based)

---

## 🐛 Development Issues

### Issue: Hot reload not working
**Solution**:
```powershell
# Kill and restart frontend
cd frontend
npm run dev
```

### Issue: Changes not reflecting
**Solutions**:
1. Hard refresh: `Ctrl + Shift + R`
2. Clear cache: `Ctrl + Shift + Delete`
3. Restart dev server

### Issue: Vite fails to optimize dependencies
**Solution**:
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force node_modules/.vite
npm install
```

---

## 📊 Performance Issues

### Issue: High CPU usage
**Solutions**:
- Close unused browser tabs
- Disable dev tools
- Use production build

### Issue: Memory leak over time
**Solution**:
- Restart browser/server periodically
- This is a demo app with basic memory management

---

## 🔒 Security Warnings

### Issue: Browser security warning
**Expected**:
- Using `http://localhost` (not `https://`)
- Normal for local development
- Production should use HTTPS

### Issue: "Insecure WebSocket" warning
**Expected**:
- Using `ws://` instead of `wss://`
- Normal for local development
- Production should use `wss://` (secure WebSocket)

---

## 📱 Mobile Testing Issues

### Issue: Cannot test on mobile
**Solution**:
1. Get your computer's local IP:
   ```powershell
   ipconfig
   ```
   Look for IPv4 Address (e.g., 192.168.1.100)

2. Update `frontend/src/hooks/useSocket.js`:
   ```javascript
   const SERVER_URL = 'http://192.168.1.100:3000';
   ```

3. Access from phone:
   - Open `http://192.168.1.100:5173` in mobile browser

4. Ensure both devices on same Wi-Fi network

---

## 🧪 Testing Issues

### Issue: How to test alone?
**Solution**:
1. Open two browser windows side-by-side
2. Use same Room ID, different usernames
3. Or use two different browsers (Chrome + Firefox)
4. Or use normal + incognito mode

### Issue: Testing on different computers
**Solution**:
1. Find server computer's IP: `ipconfig`
2. Update `SERVER_URL` in frontend to use IP
3. Both computers must be on same network
4. Firewall must allow ports 3000 and 5173

---

## 📝 Logging and Debugging

### Enable detailed logging

**Backend** (`server.js`):
```javascript
// Add at top
const DEBUG = true;

// Use throughout
if (DEBUG) console.log('Debug info:', data);
```

**Frontend** (Browser Console):
```javascript
// Press F12 → Console
// Check for WebSocket events
// Look for errors (red text)
```

### Useful browser console commands
```javascript
// See all active Socket.IO events
socket._callbacks

// Check WebSocket connection status
socket.connected  // should be true

// See WebRTC connection state
peerConnectionRef.current.connectionState
```

---

## 🆘 Still Having Issues?

1. **Check the basics**:
   - Node.js installed? `node --version`
   - Dependencies installed? (node_modules folders exist)
   - Both servers running? (backend + frontend)
   - Correct URLs? (localhost:3000 and localhost:5173)

2. **Read console output**:
   - Backend terminal (server errors)
   - Browser console (client errors)

3. **Start fresh**:
   ```powershell
   # Kill all processes
   # Delete node_modules everywhere
   # Reinstall everything
   npm run install:all
   ```

4. **Check version compatibility**:
   - Node.js 16+
   - Modern browser (Chrome, Firefox, Edge, Safari)

5. **Review documentation**:
   - [README.md](README.md) - Full documentation
   - [QUICKSTART.md](QUICKSTART.md) - Setup guide
   - [EVENTS.md](EVENTS.md) - Event reference

---

## 💡 Tips for Smooth Operation

1. **Always start backend first**, then frontend
2. **Use Chrome** for best compatibility
3. **Allow camera/mic permissions** immediately
4. **Both users should be online** before calling
5. **Refresh page** if things get stuck
6. **Check firewall** if connection issues
7. **Use same network** for best results
8. **Keep servers running** - don't close terminals

---

**Remember**: This is a demo app with no persistence. Refresh = restart! 🔄
