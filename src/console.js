/**
 * Created Date: Aug 04 2022, 06:48:40 PM
 * Author: @WhoTho#9592 whotho06@gmail.com
 * -----
 * Last Modified: Aug 04 2022, 07:13:58 PM
 * Modified By: @WhoTho#9592
 * -----
 * CHANGE LOG:
 * Date                        | Comments
 * ----------------------------+---------------------------------------------
 */

async function inject(runCommand) {
    const readline = require("readline");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    /* -------------------------------------------------------------------------- */
    /*                                  QUESTION                                  */
    /* -------------------------------------------------------------------------- */

    while (true) {
        const answer = await new Promise((resolve) => {
            rl.question("", resolve);
        });

        try {
            runCommand("[CONSOLE]", answer, true);
        } catch (err) {
            console.log(err);
        }
    }
}

module.exports = inject;
