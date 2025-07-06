const { getScore } = require('./tools/getScore.js');
const questions = require('./questions.js');
const Player = require('./player.js');

class Game {

    constructor(io, roomCode, players) {
        this.active = false;
        this.started = false;
        this.io = io;
        this.roomCode = roomCode;
        this.timer = 60;
        this.timerInterval = null;

        this.players = Array.from(players).map(username => new Player(username));
        this.allQuestions = questions.sort(() => Math.random() - 0.5);
    }

    startGame() {
        this.active = true;
        this.started = true;
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
        this.started = false;
        clearInterval(this.timerInterval);
        const finalRankings = this.getPlayersByScoreDescending();
        this.io.to(this.roomCode).emit('gameEnded', { 
            rankings: finalRankings,
            winner: finalRankings.length > 0 ? finalRankings[0] : null
        });
    }

    async handlePromptSubmission(username, aiResponse, userPrompt) {
        if (!this.active) {
            return { error: 'Game is not active' };
        }

        const player = this.players.find(p => p.username === username);
        if (!player) {
            return { error: 'Player not found' };
        }

        try {
            // Calculate score based on similarity between AI response and current question
            const newScore = await getScore(aiResponse, this.currentQuestion);
            
            // Update player's score (keep the highest score)
            player.score = Math.max(player.score, newScore);
            
            // Broadcast updated leaderboard to all players
            const updatedLeaderboard = this.getPlayersByScoreDescending();
            this.io.to(this.roomCode).emit('updateLeaderboard', { 
                leaderboard: updatedLeaderboard,
                playerScore: newScore,
                username: username
            });

            return { 
                success: true, 
                score: newScore, 
                leaderboard: updatedLeaderboard,
                aiResponse: aiResponse,
                userPrompt: userPrompt
            };
        } catch (error) {
            console.error('Error calculating score:', error);
            return { error: 'Failed to calculate score' };
        }
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

    isGameActive() {
        return this.active && this.started;
    }
}

module.exports = Game;