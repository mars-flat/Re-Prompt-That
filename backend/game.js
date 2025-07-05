class Game {

    constructor(io, roomCode, players) {
        this.io = io;
        this.roomCode = roomCode;
        this.timer = 60;
        this.timerInterval = null;

        // players is a dictionary with player -> score pairs
        this.players = Object.fromEntries(
            Array.from(players).map(val => [val, 0])
        );
    }

    startGame() {
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
        clearInterval(this.timerInterval);
        const rankings = Object.fromEntries(
            Object.entries(this.players).sort(([, v1], [, v2]) => v2 - v1)
        );
        this.io.to(this.roomCode).emit('gameEnded', { winner: rankings });
    }

    updateScore(player, score) {
        this.players[player] = score;
    }

}

module.exports = Game;