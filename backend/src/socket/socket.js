const Events = require("./events.js");
const Game = require("../game/game.js");
const { logMessage } = require("../utils/loggingTools.js");
const queryGPT = require("../utils/gptQuery.js");


/**
 * Sets up the socket server for game related events.
 * @param {Server} io - The socket.io server
 * @param {OpenAI} client - The OpenAI client
 */
function setUpSocketServer(io, client) {

  const rooms = {}; // roomCode -> Set of usernames
  const games = {}; // roomCode -> Game instance

  io.on('connection', (socket) => {

    /**
     * Event: createRoom
     * Payload: { username: string }
     * 
     * Called when the client creates a room
     */
    socket.on(Events.createRoom, ({ username }) => {

      const generateRoomCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      let roomCode = generateRoomCode();
      while (rooms[roomCode]) {
        roomCode = generateRoomCode();
      }
      rooms[roomCode] = new Set([username]);

      socket.join(roomCode);
      socket.data.username = username;
      socket.data.roomCode = roomCode;
      socket.emit('roomJoined', { roomCode });

      logMessage(Events.createRoom, socket.rooms, roomCode, io.sockets.adapter.rooms);
      const roomSockets = io.sockets.adapter.rooms.get(roomCode);
      logMessage(Events.createRoom, "Socket IDs in room:", Array.from(roomSockets || []));

    });

    /**
     * Event: getUserList
     * Payload: { roomCode: string }
     * 
     * Called when the client wants to get the user list for a room
     */
    socket.on(Events.getUserList, ({ roomCode }) => {

      io.to(roomCode).emit('updateUserList', Array.from(rooms[roomCode]));
      logMessage(Events.getUserList, "Current user list:", Array.from(rooms[roomCode]));
      socket.emit('getUsername', socket.data.username);

    })

    /**
     * Event: joinRoom
     * Payload: { roomCode: string, username: string }
     * 
     * Called when the client wants to join a room
     *  - Updates the user list for the room
     *  - Sends the update to everyone in the room
     */
    socket.on(Events.joinRoom, ({ roomCode, username }) => {

      logMessage(Events.joinRoom, `Attempting to join room: ${roomCode} with username: ${username}`);

      // if game started
      if (games[roomCode] && games[roomCode].started) {
        logMessage(Events.joinRoom, "Game already started");
        socket.emit('error', { signal: "joinRoom", title: "Game already started", message: 'Please wait for the next game.' });
        return;
      }

      // if room not found
      if (!rooms[roomCode]) {
        logMessage(Events.joinRoom, "Room not found:", roomCode);
        socket.emit('error', { signal: "joinRoom", title: "Room not found", message: 'Please create a new room.' });
        return;
      }

      // if username already exists
      if (rooms[roomCode].has(username)) {
        logMessage(Events.joinRoom, "Username already exists:", username);
        socket.emit('error', { signal: "joinRoom", title: "Username already exists", message: 'Please choose a different username.' });
        return;
      }

      rooms[roomCode].add(username);
      socket.join(roomCode);
      socket.data.username = username;
      socket.data.roomCode = roomCode;
      logMessage(Events.joinRoom, `User ${username} joined room ${roomCode}`);
      socket.emit('roomJoined', { roomCode });
      logMessage(Events.joinRoom, socket.rooms);

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
      if (games[roomCode].isLobbyReady()) {
        games[roomCode].startGame();
      }
    });

    socket.on('getGameResults', ({ roomCode }) => {
      socket.emit('gameResults', { results: games[roomCode].getPlayersByScoreDescending() });
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
    socket.on('submitPrompt', async ({ roomCode, username, prompt }) => {
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
        const aiResponse = await queryGPT(client, prompt);

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
        if (!games[roomCode].isGameActive() && games[roomCode].isQueryingDone()) {
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
}

module.exports = setUpSocketServer;