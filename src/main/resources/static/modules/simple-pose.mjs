/* jshint esversion: 11 */
/* jshint quotmark: single */
/* jshint forin: true */

import {MovingStats} from "./moving-stats.mjs";
import {RateLimiter} from "./polyfill.mjs";

let detector = null;
const poseRateLimiter = new RateLimiter(100);

export async function setup() {
    console.time("SimplePose.setup");
    await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core');
    await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter');
    await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl');
    /*const poseDetection =*/ await import ('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection');
    const detectorConfig = {
        modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
        enableTracking: true,
        trackerType: poseDetection.TrackerType.BoundingBox
    };
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
    console.timeEnd("SimplePose.setup");
}

const poseStats = new MovingStats('pose estimation', 5_000);

/** @param {HTMLVideoElement} video */
export async function estimatePoses(video) {
    if(poseRateLimiter.fire()) {
        const startTime = performance.now();
        const pose = await detector.estimatePoses(video);
        poseStats.add(performance.now()- startTime);
        /** @type {Keypoint[]} */
        const keypoints = pose[0]?.keypoints?.filter(keypoint=>keypoint.score > 0.3);
        if(!keypoints) {
            return null;
        }
        // console.debug(JSON.stringify(normalizedKeypoints));
        return poseDetection.calculators.keypointsToNormalizedKeypoints(keypoints, {
            height: video.videoHeight,
            width: video.videoWidth
        });
    }
}

// MULTIPOSE_LIGHTNING skeleton
const CONNECTED_PAIRS = [[0, 1], [0, 2], [1, 3], [2, 4], [5, 6], [5, 7], [5, 11], [6, 8], [6, 12], [7, 9], [8, 10], [11, 12], [11, 13], [12, 14], [13, 15], [14, 16]];

