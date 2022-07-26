/*jshint esversion: 11 */
/* jshint quotmark: double */
/* jshint forin: true */
/* global poseDetection */

const video = document.getElementById("video");
const videoOut = document.getElementById("canvas");
const videoOutCtx = videoOut.getContext("2d");
let socket = null;

let detector = null;

/**
 * @param {MediaStreamConstraints} constraints
 * @return {MediaStream}
 */
async function startVideoStream(constraints = {
    video: {
        width: {
            min: 320,
            max: 640
        },
        height: {
            min: 240,
            max: 480
        },
        zoom: true
    }
}) {
    console.debug("startVideoStream()");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw "Unable to reach navigator.mediaDevices.getUserMedia";
    }
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    const readyStream = new Promise((resolve) =>
        video.onloadeddata = () => {
            resolve(video.srcObject);
        }
    );
    video.srcObject = mediaStream;

    const [track] = mediaStream.getVideoTracks();
    const capabilities = track.getCapabilities();
    const settings = track.getSettings();
    if ("zoom" in settings) {
        console.info("zoom is supported yay!  Zooming out.");
        await track.applyConstraints({advanced: [{zoom: capabilities.zoom.min}]});
    }
    await video.play();
    video.onloadedmetadata = () => {
        console.log("videoWidth:", this.videoWidth);
        console.log("videoHeight:", this.videoHeight);
    };
    return readyStream;
}

const timer = ms => new Promise(res => setTimeout(res, ms));

async function estimatePoses() {
    videoOutCtx.font = "1em sans-serif";
    videoOutCtx.fillStyle = "#00ffff";
    for (let i = 0; i < 1000000000; i++) {
        const startMs = performance.now();
        console.time("detector.estimatePoses(video)");
        const poses = await detector.estimatePoses(video);
        console.timeEnd("detector.estimatePoses(video)");
        videoOutCtx.drawImage(video, 0, 0, 640, 480);
        poses[0].keypoints.filter(({score}) => score >= 0.3).forEach(({x, y, score, name}) => {
            videoOutCtx.fillText(name, x, y);
            console.log(`(${Math.round(x)}, ${Math.round(y)}) ${name} = ${Math.round((score + Number.EPSILON) * 100) / 100}`);
        });
        sendToServer(JSON.stringify(poses[0].keypoints));
        const endMs = performance.now();
        const timeToWait = 250 - (endMs - startMs);
        if (timeToWait > 0) {
            await timer(timeToWait);
        }
    }
}

async function startPoseRecognition() {
    console.debug("startPoseRecognition()");
    await startVideoStream();

    const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableTracking: true,
        trackerType: poseDetection.TrackerType.BoundingBox
    };
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
    estimatePoses().then(() => console.log("Done with poses."));
}

function sendToServer(pose) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(pose);
    } else {
        console.warn("[websocket] Not ready, skipped message.");
    }
}

function openServerCommunication() {
    socket = new WebSocket(location.origin.replace(/^http/, "ws") + "/ws");

    socket.onopen = () => {
        console.info("[websocket open] Connection established");
    };

    socket.onmessage = event => {
        console.info(`[websocket message] ${event.data}`);
    };

    socket.onclose = event => {
        if (event.wasClean) {
            console.info(`[websocket close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            // e.g. server process killed or network down
            // event.code is usually 1006 in this case
            console.error("[websocket close] Connection died");
        }
    };

    socket.onerror = error => {
        console.error(`[websocket error] ${error.message}`);
    };
}

export {startPoseRecognition, openServerCommunication};

