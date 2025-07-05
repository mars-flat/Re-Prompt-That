const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000' } // React runs on 3000
});

app.use(cors());
app.use(express.json());

const PORT = 4000;

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const activeRooms = new Set();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', (cb) => {
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (activeRooms.has(roomCode));
    activeRooms.add(roomCode);
    socket.join(roomCode);
    cb({ roomCode });
  });

  socket.on('joinRoom', (roomCode, cb) => {
    const rooms = io.sockets.adapter.rooms;
    if (rooms.has(roomCode)) {
      socket.join(roomCode);
      io.to(roomCode).emit('userJoined', roomCode);
      cb({ success: true });
    } else {
      cb({ success: false, error: 'Room not found' });
    }
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id && io.sockets.adapter.rooms.get(room)?.size === 1) {
        activeRooms.delete(room); // Clean up
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
