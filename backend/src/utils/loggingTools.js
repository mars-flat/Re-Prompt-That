function logMessage(event, ...args){
    if(process.env.NODE_ENV !== "production"){
        console.log(`IN STATE: ${event}`.padEnd(75, '='));
        console.log(...args, '\n');
    }
}

function logError(event, ...args){
    if(process.env.NODE_ENV !== "production"){
        console.log(`IN STATE: ${event}`.padEnd(75, '='));
        console.error(...args, '\n');
    }
}

module.exports = { logMessage, logError };