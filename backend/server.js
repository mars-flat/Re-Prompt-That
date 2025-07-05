const { Server } = require('socket.io');
const OpenAI = require("openai");
const http = require('http');
require('dotenv').config();


const PORT = 4000;

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
const client = new OpenAI();

const rooms = {};

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

io.on('connection', (socket) => {
  socket.on('createRoom', ({ username }) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = new Set([username]);
    socket.join(roomCode);
    socket.data.username = username;
    socket.data.roomCode = roomCode;
    socket.emit('roomJoined', { roomCode });
    io.to(roomCode).emit('updateUserList', Array.from(rooms[roomCode]));
  });

  socket.on('joinRoom', ({ roomCode, username }) => {
    if (!rooms[roomCode]) {
      socket.emit('error', 'Room not found');
      return;
    }
    rooms[roomCode].add(username);
    socket.join(roomCode);
    socket.data.username = username;
    socket.data.roomCode = roomCode;
    socket.emit('roomJoined', { roomCode });
    io.to(roomCode).emit('updateUserList', Array.from(rooms[roomCode]));
  });

  socket.on('disconnect', () => {
    const { username, roomCode } = socket.data || {};
    if (username && roomCode && rooms[roomCode]) {
      rooms[roomCode].delete(username);
      if (rooms[roomCode].size === 0) {
        delete rooms[roomCode];
      } else {
        io.to(roomCode).emit('updateUserList', Array.from(rooms[roomCode]));
      }
    }
  });

  // when the user sends a message, evaluate it using the openai api and calculate score
  socket.on('sendMessage', async({ roomCode, message }) => {
    const response = await client.responses.create({
        model: "gpt-4o-mini",
        input: [
            {
                role: "user",
                content: message
            }
        ]
    });
    // do something to calculate the score
    io.to(roomCode).emit('updateScore', { score: 10 });
    socket.emit('chatResponse', { message: response.output_text });
  });
});

// ✅ Start server and log a message
server.listen(PORT, () => {
  console.log(`✅ Socket.IO server is running on http://localhost:${PORT}`);
});
