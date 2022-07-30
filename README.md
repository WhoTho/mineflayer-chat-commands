# **Chat Commands**

---

## API

### configs

#### configs.prefix

Default is "#"

#### configs.whitelist

Default is []
List of usernames that are allowed to run commands

#### configs.blacklist

Default is []
List of usernames that are not allowed to run commands

#### configs.useDefaultErrorHandlers

Default is true
If false, the errors from `runCommand` will be thrown to the main program

#### configs.allowBotResponse

Default is true
Wether or not the chatCommand module will be allowed to call `bot.chat()` for internal info logging

### allCommands

List of all commands

### addCommand([command](#create-a-command))

Takes in a command and adds it to allCommands

### addCommands([commands](#create-a-command))

Commands: List of commands
Adds the commands to allCommands

### runCommand(username, message)

Username: Name of the player who called the command
Message: Chat message

Tries to run the message as a command.
Throws unknownCommandError

### getCommand(commandName)

commandName: String
Finds and returns the command by the command name

### commandNameToString(command)

command: Command

Returns the command name as a formatted string (Runs [argNameToString](<#argNameToString(arg)>))

Ex.

```js
const commandName = chatCommands.commandNameToString(chatCommands.allCommands[0]);
console.log(commandName); // -> "fight [username]"
```

### argNameToString(arg)

arg: argument

Returns the argument name as a string

Ex.

```js
const argName = chatCommands.argNameToString(chatCommands.allCommands[0].args[0]);
console.log(argName); // -> "[username]"
```

---

## Create a command

### command

Name of the command

### description

Description of the command

### args

See [writing an arg](#create-an-arg)

### code

The code that is run on command call

Ex.

```js
(arg1, arg2) => {
    console.log("The first argument is", arg1);
    if (arg2 === "test") {
        console.log("The second argument was 'test'");
    }
};
```

---

## Create an arg

### arg

Name of the argument

### description

Description of the argument

### optional

Wether or not the argument is optional

### isRest

Wether or not the argument is a rest argument
Takes the rest of the arguments as a list

### testValid

Function to run on the user inputted argument to check if it is valid
If the function returns false or errors, the argument throws a InvalidArgError

---

## Examples

```js
const mineflayer = require("mineflayer");
const chatCommands = require("./ChatCommands.js");

const bot = mineflayer.createBot({
    username: "chatCommands",
    host: "localhost",
});

chatCommands.inject(bot);

chatCommands.prefix = ".";

chatCommands.addCommand({
    command: "help",
    description: "Runs the help command",
    code: () => {
        console.log("Check console for more information");
    },
});

chatCommands.addCommands([
    {
        command: "settings",
        description: "Shows the bot settings",
        code: () => {
            for (const key in configs) {
                bot.chat(`${key}: ${configs[key]}`);
            }
        },
    },
    {
        command: "fight",
        description: "Starts the pvp bot against a user or the nearest entity",
        args: [
            {
                arg: "username",
                optional: true,
                testValid: (username) => Object.keys(bot.players).includes(username),
            },
        ],
        code: (username) => {
            if (username) bot.pvp.attack(bot.players[username].entity);
            else bot.pvp.attack(bot.nearestEntity());
        },
    },
    {
        command: "quit",
        code: bot.quit,
    },
    {
        command: "whitelist",
        description: "Add players to the chatCommand whitelist",
        args: [{ arg: "usernames", isRest: true }],
        code: (...usernames) => {
            chatCommands.configs.whitelist.push(...usernames);
        },
    },
]);

bot.on("chat", (username, message) => {
    if (username === bot.username) return;

    chatCommands.runCommand(username, message);
});
```
