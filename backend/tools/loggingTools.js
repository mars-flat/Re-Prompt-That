const { State } = require("../state.js");

function logMessage(state, ...args){
    if(process.env.NODE_ENV !== "production"){
        console.log(`IN STATE: ${state}`.padEnd(75, '='));
        console.log(...args, '\n');
    }
}

function logError(state, ...args){
    if(process.env.NODE_ENV !== "production"){
        console.log(`IN STATE: ${state}`.padEnd(75, '='));
        console.error(...args, '\n');
    }
}

module.exports = { logMessage, logError };