async function queryGPT(message, client) {
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
  
  module.exports = { queryGPT };
  