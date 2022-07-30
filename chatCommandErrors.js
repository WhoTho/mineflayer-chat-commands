/*
Created by @WhoTho#9592

lol i don't know how to make a good error system

*/

class StructureError extends Error {}

class ChatCommandError extends Error {
    constructor(errorInfo, message = "Chat command error") {
        super(message);

        this.name = this.constructor.name;
        this.username = errorInfo.username;
        this.rawMessage = errorInfo.rawMessage;
        this.parsedArgs = errorInfo.parsedArgs;
        this.command = errorInfo.command;
        this.actualError = errorInfo.actualError;
    }
}

class UnknownCommandError extends ChatCommandError {
    constructor(username, rawMessage) {
        super({ username, rawMessage });
    }
}

class NotEnoughArgsError extends ChatCommandError {}

class TooManyArgsError extends ChatCommandError {}

class InvalidArgError extends ChatCommandError {
    constructor(errorInfo, arg) {
        super(errorInfo);

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
