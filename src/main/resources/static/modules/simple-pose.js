/*jshint esversion: 11 */
/* jshint quotmark: double */
/* jshint forin: true */

/* global poseDetection */

class SimplePose {
    #video;
    #videoOutCtx;
    #socket = null;
    #detector = null;
    /** @type {boolean} */
    poseLoop = true;

    constructor() {
        this.#video = document.getElementById("video");
        this.#video.onloadedmetadata = () => {
            console.info("videoWidth:", this.#video.videoWidth);
            console.info("videoHeight:", this.#video.videoHeight);
        };
        /** @type {HTMLCanvasElement} */
        const videoOut = document.getElementById("canvas");
        /** @type {CanvasRenderingContext2D} */
        this.#videoOutCtx = videoOut.getContext("2d");
    }

    async run() {
        await Promise.all([
            this.#startVideoStream(),
            this.#createPoseDetector(),
            this.#openServerCommunication()]);
        this.#estimatePoses();
    }

    /**
     * @param {MediaStreamConstraints} constraints
     */
    async #startVideoStream(constraints = {
        video: {
            width: {ideal: 360},
            height: {ideal: 270},
            facingMode: {ideal: "user"},
            frameRate: {ideal: 5},
            zoom: true
        }
    }) {
        console.time("#startVideoStream");
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw "Unable to reach navigator.mediaDevices.getUserMedia";
        }
        /** @const {MediaStream} */
        this.#video.srcObject = await navigator.mediaDevices.getUserMedia(constraints);

        const [track] = this.#video.srcObject.getVideoTracks();
        const capabilities = track.getCapabilities();
        const settings = track.getSettings();
        if ("zoom" in settings) {
            console.warn("zoom is supported yay!  Zooming out.");
            await track.applyConstraints({advanced: [{zoom: capabilities.zoom.min}]});
        }
        await this.#video.play();
        console.timeEnd("#startVideoStream");
    }

    async #createPoseDetector() {
        console.time("#createPoseDetector");
        const detectorConfig = {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableTracking: true,
            trackerType: poseDetection.TrackerType.BoundingBox
        };
        this.#detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
        console.timeEnd("#createPoseDetector");
    }

    #estimatePoses() {
        if (!this.poseLoop) {
            console.warn("poseLoop is false, forcing estimatePoses ending.")
            return;
        }
        // Use setTimeout to avoid overrun on slow devices.
        setTimeout(async () => {
            // console.time("detector.estimatePoses(video)");
            const poses = await this.#detector.estimatePoses(video);
            if (poses && poses[0] && poses[0].keypoints && poses[0].keypoints.length > 0) {
                this.#processKeypoints(poses[0].keypoints);
            } else {
                console.debug("No pose found, skipping.");
            }
            this.#estimatePoses();
        }, 250);
    }

    /**
     * @param {{score: number, x: number, y:number, name: string}[]} keypoints
     */
    #processKeypoints(keypoints) {
        this.#videoOutCtx.canvas.width = window.innerWidth;
        const videoToCanvasScale = this.#videoOutCtx.canvas.width / this.#video.videoWidth;
        this.#videoOutCtx.drawImage(this.#video, 0, 0, this.#videoOutCtx.canvas.width, this.#video.videoHeight * videoToCanvasScale);
        this.#videoOutCtx.font = "1em sans-serif";
        this.#videoOutCtx.fillStyle = "#00ffff";
        this.#videoOutCtx.strokeStyle = "#00ffff";
        this.#videoOutCtx.lineWidth = 2;
        console.debug(`Scale:${videoToCanvasScale}`);

        keypoints.filter(({score}) => score >= 0.3).forEach(({x, y, name}) => {
            const realX = x * videoToCanvasScale;
            const realY = y * videoToCanvasScale;
            this.#videoOutCtx.fillText(name, realX, realY);
            // console.log(`(${Math.round(x)}, ${Math.round(y)}) ${name} = ${Math.round((score + Number.EPSILON) * 100) / 100}`);
        });

        SimplePose.CONNECTED_PAIRS
            .filter(([p1, p2]) => keypoints[p1].score >= 0.3 && keypoints[p2].score >= 0.3)
            .forEach(([p1, p2]) => {
                this.#videoOutCtx.beginPath();
                this.#videoOutCtx.moveTo(keypoints[p1].x * videoToCanvasScale, keypoints[p1].y * videoToCanvasScale);
                this.#videoOutCtx.lineTo(keypoints[p2].x * videoToCanvasScale, keypoints[p2].y * videoToCanvasScale);
                this.#videoOutCtx.stroke();
            });

        if (this.#socket && this.#socket.readyState === WebSocket.OPEN) {
            const poseAsString = JSON.stringify(keypoints, (key, val) => {
                // round the long decimals to ints
                return val.toFixed ? Number(val.toFixed(0)) : val;
            });
            this.#socket.send(poseAsString);
        } else {
            console.warn("[websocket] Not ready, skipped message.");
        }
    }

    async #openServerCommunication() {
        this.#socket = new WebSocket(location.origin.replace(/^http/, "ws") + "/ws");

        this.#socket.onopen = () => {
            console.info("[websocket open] Connection established");
        };

        this.#socket.onmessage = event => {
            console.debug(`[websocket message] ${event.data}`);
        };

        this.#socket.onclose = event => {
            if (event.wasClean) {
                console.info(`[websocket close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                console.error("[websocket close] Connection died");
            }
        };

        this.#socket.onerror = error => {
            console.error(`[websocket error] ${error.message}`);
        };
    }
}

// From the demo
SimplePose.CONNECTED_PAIRS = [
    [0, 1], [0, 2], [1, 3], [2, 4], [5, 6], [5, 7], [5, 11], [6, 8], [6, 12],
    [7, 9], [8, 10], [11, 12], [11, 13], [12, 14], [13, 15], [14, 16]
];

export {SimplePose};

