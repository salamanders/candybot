/*jshint esversion: 11 */
/* jshint quotmark: double */
/* jshint forin: true */

/* global poseDetection */

import {RateLimit} from "./rate-limit.js";

class SimplePose {
    #video;
    /** @type {CanvasRenderingContext2D} */
    #videoOutCtx;
    #socket = null;
    #detector = null;
    #sourceDimensions = {width: 360, height: 270};
    #displayDimensions = {width: 720, height: 540, scale: 2};
    /** @type {RateLimit} */
    #looper;

    constructor() {
        this.#video = document.getElementById("video");
        this.#video.onloadedmetadata = () => {
            console.info("video.onloadedmetadata")
            console.info("videoWidth:", this.#video.videoWidth);
            console.info("videoHeight:", this.#video.videoHeight);
            this.#updateDimensions();
        };
        /** @type {HTMLCanvasElement} */
        const videoOut = document.getElementById("canvas");
        this.#videoOutCtx = videoOut.getContext("2d");
        screen.orientation.onchange = () => {
            console.info("screen.orientation.onchange")
            this.#updateDimensions();
        };
        window.onresize = () => {
            console.info("window.onresize")
            this.#updateDimensions();
        };
    }

    /**
     * Rescale everything based on source dimensions and display width
     * TODO: Max Height
     */
    #updateDimensions() {
        this.#sourceDimensions.width = this.#video.videoWidth;
        this.#sourceDimensions.height = this.#video.videoHeight;
        this.#displayDimensions.width = window.innerWidth;

        this.#displayDimensions.scale = this.#displayDimensions.width / this.#sourceDimensions.width;
        this.#displayDimensions.height = this.#sourceDimensions.height * this.#displayDimensions.scale;

        this.#videoOutCtx.canvas.width = this.#displayDimensions.width;
        this.#videoOutCtx.canvas.height = this.#displayDimensions.height;

        console.info("Source:", this.#sourceDimensions);
        console.info("Display:", this.#displayDimensions);
    }

    async run() {
        await Promise.all([this.#startVideoStream(), this.#createPoseDetector(), this.#openServerCommunication()]);
        this.#updateDimensions();
        this.#looper = new RateLimit(async ()=> { await this.#estimatePoses() }, .2, 100);
        await this.#looper.run();
    }

    /**
     * @param {MediaStreamConstraints} constraints
     */
    async #startVideoStream(constraints = {
        video: {
            width: {ideal: this.#sourceDimensions.width},
            height: {ideal: this.#sourceDimensions.height},
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
            modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
            enableTracking: true,
            trackerType: poseDetection.TrackerType.BoundingBox
        };
        this.#detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
        console.timeEnd("#createPoseDetector");
    }

    async #estimatePoses() {
        const poses = await this.#detector.estimatePoses(video);
        this.#videoOutCtx.drawImage(this.#video, 0, 0, this.#displayDimensions.width, this.#displayDimensions.height);
        this.#videoOutCtx.fillText(`${Math.round(this.#looper.totalTimeMs)}ms`, 0, 0);
        if (poses && poses[0] && poses[0].keypoints && poses[0].keypoints.length > 0) {
            this.#displayKeypoints(poses[0].keypoints);
            this.#logKeypoints(poses[0].keypoints);
        } else {
            console.debug("No pose found, skipping.");
        }
    }

    /**
     * @param {{score: number, x: number, y:number, name: string}[]} keypoints
     */
    #displayKeypoints(keypoints) {
        this.#videoOutCtx.font = "2em sans-serif";
        this.#videoOutCtx.fillStyle = "#00ffff";
        this.#videoOutCtx.strokeStyle = "#00ffff";
        this.#videoOutCtx.textBaseline = "top";
        this.#videoOutCtx.lineWidth = 2;

        // Draw the named points
        keypoints.filter(({score}) => score >= 0.3).forEach(({x, y, name}) => {
            const realX = x * this.#displayDimensions.scale;
            const realY = y * this.#displayDimensions.scale;
            this.#videoOutCtx.fillText(name, realX, realY);
            // console.log(`(${Math.round(x)}, ${Math.round(y)}) ${name} = ${Math.round((score + Number.EPSILON) * 100) / 100}`);
        });

        // Draw the Skeleton
        SimplePose.CONNECTED_PAIRS
            .filter(([p1, p2]) => keypoints[p1].score >= 0.3 && keypoints[p2].score >= 0.3)
            .forEach(([p1, p2]) => {
                this.#videoOutCtx.beginPath();
                this.#videoOutCtx.moveTo(keypoints[p1].x * this.#displayDimensions.scale, keypoints[p1].y * this.#displayDimensions.scale);
                this.#videoOutCtx.lineTo(keypoints[p2].x * this.#displayDimensions.scale, keypoints[p2].y * this.#displayDimensions.scale);
                this.#videoOutCtx.stroke();
            });
    }

    /**
     * @param {{score: number, x: number, y:number, name: string}[]} keypoints
     */
    #logKeypoints(keypoints) {
        if (this.#socket && this.#socket.readyState === WebSocket.OPEN) {
            const poseAsString = JSON.stringify(keypoints, (key, val) => {
                // round the long decimals to int
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
SimplePose.CONNECTED_PAIRS = [[0, 1], [0, 2], [1, 3], [2, 4], [5, 6], [5, 7], [5, 11], [6, 8], [6, 12], [7, 9], [8, 10], [11, 12], [11, 13], [12, 14], [13, 15], [14, 16]];

export {SimplePose};

