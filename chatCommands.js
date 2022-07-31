/*
Created by @WhoTho#9592

TODO:
    add custom errors for args
*/

// +------------------------------+
// |           GLOBALS            |
// +------------------------------+

const {
    UnknownCommandError,
    NotEnoughArgsError,
    TooManyArgsError,
    InvalidArgError,
    RuntimeError,
    StructureError,
} = require("./chatCommandErrors.js");

var bot;
var allCommands = [];
var configs = {
    prefix: "#",
    chatPrefix: "",
    whitelist: [],
    blacklist: [],
    useDefaultErrorHandlers: true,
    allowBotResponse: true,
};

// +------------------------------+
// |            INJECT            |
// +------------------------------+

function inject(bot_) {
    bot = bot_;
}

// +------------------------------+
// |       DATA STRUCTURES        |
// +------------------------------+

const _COMMAND_STRUCTURE = {
    command: {
        optional: false,
        testValid: (command) => _testType({ command }, "string", "Command name"),
    },
    args: {
        optional: true,
        defaultValue: [],
        testValid: (args) => {
            _testType({ args }, "object", "Command property");

            for (const arg of args) {
                _testType({ arg }, "object", "Argument");
                _testAndCreateValidStructure(arg, _ARG_STRUCTURE, "Argument");
            }
        },
    },
    description: {
        optional: true,
        defaultValue: "No description",
        testValid: (description) => _testType({ description }, "string", "Command property"),
    },
    code: {
        optional: false,
        testValid: (code) => _testType({ code }, "function", "Command property"),
    },
    _argInfo: {
        optional: true,
        defaultValue: {},
        testValid: () => true,
    },
};

const _ARG_STRUCTURE = {
    arg: {
        optional: false,
        testValid: (arg) => _testType({ arg }, "string", "Argument name"),
    },
    description: {
        optional: true,
        defaultValue: "No description",
        testValid: (description) => _testType({ description }, "string", "Argument property"),
    },
    optional: {
        optional: true,
        defaultValue: false,
        testValid: (optional) => _testType({ optional }, "boolean", "Argument property"),
    },
    isRest: {
        optional: true,
        defaultValue: false,
        testValid: (isRest) => _testType({ isRest }, "boolean", "Argument property"),
    },
    testValid: {
        optional: true,
        defaultValue: () => true,
        testValid: (testValid) => _testType({ testValid }, "function", "Argument property"),
    },
};

function _testType(valueObj, expectedType, description = "Value") {
    // Test if a value is of the expected type
    // Pass in value as a object { myVar } in order to get the var name

    const varName = Object.keys(valueObj)[0];
    const valueType = typeof valueObj[varName];

    if (valueType !== expectedType) {
        throw new StructureError(
            `${description} '${varName}' expected type ${expectedType}, received type ${valueType}'`
        );
    }
}

function _testAndCreateValidStructure(obj, structure, description) {
    // Takes an object and makes sure all of its properties are correct
    _testType({ obj }, "object", description);

    // Checks if all properties are present and populates them if necessary
    for (const key in structure) {
        if (obj.hasOwnProperty(key)) continue;

        if (!structure[key].optional)
            throw new StructureError(
                `'${key}' is required for ${description}\n'${key}': ${structure[key].description}`
            );

        if (typeof structure[key].defaultValue === "object") {
            if (Array.isArray(structure[key].defaultValue)) {
                obj[key] = [...structure[key].defaultValue]; // shallow copy
            } else {
                obj[key] = Object.assign({}, structure[key].defaultValue); // shallow copy
            }
        } else {
            obj[key] = structure[key].defaultValue;
        }
    }

    // Tests that all values are valid
    for (const key in obj) {
        if (!structure.hasOwnProperty(key)) throw new StructureError(`Unknown key '${key}' for ${description}`);

        structure[key].testValid(obj[key]);
    }
}

// +------------------------------+
// |      COMMAND INFO SETUP      |
// +------------------------------+

function _setArgNumbers(command) {
    // Sets the number of arguments required and optional for a command.
    var numOfRequired = 0;
    var numOfOptional = 0;
    var hasRest = false;

    // Counts the number of required and optional arguments.
    for (const arg of command.args) {
        // Throws an error if the command argument follows a rest argument.
        if (hasRest) throw new StructureError(`'${command.command}' has argument '${arg.arg}' following rest argument`);

        if (arg.isRest) {
            arg.optional = true;
            hasRest = true;
        } else if (arg.optional) numOfOptional++;
        else numOfRequired++;
    }

    // Checks if the number of user defined required arguments are the same as the js ones
    if (numOfRequired !== command.code.length)
        throw new Error(
            `Command '${command.command}' has non matching required arguments. Found ${numOfRequired} required arguments from args, found ${command.code.length} required arguments from code function`
        );

    command._argInfo = {
        required: numOfRequired,
        optional: numOfOptional,
        hasRest: hasRest,
    };
}

// +------------------------------+
// |      COMMAND FUNCTIONS       |
// +------------------------------+

function botChat(message) {
    if (configs.allowBotResponse) bot.chat(configs.chatPrefix + message);
    else console.log("Bot message:", message);
}

function getCommand(commandName) {
    for (const command of allCommands) {
        if (commandName === command.command) {
            return command;
        }
    }
}

function commandNameToString(command) {
    var formattedArgNames = [];

    for (const arg of command.args) {
        formattedArgNames.push(argNameToString(arg));
    }

    return [command.command, ...formattedArgNames].join(" ");
}

function argNameToString(arg) {
    if (arg.isRest) return `[...${arg.arg}]`;
    if (arg.optional) return `[${arg.arg}]`;
    return `<${arg.arg}>`;
}

function _parseArgs(inputArgs) {
    var parsedArgs = [];

    // Converts the arguments into a number or boolean if possible
    for (const arg of inputArgs) {
        const argAsNumber = Number(arg);

        if (!isNaN(argAsNumber)) parsedArgs.push(argAsNumber);
        else if (arg === "true" || arg === "false") parsedArgs.push(arg === "true");
        else parsedArgs.push(arg);
    }

    return parsedArgs;
}

function addCommand(command) {
    _testType({ command }, "object", "Command to add");

    _testAndCreateValidStructure(command, _COMMAND_STRUCTURE, "Command");

    _setArgNumbers(command);

    // Check if a command already exists.
    if (getCommand(command.name)) {
        console.log(`Command '${command.name}' already exists. Overriding...`);
        allCommands = allCommands.filter((otherCommand) => otherCommand.name !== command.name);
    }

    allCommands.push(command);
}

function addCommands(commands) {
    _testType({ commands }, "object", "List of commands to add");

    commands.map(addCommand);
}

function _runCommand(username, message) {
    // Checks wether the command request is valid
    if (configs.whitelist.length !== 0 && !configs.whitelist.includes(username)) return;
    if (configs.blacklist.includes(username)) return;
    if (!message.startsWith(configs.prefix)) return;

    // Removes the prefix from the message.
    message = message.substring(configs.prefix.length);

    const [inputCommand, ...inputArgs] = message.split(" ");

    // Goes through all known commands and tries to run the matching one
    const command = getCommand(inputCommand);

    if (!command) throw new UnknownCommandError(username, message);

    const parsedArgs = _parseArgs(inputArgs);

    const errorInfo = {
        username: username,
        rawMessage: message,
        parsedArgs: parsedArgs,
        command: command,
    };

    // Throws a NotEnoughArgsError if the command does not have more enough arguments.
    if (parsedArgs.length < command._argInfo.required) throw new NotEnoughArgsError(errorInfo);

    // Throws TooManyArgsError if the command has more arguments than possible.
    if (!command._argInfo.hasRest && parsedArgs.length > command._argInfo.required + command._argInfo.optional)
        throw new TooManyArgsError(errorInfo);

    // Tests if all arguments are valid.
    var commandArgIndex = 0;

    for (const arg of parsedArgs) {
        var result = false;
        try {
            result = command.args[commandArgIndex].testValid(arg);
        } catch (err) {
            errorInfo.actualError = err;
        }

        if (result !== true) throw new InvalidArgError(errorInfo, arg);

        if (commandArgIndex < command.args.length) commandArgIndex++;
    }

    // Tries to run the command.
    try {
        command.code(...parsedArgs);
    } catch (err) {
        errorInfo.actualError = err;
        throw new RuntimeError(errorInfo);
    }
}

function runCommand(username, message) {
    try {
        _runCommand(username, message);
    } catch (err) {
        if (!configs.useDefaultErrorHandlers) throw err;

        // default error handlers
        switch (err.constructor) {
            case UnknownCommandError:
                console.log(`Unknown command: '${err.rawMessage}' by '${err.username}`);
                botChat(`Unknown command. Try '${configs.prefix}help' for a list of commands`);
                break;

            case NotEnoughArgsError:
                console.log(
                    `Invalid number of args for '${err.command.command}'. Found ${err.parsedArgs.length}, expected at least ${err.command._argInfo.required}`
                );

                botChat(`Not enough args for command '${err.command.command}'`);
                break;

            case TooManyArgsError:
                console.log(
                    `Invalid number of args for '${err.command.command}'. Found ${
                        err.parsedArgs.length
                    }, expected at most ${err.command._argInfo.required + err.command._argInfo.optional}`
                );

                botChat(`Too many args for command '${err.command.command}'`);
                break;

            case InvalidArgError:
                console.log(`Invalid arg '${err.arg}' for command '${err.command.command}'`);
                if (err.actualError) console.log(err.actualError);

                botChat(`Invalid arg '${err.arg}'`);
                break;

            case RuntimeError:
                console.log(`Error while running command '${err.command.command}'`);
                console.log(err.actualError);
                break;

            default:
                console.log("Unknown error while dealing with runCommand error");
                console.log(err);
                break;
        }
    }
}

// +------------------------------+
// |            OTHER             |
// +------------------------------+

function _addDefaultCommands() {
    addCommands([
        {
            command: "help",
            description: "Displays the help message",
            args: [
                {
                    arg: "command",
                    description: "Name of the command you want info on",
                    optional: true,
                    testValid: (commandName) => typeof getCommand(commandName) !== "undefined",
                },
            ],
            code: (commandName = null) => {
                function logCommandInfo(command) {
                    console.log(`Command: ${commandNameToString(command)}`);
                    console.log(`Description: ${command.description}`);

                    for (const arg of command.args) {
                        console.log();
                        console.log(`     Arg: ${argNameToString(arg)}`);
                        console.log(`     Description: ${arg.description}`);
                    }

                    console.log("\n-----------------");
                }

                // Logs the command info if it is provided
                if (commandName) {
                    const command = getCommand(commandName);
                    logCommandInfo(command);

                    botChat(`Command: '${commandNameToString(command)}'`);
                    botChat(`Description: ${command.description}`);
                    return;
                }

                var commandNameStrings = [];
                for (const command of allCommands) {
                    commandNameStrings.push(`'${commandNameToString(command)}'`);
                    logCommandInfo(command);
                }

                botChat(`Commands: ${commandNameStrings.join(", ")}`);
                botChat("More info displayed in console");
            },
        },
        {
            command: "quit",
            description: "Makes the bot quit",
            code: () => {
                bot.quit();

                console.log("Bot quit");
            },
        },
    ]);
}

_addDefaultCommands();

module.exports = {
    configs,
    allCommands,
    addCommand,
    addCommands,
    runCommand,
    getCommand,
    commandNameToString,
    argNameToString,
    inject,
};
