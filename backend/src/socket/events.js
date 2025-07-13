/**
 * Events that can be emitted by the socket server
 */
const Events = {

    /* starting the server */
    initializing: "initializing",

    /* creating a game room */
    createRoom: "createRoom",

    /* getting the user list for a room */
    getUserList: "getUserList",

    /* joining a game room */
    joinRoom: "joinRoom",

    /* disconnecting from the lobby */
    disconnectLobby: "disconnectLobby",

    /* starting a game */
    startGame: "startGame",

    /* player ready check */
    playerReady: "playerReady",

    /* rejoining the lobby after the game ends */
    gameEndRejoin: "gameEndRejoin",
    
    /* getting a sorted list ofgame scores */
    getGameResults: "getGameResults",

    /* submitting a prompt to GPT */
    submitPrompt: "submitPrompt",
    
};

module.exports = Events;