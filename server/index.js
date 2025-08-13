const express = require('express');
const { WebSocketServer } = require('ws');
const { createServer } = require('http');

// UUID generation fallback for older Node.js versions
function generateUUID() {
  try {
    const { randomUUID } = require('crypto');
    return randomUUID();
  } catch {
    // Fallback for older Node.js versions
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

const app = express();
app.use(express.static('public'));

const server = createServer(app);
const wss = new WebSocketServer({ 
  server,
  // เพิ่ม heartbeat เพื่อตรวจสอบ connection
  perMessageDeflate: false,
  clientTracking: true
});

// In-memory rooms: roomId -> { senders: Set<ws>, viewers: Set<ws> }
const rooms = new Map();

// Heartbeat interval - ping ทุก 30 วินาที
const HEARTBEAT_INTERVAL = 30000;
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log(`💔 Connection ${ws.id} timed out, terminating`);
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { senders: new Set(), viewers: new Set() });
  }
  return rooms.get(roomId);
}

function safeSend(ws, obj) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

wss.on('connection', (ws) => {
  ws.id = generateUUID();
  ws.role = null; // 'sender' | 'viewer'
  ws.roomId = null;
  ws.isAlive = true; // สำหรับ heartbeat

  console.log(`🔗 New connection: ${ws.id}`);

  // Heartbeat response
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }

    const { type } = data;

    if (type === 'join') {
      const { roomId, role } = data;
      ws.roomId = roomId;
      ws.role = role;
      const room = getOrCreateRoom(roomId);
      
      if (role === 'sender') {
        room.senders.add(ws);
        // Notify ALL viewers that a sender is available
        room.viewers.forEach(v => safeSend(v, { type: 'sender-available' }));
        console.log(`📹 Sender ${ws.id} joined room "${roomId}" (${room.viewers.size} viewers waiting)`);
      } else {
        room.viewers.add(ws);
        // If a sender exists, tell this new viewer to request offer
        if (room.senders.size > 0) {
          safeSend(ws, { type: 'sender-available' });
          // Tell sender that new viewer wants offer
          room.senders.forEach(s => safeSend(s, { type: 'need-offer', from: ws.id }));
        }
        console.log(`📺 Viewer ${ws.id} joined room "${roomId}" (Total viewers: ${room.viewers.size})`);
      }
      return;
    }

    // Multi-viewer WebRTC signaling with per-viewer connections
    if (type === 'offer' || type === 'answer' || type === 'candidate' || type === 'need-offer') {
      const room = rooms.get(ws.roomId);
      if (!room) return;

      if (ws.role === 'sender') {
        if (type === 'offer') {
          // Send offer to specific viewer or all viewers if no target
          const targetId = data.to;
          if (targetId) {
            // Send to specific viewer
            const targetViewer = Array.from(room.viewers).find(v => v.id === targetId);
            if (targetViewer) {
              safeSend(targetViewer, { ...data, from: ws.id });
              console.log(`📡 Sender sending offer to viewer ${targetId}`);
            }
          } else {
            // Broadcast to all viewers (for backward compatibility)
            room.viewers.forEach(v => safeSend(v, { ...data, from: ws.id }));
            console.log(`📡 Sender broadcasting offer to ${room.viewers.size} viewers`);
          }
        } else {
          // Other messages go to all viewers
          room.viewers.forEach(v => safeSend(v, { ...data, from: ws.id }));
        }
      } else if (ws.role === 'viewer') {
        // Viewer messages go to all senders with viewer ID
        room.senders.forEach(s => safeSend(s, { ...data, from: ws.id }));
        if (type === 'need-offer') {
          console.log(`📺 Viewer ${ws.id} requesting new offer`);
        }
      }
      return;
    }
  });

  ws.on('close', (code, reason) => {
    const { roomId, role } = ws;
    console.log(`🔌 Connection ${ws.id} closed (code: ${code}, reason: ${reason || 'unknown'})`);
    
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    
    if (role === 'sender') {
      room.senders.delete(ws);
      room.viewers.forEach(v => safeSend(v, { type: 'sender-gone' }));
      console.log(`📹❌ Sender ${ws.id} left room "${roomId}" (${room.viewers.size} viewers affected)`);
    } else if (role === 'viewer') {
      room.viewers.delete(ws);
      console.log(`📺❌ Viewer ${ws.id} left room "${roomId}" (${room.viewers.size} viewers remaining)`);
    }
    
    if (room.senders.size === 0 && room.viewers.size === 0) {
      rooms.delete(roomId);
      console.log(`🗑️ Room "${roomId}" deleted (empty)`);
    }
  });

  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${ws.id}:`, error.message);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Multi-viewer webcam server running on http://localhost:${PORT}`));

// Cleanup on shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, closing server...');
  clearInterval(heartbeatInterval);
  wss.close(() => {
    server.close(() => {
      console.log('🏁 Server closed gracefully');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, closing server...');
  clearInterval(heartbeatInterval);
  wss.close(() => {
    server.close(() => {
      console.log('🏁 Server closed gracefully');
      process.exit(0);
    });
  });
});
