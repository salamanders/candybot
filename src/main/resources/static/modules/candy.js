import {blockUntilDOMReady, countOf} from "./polyfill.js";
import * as STAGE from "./stage.js";
import * as WEBCAM from "./webcam.js";
import * as POSE from "./pose.js";
import * as PARTICLES from "./particles.js";
import {SpriteMap} from "./sprite-map.js";

await blockUntilDOMReady();
await WEBCAM.setup();
STAGE.setup();
STAGE.setVideo(WEBCAM.video);
await POSE.setup();

const INSTRUCTIONS_UP = "⬆";

const sigil = new SpriteMap('/img/sigil_256.png', {
    numTilesX: 1,
    numTilesY: 1,
    frameDelayMs: 10_000,
    scale: .25,
});
await sigil.load();

const SEQUENCE_DURATION = 8_000;

let lastTriggered = performance.now();

/** @type {Array<Object>}  */
const recentHistory = [];
const MAX_HISTORY_AGE_MS = 10_000;

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
    if (currentMs > lastTriggered + SEQUENCE_DURATION) {
        lastTriggered = currentMs;
        console.warn('Successful triggering!  Starting lift, hold, close sequence.');
        signal('OPEN_HOLD_CLOSE');
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
                console.debug(`spawn`, side);
                PARTICLES.spawn(pose[wrist].x, pose[wrist].y);
            } else {
                STAGE.ctx.globalAlpha = 0.5;
                STAGE.ctx.fillText(INSTRUCTIONS_UP, pose[wrist].x, pose[wrist].y);
            }
        });
    });

    recentHistory.unshift({
        "ts": tsMs,
        "hit": anyHandAboveElbow,
    });
    // crop to last MAX_HISTORY_AGE_MS
    const tooOld = recentHistory.findIndex(charge => charge?.ts < tsMs - MAX_HISTORY_AGE_MS);
    if (tooOld > -1) {
        recentHistory.length = tooOld;
    }
    // See if enough hits in last second

    const positiveHits = countOf(recentHistory, charge => charge?.ts > tsMs - 1_000 && charge.hit);
    if (positiveHits > 3) {
        triggerReward();
    }

    PARTICLES.moveAndDraw(STAGE.ctx);
    requestAnimationFrame(frameUpdates);
}

console.info(`Kicking off the animation loop.`);
requestAnimationFrame(frameUpdates);