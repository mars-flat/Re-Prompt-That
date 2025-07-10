const { Server } = require('socket.io');
const OpenAI = require("openai");
const { logMessage, logError } = require('./tools/loggingTools.js');
const { State } = require('./state.js');
const Game = require('./game');
const { initializePipeline } = require('./tools/getVectorSimilarity');
const { createHttpServer } = require('./httpHandler');
const { queryGPT } = require('./tools/gptQuery.js');
require('dotenv').config();

const PORT = 4000;

const server = createHttpServer(PORT);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Check if OpenAI API key is available
const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '';
const client = hasOpenAIKey ? new OpenAI() : null;

if (!hasOpenAIKey) {
  logMessage(State.INITIALIZING, '⚠️  Warning: OPENAI_API_KEY not found. AI features will be disabled.');
}

const rooms = {}; // roomCode -> Set of usernames
const games = {}; // roomCode -> Game instance

// Initialize the pipeline during server startup
let pipelineInitialized = false;

async function initializeServer() {
  try {
    logMessage(State.INITIALIZING, 'Initializing server...');
    await initializePipeline();
    pipelineInitialized = true;
    logMessage(State.INITIALIZING, 'Pipeline initialized successfully');
  } catch (error) {
    logError(State.INITIALIZING, 'Failed to initialize pipeline. Server will continue without vector similarity:', error);
  }
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {

  /**
   * Event: CREATE_ROOM
   * Payload: { username: string }
   * 
   * Called when the client creates a room
   */
  socket.on(State.CREATE_ROOM, ({ username }) => {

    let roomCode = generateRoomCode();
    while(rooms[roomCode]){
        roomCode = generateRoomCode();
    }
    rooms[roomCode] = new Set([username]);

    socket.join(roomCode);
    socket.data.username = username;
    socket.data.roomCode = roomCode;
    socket.emit('roomJoined', { roomCode });

    logMessage(State.CREATE_ROOM, socket.rooms, roomCode, io.sockets.adapter.rooms);
    const roomSockets = io.sockets.adapter.rooms.get(roomCode);
    logMessage(State.CREATE_ROOM, "Socket IDs in room:", Array.from(roomSockets || []));

  });

  /**
   * Event: GET_USER_LIST
   * Payload: { roomCode: string }
   * 
   * Called when the client wants to get the user list for a room
   */
  socket.on(State.GET_USER_LIST, ({ roomCode }) => {

    io.to(roomCode).emit('updateUserList', Array.from(rooms[roomCode]));
    logMessage(State.GET_USER_LIST, "Current user list:", Array.from(rooms[roomCode]));
    socket.emit('getUsername', socket.data.username);

  })

  /**
   * Event: JOIN_ROOM
   * Payload: { roomCode: string, username: string }
   * 
   * Called when the client wants to join a room
   *  - Updates the user list for the room
   *  - Sends the update to everyone in the room
   */
  socket.on(State.JOIN_ROOM, ({ roomCode, username }) => {

    logMessage(State.JOIN_ROOM, `Attempting to join room: ${roomCode} with username: ${username}`);
    
    // if game started
    if (games[roomCode] && games[roomCode].started) {
      logMessage(State.JOIN_ROOM, "Game already started");
      socket.emit('error', { signal: "joinRoom", title: "Game already started", message: 'Please wait for the next game.' });
      return;
    }

    // if room not found
    if (!rooms[roomCode]) {
      logMessage(State.JOIN_ROOM, "Room not found:", roomCode);
      socket.emit('error', { signal: "joinRoom", title: "Room not found", message: 'Please create a new room.' });
      return;
    }

    // if username already exists
    if (rooms[roomCode].has(username)) {
      logMessage(State.JOIN_ROOM, "Username already exists:", username);
      socket.emit('error', { signal: "joinRoom", title: "Username already exists", message: 'Please choose a different username.' });
      return;
    }

    rooms[roomCode].add(username);
    socket.join(roomCode);
    socket.data.username = username;
    socket.data.roomCode = roomCode;
    logMessage(State.JOIN_ROOM, `User ${username} joined room ${roomCode}`);
    socket.emit('roomJoined', { roomCode });
    logMessage(State.JOIN_ROOM, socket.rooms);

  });

  // leave from lobby before having played
  socket.on('disconnectLobby', () => {
    const { username, roomCode } = socket.data || {};
    if (username && roomCode && rooms[roomCode]) {
      console.log(`User ${username} disconnected from room ${roomCode}`);
      rooms[roomCode].delete(username);
      if (rooms[roomCode].size === 0) {
        console.log(`Room ${roomCode} is empty, deleting it`);
        delete rooms[roomCode];
      } else {
        console.log(`Updating user list for room ${roomCode}:`, Array.from(rooms[roomCode]));
        io.to(roomCode).emit('updateUserList', Array.from(rooms[roomCode]));
      }

      if (games[roomCode]) {
        console.log(`User ${username} left game in room ${roomCode}`);
        games[roomCode].leaveGame(username);
        io.to(roomCode).emit('playerLeft', username);
      }
      socket.leave(roomCode);
    }
  });

  socket.on('startGame', ({ roomCode }) => {
    games[roomCode] = new Game(io, roomCode, rooms[roomCode]);
    io.to(roomCode).emit('goToStartGame');
  });

  socket.on('playerReady', ({ roomCode, username }) => {
    /*
    if (!rooms[roomCode] || rooms[roomCode].size === 0) {
      socket.emit('error', { 
        signal: "playerR", 
        title: "Cannot start game", 
        message: 'No players in room.' 
      });
      return;
    }
    */
   console.log(games, games[roomCode], "roomCode", roomCode, "username", username)
    games[roomCode].updateReadyCheck(username);
    if(games[roomCode].isLobbyReady()){
        games[roomCode].startGame();
    }
  });

  socket.on('getGameResults', ({ roomCode }) => {
    socket.emit('gameResults', {results: games[roomCode].getPlayersByScoreDescending()});
  });

  // leave from lobby during results page
  // note: will cause number of lobbies to increase if everyone leaves
  socket.on('leaveLobby', ({ roomCode, username }) => {
    rooms[roomCode].delete(username);
    io.to(roomCode).emit('updateUserList', Array.from(rooms[roomCode]));
    socket.leave(roomCode);
    console.log(`Socket left room ${roomCode}`);
    console.log(socket.rooms, roomCode, io.sockets.adapter.rooms);
  })

  // Game-specific prompt submission with automatic scoring
  socket.on('submitPrompt', async({ roomCode, username, prompt }) => {
    console.log("Submitting prompt:", roomCode, username, prompt);
    if (!games[roomCode] || !games[roomCode].isGameActive()) {
      socket.emit('error', { 
        signal: "submitPrompt", 
        title: "Game not active", 
        message: 'No active game in this room.' 
      });
      return;
    }

    if (!hasOpenAIKey) {
      socket.emit('error', { 
        signal: "submitPrompt", 
        title: "AI Disabled", 
        message: 'AI features are disabled. Please set OPENAI_API_KEY environment variable.' 
      });
      return;
    }

    try {
      // First, send the user's prompt to GPT to get an AI response
      games[roomCode].updateQueriesActive(1);
      const aiResponse = await queryGPT(prompt, client);
      
      // Then calculate score by comparing AI response with the current question
      const result = await games[roomCode].handlePromptSubmission(username, aiResponse, prompt);
      
      if (result.error) {
        socket.emit('error', { 
          signal: "submitPrompt", 
          title: "Submission Error", 
          message: result.error 
        });
      } else {
        socket.emit('promptScored', { 
          username: username,
          score: result.score,
          leaderboard: result.leaderboard,
          aiResponse: aiResponse,
          userPrompt: prompt
        });

        socket.to(roomCode).emit('scoreUpdate', {
          username: username,
          leaderboard: result.leaderboard,
          score: result.score
        });
      }
      games[roomCode].updateQueriesActive(-1);
      if(!games[roomCode].isGameActive() && games[roomCode].isQueryingDone()){
        io.to(roomCode).emit('goToResultsPage');
      }
    } catch (error) {
      games[roomCode].updateQueriesActive(-1);
      console.error('Error handling prompt submission:', error);
      socket.emit('error', { 
        signal: "submitPrompt", 
        title: "Server Error", 
        message: 'Failed to process your prompt. Please try again.' 
      });
    }
  });
});

//   // when the user sends a message, evaluate it using the openai api and calculate score
//   socket.on('sendMessage', async({ roomCode, username, message }) => {
//     if (!hasOpenAIKey) {
//       socket.emit('chatResponse', { 
//         message: 'AI features are disabled. Please set OPENAI_API_KEY environment variable.' 
//       });
//       return;
//     }

//     try {
//       const response = await queryGPT(message, client);
//       // do something to calculate the score
//       io.to(roomCode).emit('updateScore', { score: 10 });
//       socket.emit('chatResponse', { message: response });
//     } catch (error) {
//       console.error('OpenAI API error:', error);
//       socket.emit('chatResponse', { 
//         message: 'Sorry, there was an error processing your message. Please try again.' 
//       });
//     }
//   });

//   // Calculate similarity score between two strings
//   socket.on('calculateScore', async({ string1, string2 }) => {
//     try {
//       const similarity = await getScore(string1, string2);
//       socket.emit('scoreCalculated', { score: similarity });
//     } catch (error) {
//       console.error('Error calculating similarity:', error);
//       socket.emit('error', { 
//         title: 'Calculation Error', 
//         message: 'Failed to calculate similarity score. Please try again.' 
//       });
//     }
//   });
// });

// Start server and log a message
async function startServer() {
  // Initialize the pipeline first
  await initializeServer();
  
  // Then start the server
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Socket.IO server is running on port ${PORT}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
