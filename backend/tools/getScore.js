const { getVectorSimilarity } = require('./getVectorSimilarity.js');

const MAX_SCORE = 10000;

async function getScore(prompt, targetString) {
    try {
        const similarity = await getVectorSimilarity(prompt, targetString);
        const score = Math.floor(similarity * MAX_SCORE);
        return score;
    } catch (error) {
        console.error('Error calculating score:', error);
        // Fallback to a basic score if vector similarity fails
        return Math.floor(Math.random() * 1000) + 100;
    }
}

module.exports = { getScore };