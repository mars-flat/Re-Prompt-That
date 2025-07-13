const Events = require("./events.js");

const { 
    handleCreateRoom, 
    getUserList, 
    handleJoinRoom, 
    handleGameEndRejoin, 
    handleDisconnectLobby, 
    handleStartGame,
    handlePlayerReady,
    handleGetGameResults,
    handleSubmitPrompt 
} = require("./handlers.js");

/*
TODO:
- decide whether or not to use socket.data for username instead of asking the client for it
*/


/**
 * Sets up the socket server for game related events.
 * @param {Server} io - The socket.io server
 * @param {OpenAI} gptClient - The OpenAI client
 */
function setUpSocketServer(io, gptClient) {

    /**
     * gameContext object to hold commonly used game data
     *  rooms: {
     *      roomCode: {
     *          users: Set<string>
     *          game: Game instance
     *      }
     *  }
     */
    const rooms = {};

    io.on('connection', (socket) => {

        socket.on(Events.createRoom, ({ username }) => {
            handleCreateRoom(socket, io, rooms, username, undefined);
        });

        socket.on(Events.getUserList, ({ roomCode }) => {
            getUserList(socket, io, rooms, roomCode);
        });

        socket.on(Events.joinRoom, ({ roomCode, username }) => {
            handleJoinRoom(socket, rooms, roomCode, username);
        });

        socket.on(Events.gameEndRejoin, ({ roomCode, username }) => {
            handleGameEndRejoin(socket, io, rooms, roomCode, username);
        });

        socket.on(Events.disconnectLobby, () => {
            handleDisconnectLobby(socket, io, rooms);
        });

        socket.on(Events.startGame, ({ roomCode }) => {
            handleStartGame(io, rooms, roomCode);
        });

        socket.on(Events.playerReady, ({ roomCode, username }) => {
            handlePlayerReady(rooms, roomCode, username);
        });

        socket.on(Events.getGameResults, ({ roomCode }) => {
            handleGetGameResults(socket, rooms, roomCode);
        });

        socket.on(Events.submitPrompt, ({ roomCode, username, prompt }) => {
            handleSubmitPrompt(socket, gptClient, rooms, roomCode, username, prompt);
        });

    });
}

module.exports = setUpSocketServer;