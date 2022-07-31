# **Chat Commands**

---

## API

### configs

#### configs.prefix

Default: "#"

#### configs.chatPrefix

Default: ""
Chat prefix that the bot uses when chatting

Ex.

```js
configs.chatPrefix = "/whisper USERNAME";

/*
Any bot.chat() that the chatCommand module calls will be
prefixed with '/whisper USERNAME', letting you keep errors
and such to yourself
*/
```

#### configs.whitelist

Default: []

List of usernames that are allowed to run commands

#### configs.blacklist

Default: []

List of usernames that are not allowed to run commands

#### configs.useDefaultErrorHandlers

Default: true

If false, the errors from `runCommand` will be thrown to the main program

#### configs.allowBotResponse

Default: true

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

Ex.

```js
{
    command: "fight",
}
```

### description

Description of the command

Ex.

```js
{
    description: "Makes the bot fight a specified player or the closest one";
}
```

### args

See [writing an arg](#create-an-arg)

Ex.

```js
{
    args: [
        {
            arg: "username",
            optional: true,
        },
    ],
}
```

### code

The code that is run on command call

Ex.

```js
{
    code: (arg1, arg2) => {
        console.log("The first argument is", arg1);
        if (arg2 === "test") {
            console.log("The second argument was 'test'");
        }
    },
}
```

---

## Create an arg

### arg

Name of the argument

Ex.

```js
{
    arg: "username",
}
```

### description

Default: "No description"

Description of the argument

Ex.

```js
{
    description: "Username of the player",
}
```

### optional

Default: false

Wether or not the argument is optional

Ex.

```js
{
    optional: true,
}
```

### isRest

Default: false

Wether or not the argument is a rest argument

Takes the rest of the arguments as a list

Ex.

```js
{
    isRest: true;
}
```

### testValid

Default `() => true`

Function to run on the user inputted argument to check if it is valid

If the function returns false or errors, the argument throws a InvalidArgError

Ex.

```js

{
    testValid: (username) => Object.keys(bot.players).includes(username),
}

```

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
        code: (username = null) => {
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
