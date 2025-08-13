# Phone Camera to OBS (Browser Source)

This minimal app lets you use your phone camera as a webcam in OBS using a WebRTC peer connection. The phone acts as the sender; OBS uses a Browser Source pointing to the viewer page.

## What you get
- Node.js server with WebSocket signaling
- `public/index.html` for the phone (sender)
- `public/view.html` for OBS (viewer)

## Run locally
1. Install Node.js 18+.
2. In a terminal:

   ```cmd
   cd c:\Users\riwau\Desktop\nattavipol_work\webcamapp
   npm install
   npm start
   ```

3. On your phone, open: `http://<your-computer-LAN-ip>:3000/` and allow camera.
   - Enter a Room ID (e.g. `room1`).
4. In OBS, add a Browser Source with URL:
   `http://<your-computer-LAN-ip>:3000/view.html?room=room1`
   - Set width/height to your canvas (e.g. 1920x1080), enable Control Audio via OBS if needed.

Tips:
- Both devices must be on the same network. For remote access, you need HTTPS and port forwarding.
- For mobile back camera, the sender page tries `facingMode: 'environment'` by default; you can also pick cameras from the dropdown.
- If connection doesn’t start, reload both pages. Some networks block UDP/STUN.

## Security note
This is a simple signaling approach without authentication. For production, add auth and consider TURN servers for NAT traversal.
