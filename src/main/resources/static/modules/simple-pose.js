/* jshint esversion: 11 */
/* jshint quotmark: double */
/* jshint forin: true */

/* global poseDetection */

import {RateLimit} from "./rate-limit.js";
import {SimpleVideo} from "./simple-video.js";

class SimplePose extends SimpleVideo {
    #detector = null;

    /** @type {RateLimit} */
    #looper;

    async run() {
        await Promise.all([super.run(), this.#createPoseDetector()]);
        this.updateDimensions();
        this.#looper = new RateLimit(async () => {
            await this.#estimatePoses()
        }, .2, 100);
        await this.#looper.run();
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
        this.videoOutCtx.drawImage(this.video, 0, 0, this.displayDimensions.width, this.displayDimensions.height);
        this.videoOutCtx.fillText(`${Math.round(this.#looper.totalTimeMs)}ms`, 0, 0);
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
        this.videoOutCtx.font = "1em sans-serif";
        this.videoOutCtx.fillStyle = "#00ffff";
        this.videoOutCtx.strokeStyle = "#00ffff";
        this.videoOutCtx.textBaseline = "top";
        this.videoOutCtx.lineWidth = 2;

        // Draw the named points
        keypoints.filter(({score}) => score >= 0.3).forEach(({x, y, name}) => {
            const realX = x * this.displayDimensions.scale;
            const realY = y * this.displayDimensions.scale;
            this.videoOutCtx.fillText(name, realX, realY);
            // console.log(`(${Math.round(x)}, ${Math.round(y)}) ${name} = ${Math.round((score + Number.EPSILON) * 100) / 100}`);
        });

        // Draw the Skeleton
        SimplePose.CONNECTED_PAIRS
            .filter(([p1, p2]) => keypoints[p1].score >= 0.3 && keypoints[p2].score >= 0.3)
            .forEach(([p1, p2]) => {
                this.videoOutCtx.beginPath();
                this.videoOutCtx.moveTo(keypoints[p1].x * this.displayDimensions.scale, keypoints[p1].y * this.displayDimensions.scale);
                this.videoOutCtx.lineTo(keypoints[p2].x * this.displayDimensions.scale, keypoints[p2].y * this.displayDimensions.scale);
                this.videoOutCtx.stroke();
            });
    }


    /**
     * @param {{score: number, x: number, y:number, name: string}[]} keypoints
     */
    #logKeypoints(keypoints) {
        (async () => {
            const rawResponse = await fetch('/move', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(keypoints, SimplePose.stringifyRounded)
            });
            const content = await rawResponse.json();
            console.debug(content);
        })();
    }
}

// From the demo
SimplePose.CONNECTED_PAIRS = [[0, 1], [0, 2], [1, 3], [2, 4], [5, 6], [5, 7], [5, 11], [6, 8], [6, 12], [7, 9], [8, 10], [11, 12], [11, 13], [12, 14], [13, 15], [14, 16]];

SimplePose.stringifyRounded = (key, val) => {
    // round the long decimals to int
    return val.toFixed ? Number(val.toFixed(0)) : val;
};

export {SimplePose};

