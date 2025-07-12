/**
 * Queries the GPT model and returns the response
 * @param {OpenAI} client - The OpenAI client
 * @param {string} message - The message to send to the GPT model
 * @returns {string} The response from the GPT model
 */
async function queryGPT(client, message) {
    try {
        const res = await client.responses.create({
            model: "gpt-4o-mini",
            input: [
                {
                    role: "system",
                    content: "You are a helpful assistant. Keep responses concise (<=150 tokens)."
                },
                {
                    role: "user",
                    content: message
                }
            ],
            temperature: 0.5,
            max_output_tokens: 150
        });
        return res.output_text;
    } catch (error) {
        console.error("OpenAI API error:", error);
        throw new Error("Failed to get response from GPT");
    }
}

module.exports = queryGPT;
