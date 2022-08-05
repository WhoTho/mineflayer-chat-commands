/**
 * Created Date: Jul 31 2022, 10:30:23 AM
 * Author: @WhoTho#9592 whotho06@gmail.com
 * -----
 * Last Modified: Aug 05 2022, 12:22:02 AM
 * Modified By: @WhoTho#9592
 * -----
 * CHANGE LOG:
 * Date                        | Comments
 * ----------------------------+---------------------------------------------
 * Aug 04 2022, 08:20:59 PM    | console support
 * Aug 04 2022, 06:45:31 PM    | Changed file name from chatCommandErrors to errors
 */

/* -------------------------------------------------------------------------- */
/*                                   ERRORS                                   */
/* -------------------------------------------------------------------------- */

class StructureError extends Error {}

class ChatCommandError extends Error {
    constructor(errorInfo, message = "Chat command error") {
        super(message);

        this.name = this.constructor.name;
        this.caller = {
            username: errorInfo.caller.username,
            message: errorInfo.caller.message,
            isConsole: errorInfo.caller.isConsole,
        };

        this.parsedArgs = errorInfo.parsedArgs;
        this.command = errorInfo.command;
        this.error = errorInfo.error;
    }
}

class UnknownCommandError extends ChatCommandError {
    constructor(username, message, isConsole, message_) {
        super({ caller: { username, message, isConsole } }, message_);
    }
}

class AccessDeniedError extends ChatCommandError {}

class NotEnoughArgsError extends ChatCommandError {}

class TooManyArgsError extends ChatCommandError {}

class InvalidArgError extends ChatCommandError {
    constructor(errorInfo, arg, message) {
        super(errorInfo, message);

        this.arg = arg;
    }
}

class RuntimeError extends ChatCommandError {}

module.exports = {
    UnknownCommandError,
    AccessDeniedError,
    NotEnoughArgsError,
    TooManyArgsError,
    InvalidArgError,
    RuntimeError,
    StructureError,
};
