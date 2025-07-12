/**
 * A player in the game. Stores player data.
 */
class Player {
    
    constructor(username) {
        this.username = username;
        this.score = 0;
        this.messages = [];
        this.responses = [];
    }
    
}

module.exports = Player;