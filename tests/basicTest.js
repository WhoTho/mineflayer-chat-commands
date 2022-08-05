const chatCommands = require("../src/index.js");
const mineflayer = require("mineflayer");

// Show "in-game" messages
function showInGameMessage(username, message) {
    console.log(`\x1b[;30m<${username}> ${message}\x1b[0m`);
}

const bot = mineflayer.createBot({
    username: "testBot",
    host: "localhost",
    version: "1.8.9",
});

chatCommands.allowConsole = true;
bot.loadPlugin(chatCommands);

bot.once("chat_commands_ready", () => {
    bot.chatCommands.addCommand({
        command: "a",
        args: [{ arg: "a" }],
        code: (_, a) => {
            console.log(a);
        },
    });
});

bot.on("chat", (username, message) => {
    if (username === bot.username) return;

    showInGameMessage(username, message);

    bot.chatCommands.runCommand(username, message);
});

bot.on("spawn", () => {
    console.log("Bot spawned");
});
