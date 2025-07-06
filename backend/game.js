const { getScore } = require('./tools/getScore.js');

class Game {

    constructor(io, roomCode, players) {
        this.active = false;
        this.io = io;
        this.roomCode = roomCode;
        this.timer = 60;
        this.timerInterval = null;

        this.players = players.map(player => new Player(player));
    }

    startGame() {
        this.active = true;
        this.io.to(this.roomCode).emit('gameStarted');
        this.timerInterval = setInterval(() => {
            this.timer--;
            this.io.to(this.roomCode).emit('timerMessage', { timer: this.timer });
            if (this.timer <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    endGame() {
        this.active = false;
        clearInterval(this.timerInterval);
        const rankings = Object.fromEntries(
            Object.entries(this.players).sort(([, v1], [, v2]) => v2 - v1)
        );
        this.io.to(this.roomCode).emit('gameEnded', { winner: rankings });
    }

    async updateScore(username, prompt, targetString) {
        const player = this.players.find(p => p.username === username);
        if (player) {
            const newScore = await getScore(prompt, targetString);
            // Use MAX(existing score, new score)
            player.score = Math.max(player.score, newScore);
            // Emit updated scores to all players
            this.io.to(this.roomCode).emit('updateScores', this.getPlayerScores());
        }
    }

    getPlayersByScoreDescending() {
        return this.players.sort((a, b) => b.score - a.score);
    }

}

module.exports = Game;