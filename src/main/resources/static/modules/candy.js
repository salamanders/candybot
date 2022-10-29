import {blockUntilDOMReady} from "./polyfill.js";
import * as STAGE from "./stage.js";
import * as WEBCAM from "./webcam.js";
import * as POSE from "./pose.js";
import * as PARTICLES from "./particles.js";
import {SpriteMap} from "./sprite-map.js";

await blockUntilDOMReady();
await WEBCAM.setup();
STAGE.setup(WEBCAM.video);
await POSE.setup();


const sigil = new SpriteMap('/img/sigil_128.png', {
    numTilesX: 1,
    numTilesY: 1,
    frameDelayMs: 10_000,
    scale: .25,
});
await sigil.load();

const LIFT_MS = 2_000;
const HOLD_OPEN_MS = 5_000;
const LOWER_MS = 2_000;

let lastTriggered = performance.now();

/** @type {Array<Object>}  */
const recentCharges = [];

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

    const poses = await POSE.estimatePoses(WEBCAM.video);

    let anyHandAboveElbow = false;
    ['left', 'right'].forEach(side => {
        const wrist = `${side}_wrist`;
        const elbow = `${side}_elbow`;
        poses?.filter(pose => pose[wrist] && pose[elbow]).forEach(pose => {
            STAGE.ctx.globalAlpha = .5;
            STAGE.ctx.beginPath();
            STAGE.ctx.moveTo(pose[elbow].x, pose[elbow].y);
            STAGE.ctx.lineTo(pose[wrist].x, pose[wrist].y);
            STAGE.ctx.stroke();

            sigil.drawSprite(STAGE.ctx, pose[wrist].x, pose[wrist].y, tsMs);

            // If wrist is above (lower y) than elbow
            if (pose[wrist].y < pose[elbow].y) {
                anyHandAboveElbow = true;
                PARTICLES.spawn(pose[wrist].x, pose[wrist].y);
            }
        });
    });

    recentCharges.unshift({
        "ts": tsMs,
        "hit": anyHandAboveElbow,
    });
    // crop to last 1 second
    const tooOld = recentCharges.findIndex(charge => charge?.ts < tsMs - 1_000);
    if (tooOld > -1) {
        recentCharges.length = tooOld;
    }
    // See if enough hits in last second
    const positiveHits = recentCharges.filter(charge => charge.hit);
    if (positiveHits > 3) {
        recentCharges.length = 0;
        triggerReward();
    }
    recentCharges.length = 3;

    PARTICLES.moveAndDraw(STAGE.ctx);
    requestAnimationFrame(frameUpdates);
}

console.info(`Kicking off the animation loop.`);
requestAnimationFrame(frameUpdates);