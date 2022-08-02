/*
Created by @WhoTho#9592

lol i don't know how to make a good error system

*/

class StructureError extends Error {}

class ChatCommandError extends Error {
    constructor(errorInfo, message = "Chat command error") {
        super(message);

        this.name = this.constructor.name;
        this.caller = {
            username: errorInfo.caller.username,
            message: errorInfo.caller.message,
        };

        this.parsedArgs = errorInfo.parsedArgs;
        this.command = errorInfo.command;
        this.error = errorInfo.error;
    }
}

class UnknownCommandError extends ChatCommandError {
    constructor(username, message, message_) {
        super({ caller: { username, message } }, message_);
    }
}

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
    NotEnoughArgsError,
    TooManyArgsError,
    InvalidArgError,
    RuntimeError,
    StructureError,
};
