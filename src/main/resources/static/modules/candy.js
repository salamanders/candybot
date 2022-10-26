import {blockUntilDOMReady} from "./polyfill.js";
import * as STAGE from "./stage.js";
import * as WEBCAM from "./webcam.js";
import * as POSE from "./pose.js";
import * as PARTICLES from "./particles.js";

await blockUntilDOMReady();
await WEBCAM.setup();
STAGE.setup(WEBCAM.video);
await POSE.setup();

const LIFT_MS = 2_000;
const HOLD_OPEN_MS = 5_000;
const LOWER_MS = 2_000;
let lastTriggered = performance.now();

/** @type { DOMHighResTimeStamp[]}  */
const recentCharges = [];
let previousTsMs = performance.now();

function handleErrors(response) {
    if (!response.ok) {
        console.error(response.statusText);
    }
    return response;
}

function signal(message) {
    console.warn(`Sending signal: /move/${message}`);
    fetch('/move', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({action: message})
    })
        .then(handleErrors)
        .then(response => console.info("ok", response.text()))
        .catch(error => console.error(error));
}

function triggerReward() {
    const currentMs = performance.now();
    if (currentMs > lastTriggered + LIFT_MS + HOLD_OPEN_MS + LOWER_MS) {
        lastTriggered = currentMs;
        console.warn('Successful triggering!  Starting lift, hold, close sequence.');
        setTimeout(() => signal('forward'), 0);
        setTimeout(() => signal('stop'), LIFT_MS);
        setTimeout(() => signal('backward'), LIFT_MS + HOLD_OPEN_MS);
        setTimeout(() => signal('stop'), LIFT_MS + HOLD_OPEN_MS + LOWER_MS);
    } else {
        console.debug("Skipping trigger, still acting on last.");
    }
}

/** @param { DOMHighResTimeStamp} tsMs */
async function frameUpdates(tsMs) {
    STAGE.ctx.globalAlpha = 1;
    WEBCAM.draw(STAGE.ctx)

    STAGE.ctx.globalAlpha = .5;
    const poses = await POSE.estimatePoses(WEBCAM.video);

    ['left', 'right'].forEach(side => {
        const wrist = `${side}_wrist`;
        const elbow = `${side}_elbow`;
        poses?.filter(pose => pose[wrist] && pose[elbow]).forEach(pose => {
            STAGE.ctx.beginPath();
            STAGE.ctx.moveTo(pose[elbow].x, pose[elbow].y);
            STAGE.ctx.lineTo(pose[wrist].x, pose[wrist].y);
            STAGE.ctx.stroke();

            // If wrist is above (lower y) than elbow
            if (pose[wrist].y < pose[elbow].y) {
                PARTICLES.spawn(pose[wrist].x, pose[wrist].y);
                recentCharges.unshift(tsMs);
                recentCharges.length = 3;
                if(recentCharges[2] > tsMs - 1_000) {
                    recentCharges.length = 0;
                    triggerReward();
                } else {
                    console.debug("Hands ok, but not triggering.");
                }
            }
        });
    });
    PARTICLES.moveAndDraw(STAGE.ctx);
    previousTsMs = tsMs;
    requestAnimationFrame(frameUpdates);
}

console.info(`Kicking off the animation loop.`);
requestAnimationFrame(frameUpdates);