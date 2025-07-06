const { pipeline } = require('@huggingface/transformers');

let pipe = null;

// Initialize the pipeline
async function initializePipeline() {
    if (!pipe) {
        console.log('Loading pipeline...');
        pipe = await pipeline('feature-extraction', 'mixedbread-ai/mxbai-embed-large-v1');
        console.log('Pipeline loaded');
    }
    return pipe;
}

async function getVectorSimilarity(q1, q2) {
    if (!pipe) {
        await initializePipeline();
    }
    const embedding1 = await getSentenceEmbedding(q1);
    const embedding2 = await getSentenceEmbedding(q2);
    const similarity = cosineSimilarity(embedding1, embedding2);
    return similarity;
}

// Function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  let magnitudeA = 0;
  for (let i = 0; i < vecA.length; i++) {
    magnitudeA += vecA[i] * vecA[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);
  let magnitudeB = 0;
  for (let i = 0; i < vecB.length; i++) {
    magnitudeB += vecB[i] * vecB[i];
  }
  magnitudeB = Math.sqrt(magnitudeB);
  return dotProduct / (magnitudeA * magnitudeB);
}

// Function to get sentence embedding with mean pooling
async function getSentenceEmbedding(text) {
    if (!pipe) {
        await initializePipeline();
    }
    const output = await pipe(text);
    const sequenceLength = output.dims[1];
    const hiddenSize = output.dims[2];
    
    const sentenceEmbedding = new Array(hiddenSize).fill(0);
  
    for (let i = 0; i < sequenceLength; i++) {
        for (let j = 0; j < hiddenSize; j++) {
            const index = i * hiddenSize + j;
            sentenceEmbedding[j] += output.data[index];
        }
    }

    for (let j = 0; j < hiddenSize; j++) {
        sentenceEmbedding[j] /= sequenceLength;
    }
  
    return sentenceEmbedding;
}

module.exports = {
  initializePipeline,
  getVectorSimilarity,
};
