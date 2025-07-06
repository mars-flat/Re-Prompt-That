const { Server } = require('socket.io');
const OpenAI = require("openai");
const http = require('http');
const Game = require('./game');
require('dotenv').config();

const PORT = 4000;

const server = http.createServer((req, res) => {
  // Handle direct HTTP requests (when someone visits localhost:4000 in browser)
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Room App Server</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              margin: 0;
            }
            .container {
              background: rgba(255,255,255,0.1);
              padding: 40px;
              border-radius: 15px;
              backdrop-filter: blur(10px);
              max-width: 600px;
              margin: 0 auto;
            }
            h1 { margin-bottom: 20px; }
            .status { 
              background: #4CAF50; 
              padding: 10px 20px; 
              border-radius: 25px; 
              display: inline-block;
              margin: 20px 0;
            }
            .info {
              background: rgba(255,255,255,0.2);
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Room App Server</h1>
            <div class="status">Server is running!</div>
            <div class="info">
              <h3>Server Status</h3>
              <p><strong>Port:</strong> ${PORT}</p>
              <p><strong>Status:</strong> Online and accepting connections</p>
              <p><strong>Socket.IO:</strong> Ready for WebSocket connections</p>
            </div>
            <div class="info">
              <h3>How to Connect</h3>
              <p>This server is designed for WebSocket connections from the client app.</p>
              <p>Use the client application to connect and create/join rooms.</p>
            </div>
          </div>
        </body>
      </html>
    `);
  } else {
    // Handle other HTTP requests
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Check if OpenAI API key is available
const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '';
const client = hasOpenAIKey ? new OpenAI() : null;

if (!hasOpenAIKey) {
  console.log('⚠️  Warning: OPENAI_API_KEY not found. AI features will be disabled.');
}

const rooms = {};
const games = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  socket.on('createRoom', ({ username }) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = new Set([username]);
    socket.join(roomCode);
    socket.data.username = username;
    socket.data.roomCode = roomCode;
    socket.emit('roomJoined', { roomCode });
    console.log(socket.rooms, roomCode, io.sockets.adapter.rooms);
    const roomSockets = io.sockets.adapter.rooms.get(roomCode);
    console.log("Socket IDs in room:", Array.from(roomSockets || []));
    
    io.to(roomCode).emit('updateUserList', "hi");
    console.log("User list updated", Array.from(rooms[roomCode]));
  });

  socket.on('joinRoom', ({ roomCode, username }) => {
    console.log(`🔄 Attempting to join room: ${roomCode} with username: ${username}`);
    
    // if game started
    if (games[roomCode] && games[roomCode].started) {
      console.log("❌ Game already started");
      socket.emit('error', { signal: "joinRoom", title: "Game already started", message: 'Please wait for the next game.' });
      return;
    }

    // if room not found
    if (!rooms[roomCode]) {
      console.log("❌ Room not found:", roomCode);
      socket.emit('error', { signal: "joinRoom", title: "Room not found", message: 'Please create a new room.' });
      return;
    }

    // if username already exists
    if (rooms[roomCode].has(username)) {
      console.log("❌ Username already exists:", username);
      socket.emit('error', { signal: "joinRoom", title: "Username already exists", message: 'Please choose a different username.' });
      return;
    }

    rooms[roomCode].add(username);
    socket.join(roomCode);
    socket.data.username = username;
    socket.data.roomCode = roomCode;
    console.log(`✅ User ${username} joined room ${roomCode}`);
    socket.emit('roomJoined', { roomCode });
    console.log(socket.rooms);
    io.to(roomCode).emit('updateUserList', Array.from(rooms[roomCode]));
    console.log("📋 User list updated for room", roomCode, ":", Array.from(rooms[roomCode]));
  });

  socket.on('disconnect', () => {
    const { username, roomCode } = socket.data || {};
    if (username && roomCode && rooms[roomCode]) {
      console.log(`🔌 User ${username} disconnected from room ${roomCode}`);
      rooms[roomCode].delete(username);
      if (rooms[roomCode].size === 0) {
        console.log(`🗑️ Room ${roomCode} is empty, deleting it`);
        delete rooms[roomCode];
      } else {
        console.log(`📋 Updating user list for room ${roomCode}:`, Array.from(rooms[roomCode]));
        io.to(roomCode).emit('updateUserList', Array.from(rooms[roomCode]));
      }
    }
  });

  socket.on('startGame', ({ roomCode }) => {
    games[roomCode] = new Game(io, roomCode, rooms[roomCode]);
    games[roomCode].startGame();
    io.to(roomCode).emit('startGame');
  });

  // when the user sends a message, evaluate it using the openai api and calculate score
  socket.on('sendMessage', async({ roomCode, message }) => {
    if (!hasOpenAIKey) {
      socket.emit('chatResponse', { 
        message: 'AI features are disabled. Please set OPENAI_API_KEY environment variable.' 
      });
      return;
    }

    try {
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
    } catch (error) {
      console.error('OpenAI API error:', error);
      socket.emit('chatResponse', { 
        message: 'Sorry, there was an error processing your message. Please try again.' 
      });
    }
  });
});

// ✅ Start server and log a message
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Socket.IO server is running on port ${PORT}`);
});
