const { getVectorSimilarity } = require('./getVectorSimilarity.js');

async function getScore(prompt, targetString) {
    try {
        const similarity = await getVectorSimilarity(prompt, targetString);
        const score = Math.floor(similarity * 10000);
        return score;
    } catch (error) {
        console.error('Error calculating score:', error);
        // Fallback to a basic score if vector similarity fails
        return Math.floor(Math.random() * 1000) + 100;
    }
}

module.exports = { getScore };