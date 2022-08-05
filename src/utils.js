/**
 * Created Date: Aug 01 2022, 01:03:34 PM
 * Author: @WhoTho#9592 whotho06@gmail.com
 * -----
 * Last Modified: Aug 04 2022, 01:17:09 PM
 * Modified By: @WhoTho#9592
 * -----
 * CHANGE LOG:
 * Date                        | Comments
 * ----------------------------+---------------------------------------------
 */

// Turn a list of strings into 'e1', 'e2', and 'e3'
function formatStringArray(list, joinWord = "and") {
    // Checks if it needs to add the ''
    const formattedStrings = list.map((e) => (e.startsWith("'") ? e : `'${e}'`));

    if (formattedStrings.length == 0) return "None";
    if (formattedStrings.length < 2) return formattedStrings.join(` ${joinWord} `);
    return formattedStrings.slice(0, -1).join(", ") + `, ${joinWord} ` + formattedStrings.at(-1);
}

module.exports = {
    formatStringArray,
};
