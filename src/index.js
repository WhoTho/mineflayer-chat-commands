/**
 * Created Date: Jul 31 2022, 10:30:23 AM
 * Author: @WhoTho#9592 whotho06@gmail.com
 * -----
 * Last Modified: Aug 04 2022, 11:30:38 PM
 * Modified By: @WhoTho#9592
 * -----
 * CHANGE LOG:
 * Date                        | Comments
 * ----------------------------+---------------------------------------------
 * Aug 04 2022, 08:21:51 PM    | consoleOnly support
 * Aug 04 2022, 07:10:30 PM    | Added console interface
 */

const {
    UnknownCommandError,
    NotEnoughArgsError,
    TooManyArgsError,
    InvalidArgError,
    RuntimeError,
    StructureError,
    AccessDeniedError,
} = require("./errors.js");

const { testType, testAndCreateValidStructure, COMMAND_STRUCTURE, ARG_STRUCTURE } = require("./structures.js");

const { formatStringArray } = require("./utils.js");

function inject(bot) {
    // Opens console interface allowed
    if (inject.allowConsole) require("./console")(runCommand);

    /* -------------------------------------------------------------------------- */
    /*                                  BOT VARS                                  */
    /* -------------------------------------------------------------------------- */

    var configs = {
        prefix: "#",
        chatPrefix: "",
        whitelist: [],
        blacklist: [],
        useDefaultErrorHandlers: true,
        allowBotChat: true,
    };

    var allCommands = [];

    bot.chatCommands = {
        configs: configs,
        allCommands: allCommands,
        addCommand: addCommand,
        addCommands: addCommands,
        runCommand: runCommand,
        getCommand: getCommand,
        getAllNames: getAllNames,
        commandNameToString: commandNameToString,
        argNameToString: argNameToString,
    };

    /* -------------------------------------------------------------------------- */
    /*                             COMMAND INFO SETUP                             */
    /* -------------------------------------------------------------------------- */

    function setArgNumbers(command) {
        // Sets the number of arguments required and optional for a command.
        var numOfRequired = 0;
        var numOfOptional = 0;
        var hasRest = false;

        // Counts the number of required and optional arguments.
        for (const arg of command.args) {
            // Throws an error if the command argument follows a rest argument.
            if (hasRest)
                throw new StructureError(`'${command.command}' has argument '${arg.arg}' following rest argument`);

            if (arg.isRest) {
                arg.optional = true;
                hasRest = true;
            } else if (arg.optional) numOfOptional++;
            else numOfRequired++;
        }

        // Checks if the number of user defined required arguments are the same as the js ones
        if (
            !(numOfRequired === 0 && command.code.length <= 1) &&
            !(numOfRequired !== 0 && numOfRequired === command.code.length - 1)
        )
            throw new StructureError(
                `Command '${command.command}' has non matching required arguments. Found ${numOfRequired} required arguments from args, found ${command.code.length} required arguments from code function. (Caller username and message is passed to the function)`
            );

        command._argInfo = {
            required: numOfRequired,
            optional: numOfOptional,
            hasRest: hasRest,
        };
    }

    /* -------------------------------------------------------------------------- */
    /*                              COMMAND FUNCTIONS                             */
    /* -------------------------------------------------------------------------- */

    function botChat(message, isConsole = false) {
        if (!isConsole && configs.allowBotChat) bot.chat(configs.chatPrefix + message);
        else console.log("Bot chat:", message);
    }

    function getCommand(name) {
        return allCommands.find((command) => getAllNames(command).includes(name));
    }

    function getAllNames(command) {
        return command.aliases.concat(command.command);
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

    function parseArgs(inputArgs) {
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
        testType({ command }, "object", "Command to add");

        testAndCreateValidStructure(command, COMMAND_STRUCTURE, "Command");

        setArgNumbers(command);

        // Check if a command name or aliases already exist and discard all commands that have a conflict

        const allCommandNames = getAllNames(command);
        const duplicateCommands = [...new Set(allCommandNames.map((name) => getCommand(name)).filter(Boolean))];

        if (duplicateCommands.length) {
            // Find common names
            const duplicateCommandNames = duplicateCommands.map((e) => e.command);
            const commonNames = duplicateCommands.flatMap(getAllNames).filter((name) => allCommandNames.includes(name));

            console.log(
                `Command '${command.command}' has a naming conflict with command(s) ${formatStringArray(
                    duplicateCommandNames
                )}. Conflicting names: ${formatStringArray(commonNames)}. Overwriting...`
            );

            allCommands = allCommands.filter((command_) => !duplicateCommandNames.includes(command_.command));
        }

        allCommands.push(command);
    }

    function addCommands(commands) {
        testType({ commands }, "object", "List of commands to add");

        commands.map(addCommand);
    }

    function processCommand(username, message, isConsole = false) {
        // Checks wether the command request is valid
        if (!isConsole) {
            if (configs.whitelist.length !== 0 && !configs.whitelist.includes(username)) return;
            if (configs.blacklist.includes(username)) return;
            if (!message.startsWith(configs.prefix)) return;

            // Removes the prefix from the message.
            message = message.substring(configs.prefix.length);
        }

        const [inputCommand, ...inputArgs] = message.split(" ");

        // Goes through all known commands and tries to run the matching one
        const command = getCommand(inputCommand);

        if (!command) throw new UnknownCommandError(username, message, isConsole);

        const parsedArgs = parseArgs(inputArgs);

        const errorInfo = {
            caller: { username, message, isConsole },
            parsedArgs: parsedArgs,
            command: command,
        };

        if (command.consoleOnly && !isConsole) throw new AccessDeniedError(errorInfo);

        // Throws a NotEnoughArgsError if the command does not have more enough arguments.
        if (parsedArgs.length < command._argInfo.required) {
            command.onFail(new NotEnoughArgsError(errorInfo));
            return;
        }

        // Throws TooManyArgsError if the command has more arguments than possible.
        if (!command._argInfo.hasRest && parsedArgs.length > command._argInfo.required + command._argInfo.optional) {
            command.onFail(new TooManyArgsError(errorInfo));
            return;
        }

        // Tests if all arguments are valid.
        var commandArgIndex = 0;

        for (const arg of parsedArgs) {
            var result;

            try {
                result = command.args[commandArgIndex].testValid(arg);
            } catch (err) {
                errorInfo.error = err;
            }

            if (result !== true) {
                command.args[commandArgIndex].onFail(new InvalidArgError(errorInfo, arg));
                return;
            }

            if (commandArgIndex < command.args.length - 1) commandArgIndex++;
        }

        // Tries to run the command.
        try {
            command.code({ username, message }, ...parsedArgs);
        } catch (err) {
            errorInfo.error = err;
            command.onFail(new RuntimeError(errorInfo));
            return;
        }
    }

    function runCommand(username, message, isConsole = false) {
        try {
            processCommand(username, message, isConsole);
        } catch (err) {
            if (!configs.useDefaultErrorHandlers) throw err;

            // default error handlers
            switch (err.constructor) {
                case UnknownCommandError:
                    console.log(`Unknown command: '${err.caller.message}' by '${err.caller.username}'`);

                    botChat(
                        `Unknown command. Try '${configs.prefix}help' for a list of commands`,
                        err.caller.isConsole
                    );
                    break;

                case AccessDeniedError:
                    console.log(`Access denied: '${err.caller.message}' by '${err.caller.username}'`);
                    break;

                case NotEnoughArgsError:
                    console.log(
                        `Invalid number of args for '${err.command.command}'. Found ${err.parsedArgs.length}, expected at least ${err.command._argInfo.required}`
                    );

                    botChat(`Not enough args for command '${err.command.command}'`, err.caller.isConsole);
                    break;

                case TooManyArgsError:
                    console.log(
                        `Invalid number of args for '${err.command.command}'. Found ${
                            err.parsedArgs.length
                        }, expected at most ${err.command._argInfo.required + err.command._argInfo.optional}`
                    );

                    botChat(`Too many args for command '${err.command.command}'`, err.caller.isConsole);
                    break;

                case InvalidArgError:
                    console.log(`Invalid arg '${err.arg}' for command '${err.command.command}'`);
                    if (err.error) console.log(err.error);

                    botChat(`Invalid arg '${err.arg}'`, err.caller.isConsole);
                    break;

                case RuntimeError:
                    console.log(`Error while running command '${err.command.command}'`);
                    console.log(err.error);

                    botChat(`Error while running command '${err.command.command}'`, err.caller.isConsole);
                    break;

                default:
                    console.log("Unknown error while dealing with runCommand error");
                    console.log(err);
                    break;
            }
        }
    }

    /* -------------------------------------------------------------------------- */
    /*                                    OTHER                                   */
    /* -------------------------------------------------------------------------- */

    function addDefaultCommands() {
        addCommands([
            {
                command: "help",
                aliases: ["h"],
                description: "Displays the help message",
                args: [
                    {
                        arg: "command",
                        description: "Name of the command you want info on",
                        optional: true,
                        testValid: (name) => typeof getCommand(name) !== "undefined",
                        onFail: (err) => {
                            console.log(`Unknown command for help message: ${err.parsedArgs[0]}`);
                            console.log(`Try '${configs.prefix}help' for a list of commands`);
                        },
                    },
                ],
                code: (_, name = null) => {
                    function logCommandInfo(command) {
                        console.log();
                        console.log(`Command: ${commandNameToString(command)}`);
                        if (command.aliases.length) console.log(`Aliases: ${formatStringArray(command.aliases)}`);
                        console.log(`Description: ${command.description}`);

                        for (const arg of command.args) {
                            console.log();
                            console.log(`     Arg: ${argNameToString(arg)}`);
                            console.log(`     Description: ${arg.description}`);
                        }

                        console.log("\n-----------------");
                    }

                    // Logs the command info if it is provided
                    if (name) {
                        const command = getCommand(name);
                        logCommandInfo(command);

                        botChat(`Command: '${commandNameToString(command)}'`);
                        if (command.aliases.length) botChat(`Aliases: ${formatStringArray(command.aliases)}`);
                        botChat(`Description: ${command.description}`);
                        return;
                    }

                    var commandNameStrings = [];
                    for (const command of allCommands) {
                        commandNameStrings.push(commandNameToString(command));
                        logCommandInfo(command);
                    }

                    botChat(`Commands: ${formatStringArray(commandNameStrings)}`);
                    botChat("More info displayed in console");
                },
            },
            {
                command: "quit",
                aliases: ["exit"],
                description: "Makes the bot quit",
                code: () => {
                    bot.quit();

                    console.log("Bot quit");
                },
            },
            {
                command: "whitelist",
                description: "Add/remove players to/from the chatCommand whitelist",
                args: [
                    {
                        arg: "add|remove",
                        description: "Wether to 'add' or 'remove' the players from the whitelist",
                        testValid: (operation) => operation === "add" || operation === "remove",
                        onFail: (err) => {
                            console.log(`'operation' argument expected 'add' or 'remove', received '${err.arg}'`);

                            botChat("'operation' argument only accepts 'add' or 'remove'");
                        },
                    },
                    {
                        arg: "usernames",
                        description: "List of usernames",
                        isRest: true,
                    },
                ],
                code: (caller, operation, ...usernames) => {
                    if (operation === "add") {
                        if (configs.whitelist.length === 0 && !usernames.includes(caller.username)) {
                            console.log(
                                `'${caller.username}' ran 'whitelist add' and was automatically added to the whitelist`
                            );
                            configs.whitelist = [caller.username];
                        }

                        configs.whitelist.push(...usernames);
                    } else {
                        configs.whitelist = configs.whitelist.filter((username) => !usernames.includes(username));

                        if (configs.whitelist.length !== 0 && usernames.includes(caller.username)) {
                            console.log(
                                `'${caller.username}' ran 'whitelist remove' and was automatically added back to the whitelist`
                            );
                            configs.whitelist.push(caller.username);
                        }
                    }

                    console.log(`New whitelist: ${formatStringArray(configs.whitelist)}`);

                    botChat(`New whitelist: ${formatStringArray(configs.whitelist)}`);
                },
            },
            {
                command: "blacklist",
                description: "Add/remove players to/from the chatCommand blacklist",
                args: [
                    {
                        arg: "add|remove",
                        description: "Wether to 'add' or 'remove' the players from the blacklist",
                        testValid: (operation) => operation === "add" || operation === "remove",
                        onFail: (err) => {
                            console.log(`'operation' argument expected 'add' or 'remove', received '${err.arg}'`);

                            botChat("'operation' argument only accepts 'add' or 'remove'");
                        },
                    },
                    {
                        arg: "usernames",
                        description: "List of usernames",
                        isRest: true,
                    },
                ],
                code: (caller, operation, ...usernames) => {
                    if (operation === "add") {
                        configs.blacklist.push(...usernames);

                        if (configs.blacklist.length !== 0 && usernames.includes(caller.username)) {
                            console.log(
                                `'${caller.username}' ran 'blacklist add' and was automatically removed from the blacklist additions`
                            );
                            configs.blacklist = configs.blacklist.filter((username) => username !== caller.username);
                        }
                    } else {
                        configs.blacklist = configs.blacklist.filter((username) => !usernames.includes(username));
                    }

                    console.log(`New blacklist: ${formatStringArray(configs.blacklist)}`);

                    botChat(`New blacklist: ${formatStringArray(configs.blacklist)}`);
                },
            },
            {
                command: "code",
                consoleOnly: true,
                description: "Runs code from the console",
                args: [
                    {
                        arg: "code",
                        isRest: true,
                    },
                ],
                code: (_, ...code) => {
                    eval(code.join(" "));
                },
            },
        ]);
    }

    addDefaultCommands();

    setTimeout(() => {
        bot.emit("chat_commands_ready");
    }, 0);
}

module.exports = inject;
