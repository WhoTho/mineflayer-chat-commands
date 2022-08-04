# **Chat Commands**

---

## Configs

#### configs.prefix

Default: `"#"`

The prefix for all commands

#### configs.chatPrefix

Default: `""`

Any `bot.chat` that the chatCommand module calls will be prefixed with `configs.chatPrefix`, letting you keep errors and default chats to yourself

```js
configs.chatPrefix = "/whisper MY_USERNAME";
```

#### configs.whitelist

Default: `[]`

List of usernames that are allowed to run commands

```js
chatCommands.configs.whitelist.push("MY_USERNAME");
```

#### configs.blacklist

Default: `[]`

List of usernames that are not allowed to run commands

```js
chatCommands.configs.blacklist.push("OTHER_USERNAME");
```

#### configs.useDefaultErrorHandlers

Default: `true`

If false, the errors from [`runCommand`](#runcommandusername-message) will be thrown to the main program

```js
chatCommands.configs.useDefaultErrorHandlers = false;

try {
    chatCommands.runCommand("MY_USERNAME", "#notACommand");
} catch (err) {
    console.log(err); // -> UnknownCommandError: Chat command error
}
```

#### configs.allowBotChat

Default: `true`

Wether or not the chatCommand module will use `bot.chat` or `console.log` for displaying info

```js
chatCommands.configs.allowBotChat = false;

chatCommands.runCommand("MY_USERNAME", "#help"); // -> Bot chat: help message...
```

---

## Functions & variables

#### allCommands

List of all commands

Avoid calling `allCommands.push`, as that will skip checks and the adding of internal info

```js
const allCommandDescriptions = chatCommands.allCommands.map((command) => command.description);
```

#### addCommand(command)

command: [`command`](#create-a-command)

Takes in a command and adds it to allCommands

```js
chatCommands.addCommand({
    command: "hi",
    code: () => {
        bot.chat("Hello!");
    },
});
```

#### addCommands(commands)

Commands: List of [`commands`](#create-a-command)

Adds the commands to allCommands

```js
chatCommands.addCommands([
    {
        command: "smallTalk",
        code: () => {
            bot.chat("Isn't the moon lovely?");
        },
    },
    {
        command: "bye",
        code: () => {
            bot.chat("Goodbye!");
        },
    },
]);
```

#### runCommand(username, message)

username: `String`

message: `String`

Tries to run the message as a command.

Throws errors if `configs.useDefaultErrorHandlers` is `false`

```js
bot.on("chat", (username, message) => {
    if (username === bot.username) return;

    chatCommands.runCommand(username, message);
});
```

#### getCommand(name)

name: `String`

Returns: [`command`](#create-a-command)

Finds and returns the command by the command name

```js
const helpCommand = chatCommands.getCommand("help");
```

#### getAllNames(command)

command: [`command`](#create-a-command)

Returns: List of `strings`

Returns all the names of a command (Actual name + aliases)

```js
chatCommands.getAllNames(helpCommand); // -> ['h', 'help']
```

#### commandNameToString(command)

command: [`command`](#create-a-command)

Returns: `String`

Returns the command name as a formatted string (Runs [argNameToString](#argnametostringarg))

```js
const commandName = chatCommands.commandNameToString(helpCommand); // -> "help [command]"
```

#### argNameToString(arg)

arg: [`argument`](#create-an-argument)

Returns: `String`

Returns the argument name as a formatted string

`<requiredArg> [optionalArg] [...restArg]`

```js
const argName = chatCommands.argNameToString(chatCommands.allCommands[0].args[0]); // -> "[username]"
```

---

## Create a command

#### command

Type: `String`

Name of the command

```js
{
    command: "fight",
}
```

#### aliases

Type: List of `strings`

Aliases for the command

```js
{
    aliases: ["f", "kill"],
}
```

#### description

Type: `String`

Default: `"No description"`

Description of the command

```js
{
    description: "Makes the bot fight a specified player or the closest one",
}
```

#### args

Type: List of [`arguments`](#create-an-arg)

See [writing an arg](#create-an-arg)

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

#### code(caller, args...)

username: `Object` ( `{ username: "CALLER_USERNAME", message: "#help" }`)

Type: `Function`

The code that is run on command call

```js
{
    code: (_, arg1, arg2) => {
        if (arg1 === "test") console.log(arg2);
    },
}
```

#### onFail(err)

err: `NotEnoughArgsError`, `TooManyArgsError`, or `RuntimeError`

Type: `Function`

Default: `(err) => { throw err }`

By default, this function would just throw the error to either the default handlers or to the main program

Allows you to write custom error messages for specific commands

```js
{
    onFail: (err) => {
        console.log("Command " + err.command.command + " has failed");
    },
}
```

---

## Create an argument

#### arg

Type: `String`

Name of the argument

```js
{
    arg: "username",
}
```

#### description

Type: `String`

Default: `"No description"`

Description of the argument

```js
{
    description: "Username of the player",
}
```

#### optional

Type: `Boolean`

Default: `false`

Wether or not the argument is optional

```js
{
    optional: true,
}
```

#### isRest

Type: `Boolean`

Default: `false`

Wether or not the argument is a rest argument (Takes the rest of the arguments as a list)

```js
{
    isRest: true,
}
```

#### testValid(arg)

arg: `String`, `number`, or `boolean`

Type: `Function`

Default `() => true`

Function to run on the user inputted argument to check if it is valid

If the function returns false or errors, the argument throws an `InvalidArgError`

```js

{
    testValid: (username) => Object.keys(bot.players).includes(username),
}

```

#### onFail(err)

err: `InvalidArgumentError`

Type: `Function`

Default: `(err) => { throw err }`

By default, this function would just throw the error to either the default handlers or to the main program

Allows you to write custom error messages for each argument that is invalid

```js
{
    onFail: (err) => {
        console.log("Unknown player:", err.arg);
        console.log("Possible players:", Object.keys(bot.players).join(", "));
    },
}
```

---

## Examples

```js
const mineflayer = require("mineflayer");
const chatCommands = require("./chatCommands.js");

const bot = mineflayer.createBot({
    username: "chatCommands",
    host: "localhost",
});

chatCommands.inject(bot);

chatCommands.addCommand({
    command: "help",
    aliases: ["h"],
    description: "Runs the help command",
    code: () => {
        console.log("Check console for more information");
    },
});

chatCommands.addCommands([
    {
        command: "chatConfigs",
        description: "Shows the chat configs",
        code: () => {
            for (const key in chatCommands.configs) {
                bot.chat(`${key}: ${chatCommands.configs[key]}`);
            }
        },
    },
    {
        command: "fight",
        aliases: ["f", "kill"],
        description: "Starts the pvp bot against a user or the nearest entity",
        args: [
            {
                arg: "username",
                optional: true,
                testValid: (username) => Object.keys(bot.players).includes(username),
                onFail: (err) => {
                    console.log("Unknown player:", err.arg);
                    console.log("Possible players:", Object.keys(bot.players).join(", "));
                },
            },
        ],
        code: (_, username = null) => {
            if (username) bot.pvp.attack(bot.players[username].entity);
            else bot.pvp.attack(bot.nearestEntity());
        },
    },
    {
        command: "quit",
        code: bot.quit,
    },
]);

bot.on("chat", (username, message) => {
    if (username === bot.username) return;

    chatCommands.runCommand(username, message);
});
```
