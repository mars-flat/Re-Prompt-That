/**
 * Logs a message to the console if the environment is not production
 * @param {string} event - The event that is happening. Usually use the Events enum.
 * @param {...any} args - The arguments to log
 */
function logMessage(event, ...args){
    if(process.env.NODE_ENV !== "production"){
        console.log('\n', `IN STATE: ${event} `.padEnd(75, '='));
        console.log(...args);
    }
}

/**
 * Logs an error to the console if the environment is not production
 * @param {string} event - The event that is happening. Usually use the Events enum.
 * @param {...any} args - The arguments to log
 */
function logError(event, ...args){
    if(process.env.NODE_ENV !== "production"){
        console.log('\n', `IN STATE: ${event} `.padEnd(75, '='));
        console.error(...args);
    }
}

module.exports = { logMessage, logError };