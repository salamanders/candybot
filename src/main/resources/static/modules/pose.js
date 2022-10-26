/* jshint esversion: 11 */
/* jshint quotmark: single */
/* jshint forin: true */

import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core';
import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter';
import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl';
import 'https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection';

import {MovingStats} from "./moving-stats.js";

let detector = null;

export async function setup() {
    console.time("SimplePose.setup");
    const detectorConfig = {
        modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
        enableTracking: true,
        trackerType: poseDetection.TrackerType.BoundingBox
    };
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
    console.timeEnd("SimplePose.setup");
}

const poseStats = new MovingStats('pose estimation', 5_000);

/**
 * @param {HTMLVideoElement} video
 * @return {Object}
 */
export async function estimatePoses(video) {
    const startTime = performance.now();
    // todo input_size = 192
    /** @type {Object[]} */
    const poses = (await detector.estimatePoses(video))?.filter(pose => pose?.keypoints?.length > 0);
    poseStats.add(performance.now() - startTime);

    return poses?.map(pose => pose.keypoints.filter(keypoint => keypoint.score >= 0.1)
        .reduce((map, keypoint) => {
            map[keypoint.name] = {
                x: Math.round(keypoint.x),
                y: Math.round(keypoint.y)
            };
            return map;
        }, {}));
}

// MULTIPOSE_LIGHTNING skeleton
export const CONNECTED_PAIRS = [[0, 1], [0, 2], [1, 3], [2, 4], [5, 6], [5, 7], [5, 11], [6, 8], [6, 12], [7, 9], [8, 10], [11, 12], [11, 13], [12, 14], [13, 15], [14, 16]];

