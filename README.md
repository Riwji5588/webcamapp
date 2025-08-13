# 📱➡️🎥 Phone Camera to OBS WebRTC Streamer

> **Transform your phone into a professional wireless webcam for OBS Studio with real-time video transformations**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-cam.nattavipol.space-blue?style=for-the-badge)](https://cam.nattavipol.space)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-orange?style=for-the-badge)](https://webrtc.org/)

## ✨ Features

### 📱 **Mobile Interface**
- 🎯 **Auto-generated Room IDs** - No manual typing required
- 📋 **One-click OBS Link Generator** - Copy & paste ready URLs
- 🎨 **Modern Gradient UI** - Beautiful, mobile-optimized design
- 🔋 **Screen Wake Lock** - Prevents phone from sleeping during streaming
- 📊 **Real-time Settings Display** - Shows actual camera resolution & FPS

### 🎥 **Video Transformations**
- 🔄 **Live Rotation** - Rotate video in 90° increments (0°, 90°, 180°, 270°)
- 🪞 **Horizontal Flip** - Mirror effect for presentations
- ⬆️ **Vertical Flip** - Upside-down effect
- 🎯 **Real-time Application** - Transforms apply to OBS stream instantly
- ↩️ **Reset Function** - Return to original orientation

### 🎛️ **Camera Controls**
- 📹 **Multi-camera Support** - Front/back camera switching
- ⚙️ **Resolution Selection** - 720p, 1080p, 4K options
- 🎞️ **FPS Control** - 15, 30, 60 FPS settings
- 🔍 **Environment Detection** - Auto-selects back camera on mobile

### 🌐 **Multi-viewer Support**
- 👥 **Unlimited Viewers** - Multiple OBS instances can view same stream
- 🔄 **Auto-reconnection** - Robust connection with exponential backoff
- 💓 **Heartbeat Monitoring** - Keeps connections alive
- 📡 **WebSocket Signaling** - Fast, reliable peer connection setup

### 🎬 **OBS Integration**
- 🖥️ **Clean OBS Interface** - Minimal UI perfect for Browser Source
- 📐 **Responsive Design** - Auto-fits any canvas size
- 🎵 **Audio Support** - Optional audio streaming
- 🔗 **Direct URL Integration** - Just paste the generated link

## 🚀 Quick Start

### 🌍 **Use Live Demo** (Recommended)
1. **Mobile**: Visit [cam.nattavipol.space](https://cam.nattavipol.space)
2. **Tap "เริ่ม"** and allow camera access
3. **Copy the OBS Link** from the generated box
4. **In OBS**: Add Browser Source → Paste the URL
5. **Done!** Your phone camera is now live in OBS

### 💻 **Local Development**

#### Prerequisites
- Node.js 16+ ([Download](https://nodejs.org/))
- Modern web browser with WebRTC support

#### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/webcamapp.git
cd webcamapp

# Install dependencies
npm install

# Start the server
npm start
```

#### Usage
1. **Phone Setup**:
   ```
   📱 Open: http://YOUR_LOCAL_IP:3000
   🎯 Allow camera permissions
   🔗 Copy the generated OBS link
   ```

2. **OBS Setup**:
   ```
   🎬 Add Source → Browser
   📋 Paste the OBS URL
   📐 Set size (e.g., 1920×1080)
   ✅ Done!
   ```

## 🏗️ Architecture

```
📱 Phone (Sender)          🌐 Server (Signaling)         🎥 OBS (Viewer)
├─ Camera Stream           ├─ WebSocket Server            ├─ Browser Source
├─ Canvas Transformation   ├─ WebRTC Signaling            ├─ Video Display
├─ WebRTC Peer             ├─ Room Management             └─ Auto-reconnection
└─ Control Interface       └─ Heartbeat System
```

### 🔧 **Technical Stack**
- **Backend**: Node.js + Express + WebSocket (ws)
- **Frontend**: HTML5 + Canvas API + WebRTC
- **Transformation**: Canvas 2D Context + Stream Capture
- **Deployment**: PM2 + Nginx + Let's Encrypt SSL

## 📁 Project Structure

```
webcamapp/
├─ 📄 server/index.js          # WebSocket signaling server
├─ 🌐 public/
│  ├─ 📱 index.html            # Mobile sender interface
│  ├─ 👥 view.html             # Web viewer (legacy)
│  └─ 🎬 obs.html              # OBS-optimized viewer
├─ ⚙️ ecosystem.config.js      # PM2 configuration
├─ 🔧 nginx-config             # Nginx reverse proxy config
└─ 📋 package.json             # Dependencies & scripts
```

## 🎮 Usage Guide

### 📱 **Mobile Controls**
| Button | Function |
|--------|----------|
| 🎯 **เริ่ม** | Start camera & generate Room ID |
| 🛑 **หยุด** | Stop streaming |
| 📋 **Copy OBS Link** | Copy URL for OBS Browser Source |
| 🔄 **Rotate** | Rotate video 90° clockwise |
| ↔️ **Flip H** | Horizontal mirror flip |
| ↕️ **Flip V** | Vertical flip |
| ↩️ **Reset** | Return to normal orientation |

### 🎥 **OBS Setup**
1. **Add Browser Source**
2. **Paste the OBS Link** from your phone
3. **Set Canvas Size** (recommended: 1920×1080)
4. **Enable "Control Audio via OBS"** if you want audio
5. **Refresh** if connection doesn't start immediately

## 🚀 Deployment

### 🌍 **Production Deployment** (Ubuntu/Debian)

```bash
# 1. Clone & setup
git clone <your-repo> /root/webcamapp
cd /root/webcamapp
npm install

# 2. Install PM2
npm install -g pm2

# 3. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 4. Setup Nginx + SSL
sudo apt install nginx certbot python3-certbot-nginx
sudo cp nginx-config /etc/nginx/sites-available/webcamapp
sudo ln -s /etc/nginx/sites-available/webcamapp /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

### 🔧 **Environment Configuration**

Create `.env` file (optional):
```env
PORT=3000
NODE_ENV=production
WS_PORT=3000
```

## 🛠️ API Reference

### WebSocket Messages
```javascript
// Join room
{ type: 'join', roomId: 'room123', role: 'sender' }

// WebRTC signaling
{ type: 'offer', offer: {...}, targetId: 'viewer123' }
{ type: 'answer', answer: {...}, targetId: 'sender123' }
{ type: 'ice-candidate', candidate: {...}, targetId: 'peer123' }

// Heartbeat
{ type: 'ping' } // Server sends
{ type: 'pong' } // Client responds
```

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 🐛 **Bug Reports**
- Use GitHub Issues
- Include browser/device info
- Provide steps to reproduce

## 📋 Roadmap

- [ ] 🎤 **Audio-only Mode** - Voice streaming without video
- [ ] 🎨 **Custom Filters** - Blur, brightness, contrast controls
- [ ] 📹 **Recording Feature** - Save streams to file
- [ ] 🔐 **Room Passwords** - Private streaming rooms
- [ ] 📊 **Analytics Dashboard** - Connection stats & monitoring
- [ ] 🌍 **Multi-language** - Thai, English, Chinese support

## 🆘 Troubleshooting

### ❌ **Common Issues**

| Problem | Solution |
|---------|----------|
| 🚫 Camera won't start | Check HTTPS (required for camera access) |
| 🔌 OBS shows black screen | Refresh browser source or check URL |
| 📶 Connection drops | Check network stability, try refresh |
| 🎥 No video in OBS | Verify Room ID matches between phone & OBS |
| 🔊 No audio | Enable "Control Audio via OBS" in source settings |

### 🔧 **Debug Mode**
Open browser console (F12) to see detailed logs:
```javascript
// Phone logs
🎥 Camera started successfully
🔌 WebSocket connected
📡 Peer connection established

// OBS logs
👁️ Viewer connected to room: room123
📺 Video track received
🔄 Auto-reconnecting...
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WebRTC** community for excellent documentation
- **OBS Studio** for Browser Source support
- **Node.js** and **Express** teams
- **Canvas API** for video transformation capabilities

---

<div align="center">

**Made with ❤️ by [Nattavipol](https://github.com/yourusername)**

⭐ **Star this repo if it helped you!**

[🌐 Live Demo](https://cam.nattavipol.space) • [🐛 Report Bug](https://github.com/yourusername/webcamapp/issues) • [💡 Request Feature](https://github.com/yourusername/webcamapp/issues)

</div>
