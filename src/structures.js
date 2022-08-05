/**
 * Created Date: Aug 04 2022, 12:36:05 PM
 * Author: @WhoTho#9592
 * -----
 * Last Modified: Aug 04 2022, 07:15:28 PM
 * Modified By: @WhoTho#9592
 * -----
 * CHANGE LOG:
 * Date                        | Comments
 * ----------------------------+---------------------------------------------
 * Aug 04 2022, 06:45:58 PM    | Changed file name from chatCommandStructures to structures
 * Aug 04 2022, 01:27:15 PM    | Made structure data a separate file
 */

/* -------------------------------------------------------------------------- */
/*                               DATA STRUCTURES                              */
/* -------------------------------------------------------------------------- */

const { StructureError } = require("./errors.js");
const { formatStringArray } = require("./utils.js");

const COMMAND_STRUCTURE = {
    command: {
        optional: false,
        testValid: (command) => testType({ command }, "string", "Command name"),
    },
    aliases: {
        optional: true,
        defaultValue: [],
        testValid: (aliases) => {
            testType({ aliases }, "object", "Command aliases");

            if (!Array.isArray(aliases))
                throw new StructureError(`Command aliases expected type array, received type object'`);

            for (const alias of aliases) {
                testType({ alias }, "string", "Command alias");
            }
        },
    },
    consoleOnly: {
        optional: true,
        defaultValue: false,
        testValid: (consoleOnly) => testType({ consoleOnly }, "boolean", "Console only"),
    },
    args: {
        optional: true,
        defaultValue: [],
        testValid: (args) => {
            testType({ args }, "object", "Command property");

            for (const arg of args) {
                testType({ arg }, "object", "Argument");
                testAndCreateValidStructure(arg, ARG_STRUCTURE, "Argument");
            }
        },
    },
    description: {
        optional: true,
        defaultValue: "No description",
        testValid: (description) => testType({ description }, "string", "Command property"),
    },
    code: {
        optional: false,
        testValid: (code) => testType({ code }, "function", "Command property"),
    },
    onFail: {
        optional: true,
        defaultValue: (err) => {
            throw err;
        },
        testValid: () => true,
    },
    _argInfo: {
        optional: true,
        defaultValue: {},
        testValid: () => true,
    },
};

const ARG_STRUCTURE = {
    arg: {
        optional: false,
        testValid: (arg) => testType({ arg }, "string", "Argument name"),
    },
    description: {
        optional: true,
        defaultValue: "No description",
        testValid: (description) => testType({ description }, "string", "Argument property"),
    },
    optional: {
        optional: true,
        defaultValue: false,
        testValid: (optional) => testType({ optional }, "boolean", "Argument property"),
    },
    isRest: {
        optional: true,
        defaultValue: false,
        testValid: (isRest) => testType({ isRest }, "boolean", "Argument property"),
    },
    testValid: {
        optional: true,
        defaultValue: () => true,
        testValid: (testValid) => testType({ testValid }, "function", "Argument property"),
    },
    onFail: {
        optional: true,
        defaultValue: (err) => {
            throw err;
        },
        testValid: () => true,
    },
};

/* -------------------------------------------------------------------------- */
/*                               DATA FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

function testType(valueObj, expectedType, description = "Value") {
    // Test if a value is of the expected type
    // Pass in value as a object { myVar } in order to get the var name

    // Makes expectedType a list
    if (typeof expectedType === "string") {
        expectedType = [expectedType];
    }

    const varName = Object.keys(valueObj)[0];
    const valueType = typeof valueObj[varName];

    if (!expectedType.includes(valueType)) {
        throw new StructureError(
            `${description} '${varName}' expected type(s) ${formatStringArray(
                expectedType,
                "or"
            )}, received type ${valueType}`
        );
    }
}

function testAndCreateValidStructure(obj, structure, description) {
    // Takes an object and makes sure all of its properties are correct
    testType({ obj }, "object", description);

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

module.exports = {
    testType,
    testAndCreateValidStructure,
    COMMAND_STRUCTURE,
    ARG_STRUCTURE,
};
