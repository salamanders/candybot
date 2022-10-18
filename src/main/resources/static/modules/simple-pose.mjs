/* jshint esversion: 11 */
/* jshint quotmark: double */
/* jshint forin: true */


/* jshint esversion: 11 */
/* jshint quotmark: double */
/* jshint forin: true */

console.time('tf imports');
await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core');
await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter');
await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl');
// alt: https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.js"></script> -->
await import ('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection');
console.timeEnd('tf imports');

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

export async function estimatePoses(video) {
    return await detector.estimatePoses(video);
}


// From the demo
const CONNECTED_PAIRS = [[0, 1], [0, 2], [1, 3], [2, 4], [5, 6], [5, 7], [5, 11], [6, 8], [6, 12], [7, 9], [8, 10], [11, 12], [11, 13], [12, 14], [13, 15], [14, 16]];

const stringifyRounded = (key, val) => {
    // round the long decimals to int
    return val.toFixed ? Number(val.toFixed(0)) : val;
};
