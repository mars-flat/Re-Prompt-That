const OpenAI = require("openai");
const { Server } = require("socket.io");
const { logMessage, logError } = require('./utils/loggingTools.js');
const { initializePipeline } = require('./utils/getVectorSimilarity.js');
const Events = require("./socket/events.js");
const createHttpServer = require('./routes/httpHandler.js');
const setUpSocketServer = require('./socket/socket.js');
require('dotenv').config({ path: '../.env' });


const PORT = 4000;


/**
 * Starts the backend server.
 */
async function startServer() {

    logMessage(Events.initializing, 'Initializing server...');

    // Create the http server
    const server = createHttpServer(PORT);
    logMessage(Events.initializing, 'Initialized http server');

    // Create the socket server
    const io = new Server(server, {
        cors: {
            origin: '*',
        },
    });
    logMessage(Events.initializing, 'Initialized socket server');

    // Check if OpenAI API key is available and create the client
    const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '';
    const client = hasOpenAIKey ? new OpenAI() : null;
    logMessage(Events.initializing, 'Initialized OpenAI client');

    if (!hasOpenAIKey) throw new Error('OPENAI_API_KEY not found');
    logMessage(Events.initializing, 'OpenAI API key found');

    // Initialize the vector similarity pipeline
    await initializePipeline();
    logMessage(Events.initializing, 'Pipeline initialized successfully');

    // Set up the socket server
    setUpSocketServer(io, client);
    logMessage(Events.initializing, 'Set up socket server');

    // Then start the server
    server.listen(PORT, '0.0.0.0', () => {
        logMessage(Events.initializing, `Socket.IO server is running on port ${PORT}`);
    });

}


startServer().catch(error => {
    logError(Events.initializing, 'Failed to start server:', error);
    process.exit(1);
});
