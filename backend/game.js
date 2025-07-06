const { getScore } = require('./tools/getScore.js');
const questions = require('./questions.js');
const Player = require('./player.js');

class Game {

    constructor(io, roomCode, players) {
        this.active = false;
        this.io = io;
        this.roomCode = roomCode;
        this.timer = 60;
        this.timerInterval = null;

        this.players = Array.from(players).map(username => new Player(username));
        this.allQuestions = questions.sort(() => Math.random() - 0.5);
    }

    startGame() {
        this.active = true;
        this.currentQuestion = this.allQuestions.pop();
        this.io.to(this.roomCode).emit('gameStarted', { currentQuestion: this.currentQuestion });
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
            this.io.to(this.roomCode).emit('updateScores', this.getPlayersByScoreDescending());
        }
    }

    getPlayersByScoreDescending() {
        return this.players
            .sort((a, b) => b.score - a.score)
            .map(player => ({
                username: player.username,
                score: player.score
            }));
    }
}

module.exports = Game;