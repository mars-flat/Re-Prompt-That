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
    disconnectLobby: "disconnectLobby"
    
};

module.exports = Events;