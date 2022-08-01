const chatCommands = require("../chatCommands.js");

// Show "in-game" messages
function inGameMessage(username, message) {
    console.log(`\x1b[;30m<${username}> ${message}\x1b[0m`);
}

// Simulate the bot with basic functions
const bot = {
    chat: (message) => inGameMessage("chatBot", message),
    quit: () => null,
};

chatCommands.inject(bot);

testCommands = [
    ["aaaaa", "#h"],
    ["bbbbb", "#h h l"],
    ["ccccc", ".asd"],
    ["ddddd", "#lol"],
    ["eeeee", "#exit"],
    // ["fffff", "#asd"],
    // ["ggggg", "#asd"],
    // ["hhhhh", "#asd"],
    // ["iiiii", "#asd"],
    // ["jjjjj", "#asd"],
    // ["kkkkk", "#asd"],
    // ["lllll", "#asd"],
    // ["mmmmm", "#asd"],
];

testCommands.forEach(([username, message]) => {
    inGameMessage(username, message);
    chatCommands.runCommand(username, message);
});
