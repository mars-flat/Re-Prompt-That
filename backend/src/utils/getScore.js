const { getVectorSimilarity } = require('./getVectorSimilarity.js');

const MAX_SCORE = 10000;

/**
 * Calculates the score of a prompt based on the similarity to a target string
 * @param {string} prompt - The prompt to score
 * @param {string} targetString - The target string to compare the prompt to
 * @returns {number} The score of the prompt
 */
async function getScore(prompt, targetString) {
    const similarity = await getVectorSimilarity(prompt, targetString);
    const score = Math.floor(similarity * MAX_SCORE);
    return score;
}

module.exports = getScore;