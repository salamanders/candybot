/*jshint esversion: 8 */

import {SimplePose} from '/modules/simple-pose.js';

/*
async function fullscreen() {
    try {
        console.log("Trying to go to fullscreen");
        const canvas = document.getElementById("canvas");
        await canvas.requestFullscreen();
    } catch (error) {
        console.error("Problem with fullscreen", error);
    } finally {
        console.log("Done with fullscreen attempt");
    }
}
fullscreen().then(() => "Done with fullscreen 2.");
*/

const sp = new SimplePose();
await sp.run();