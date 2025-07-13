const Game = require("../game/game.js");
const Events = require("./events.js");
const queryGPT = require("../utils/gptQuery.js");
const { logMessage, logError } = require("../utils/loggingTools.js");


/**
 * Generates a random room code
 * @returns {string} A random room code
 */
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}


/**
 * Handles the creation of a room
 * @param {Socket} socket - The socket
 * @param {Object} io - The socket.io server
 * @param {Object} rooms - The rooms object
 * @param {string} username - The username of the player
 * @param {string} roomCode - The room code. Leave as null for randomly generated room code
 */
function handleCreateRoom(socket, io, rooms, username, roomCode) {

    let newRoomCode = roomCode;

    if(!newRoomCode){
        newRoomCode = generateRoomCode();
        while (rooms[newRoomCode]) {
            newRoomCode = generateRoomCode();
        }
    }

    if(rooms[newRoomCode]){
        socket.emit('error', {
            signal: "createRoom",
            title: "Room already exists",
            message: 'Please choose a different room code.'
        });
    }

    rooms[newRoomCode] = {
        users: new Set([username]),
        game: null,
    }

    socket.join(newRoomCode);
    socket.data.username = username;
    socket.data.roomCode = newRoomCode;
    socket.emit('roomJoined', { roomCode: newRoomCode });

    const roomSockets = io.sockets.adapter.rooms.get(newRoomCode);
    logMessage(Events.createRoom, socket.rooms, newRoomCode, io.sockets.adapter.rooms);
    logMessage(Events.createRoom, "Socket IDs in room:", Array.from(roomSockets || []));
    logMessage(Events.createRoom, "Rooms object:", rooms);

}


/**
 * Gets the user list for a room
 * @param {Socket} socket - The socket
 * @param {Object} io - The socket.io server
 * @param {Object} rooms - The rooms object
 * @param {string} roomCode - The room code
 */
function getUserList(socket, io, rooms, roomCode) {
    io.to(roomCode).emit('updateUserList', Array.from(rooms[roomCode].users));
    socket.emit('getUsername', socket.data.username);

    logMessage(Events.getUserList, "Current user list:", Array.from(rooms[roomCode].users));
}


/**
 * Handles the joining of a room
 * @param {Socket} socket - The socket
 * @param {Object} rooms - The rooms object
 * @param {string} roomCode - The room code
 * @param {string} username - The username of the player
 */
function handleJoinRoom(socket, rooms, roomCode, username) {

    logMessage(Events.joinRoom, `Attempting to join room: ${roomCode} with username: ${username}`);

    // if room not found
    if (!rooms[roomCode]) {
        logMessage(Events.joinRoom, "Room not found:", roomCode);
        socket.emit('error', { signal: "joinRoom", title: "Room not found", message: 'Please create a new room.' });
        return;
    }

    const { users, game } = rooms[roomCode];

    // if username already exists
    if (users.has(username)) {
        logMessage(Events.joinRoom, "Username already exists:", username);
        socket.emit('error', { signal: "joinRoom", title: "Username already exists", message: 'Please choose a different username.' });
        return;
    }

    // if game started
    if (game && game.started) {
        logMessage(Events.joinRoom, "Game already started");
        socket.emit('error', { signal: "joinRoom", title: "Game already started", message: 'Please wait for the next game.' });
        return;
    }

    users.add(username);
    socket.join(roomCode);
    socket.data.username = username;
    socket.data.roomCode = roomCode;
    socket.emit('roomJoined', { roomCode });

    logMessage(Events.joinRoom, `User ${username} joined room ${roomCode}`);
    logMessage(Events.joinRoom, socket.rooms);
}


/**
 * Handles the re-joining of a room after a game ends
 * After a game ends, the room is deleted to prevent issues when users click rejoin before others
 * As a result, when rejoining this function will create a room if it doesn't exist
 * @param {Socket} socket 
 * @param {Object} io - The socket.io server
 * @param {Object} rooms - The rooms object
 * @param {string} roomCode 
 * @param {string} username 
 */
function handleGameEndRejoin(socket, io, rooms, roomCode, username) {

    logMessage(Events.gameEndRejoin, `User ${username} re-joining room ${roomCode} ...`);

    if (rooms[roomCode]) {
        handleJoinRoom(socket, rooms, roomCode, username);
    } else {
        handleCreateRoom(socket, io, rooms, username, roomCode);
    }

}


/**
 * Handles the disconnection of a user from the lobby
 * @param {Socket} socket 
 * @param {Object} io - The socket.io server
 * @param {Object} rooms - The rooms object
 * @param {string} roomCode - The room code
 * @param {string} username - The username of the player
 */
function handleDisconnectLobby(socket, io, rooms) {
    const { username, roomCode } = socket.data || {};

    if (username && roomCode && rooms[roomCode]) {
        const { users, game } = rooms[roomCode];

        logMessage(Events.disconnectLobby, `User ${username} disconnecting from room ${roomCode} ...`);
        users.delete(username);

        if (game && game.active) {
            logMessage(Events.disconnectLobby, `User ${username} left game in room ${roomCode}`);
            game.leaveGame(username);
            io.to(roomCode).emit('playerLeft', username);
        }

        if (users.size === 0) {
            logMessage(Events.disconnectLobby, `Room ${roomCode} is empty, deleting it`);
            delete rooms[roomCode];
        } else {
            logMessage(Events.disconnectLobby, `Updating user list for room ${roomCode}:`, Array.from(users));
            io.to(roomCode).emit('updateUserList', Array.from(users));
        }

        // TODO: determine if we need to edit socket.data and if so, does it break anything?
        socket.leave(roomCode);
    }
    logMessage(Events.disconnectLobby, `Final room state: ${rooms}`);
}


/**
 * Handles the starting of a game. Tells all clients to transition to the game page
 * @param {Object} io - The socket.io server
 * @param {Object} rooms - The rooms object
 * @param {string} roomCode - The room code
 */
function handleStartGame(io, rooms, roomCode) {
    rooms[roomCode].game = new Game(io, roomCode, rooms[roomCode].users);
    io.to(roomCode).emit('goToStartGame');
}


/**
 * Handles the ready check of a player
 * @param {string} roomCode - The room code
 * @param {string} username - The username of the player
 */
function handlePlayerReady(rooms, roomCode, username) {
    const { game } = rooms[roomCode];
    game.updateReadyCheck(username);
    if (game.isLobbyReady()) {
        game.startGame();
    }
    logMessage(Events.playerReady, game, "roomCode", roomCode, "username", username)
}


/**
 * Handles the getting of game results
 * @param {Socket} socket - The socket
 * @param {Object} rooms - The rooms object
 * @param {string} roomCode - The room code
 */
function handleGetGameResults(socket, rooms, roomCode) {
    socket.emit('gameResults', { results: rooms[roomCode].game.getPlayersByScoreDescending() });
}


/**
 * Handles the submission of a prompt to the AI. If prompt submission occurs after the game has ended,
 * Also tells the clients to transition to the results page.
 * @param {Socket} socket - The socket
 * @param {Object} rooms - The rooms object
 * @param {string} roomCode - The room code
 * @param {string} username - The username of the player
 * @param {string} prompt - The prompt to submit
 */
async function handleSubmitPrompt(socket, gptClient, rooms, roomCode, username, prompt) {
    logMessage(Events.submitPrompt, "Submitting prompt:", roomCode, username, prompt);

    const { game } = rooms[roomCode] || {};
    if (!game || !game.isGameActive()) {
        socket.emit('error', {
            signal: "submitPrompt",
            title: "Game not active or does not exist",
            message: 'No active game in this room or room does not exist.'
        });
        return;
    }

    try {
        // First, send the user's prompt to GPT to get an AI response
        game.updateQueriesActive(1);
        const aiResponse = await queryGPT(gptClient, prompt);

        // Then calculate score by comparing AI response with the current question
        const result = await game.handlePromptSubmission(username, aiResponse, prompt);

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
        game.updateQueriesActive(-1);
        if (!game.isGameActive() && game.isQueryingDone()) {
            io.to(roomCode).emit('goToResultsPage');
        }
    } catch (error) {
        game.updateQueriesActive(-1);
        logError(Events.submitPrompt, 'Error handling prompt submission:', error);
        socket.emit('error', {
            signal: "submitPrompt",
            title: "Server Error",
            message: 'Failed to process your prompt. Please try again.'
        });
    }
}


module.exports = {
    handleCreateRoom,
    getUserList,
    handleJoinRoom,
    handleGameEndRejoin,
    handleDisconnectLobby,
    handleStartGame,
    handlePlayerReady,
    handleGetGameResults,
    handleSubmitPrompt,
}