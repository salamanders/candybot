/* jshint esversion: 11 */
/* jshint quotmark: single */
/* jshint forin: true */

import * as CONFIG from "./config.js";

/** @type {HTMLVideoElement} */
let video;
/** @type {HTMLCanvasElement} */
let canvas;
/** @type {CanvasRenderingContext2D} */
export let ctx;

/**
 *
 * @param {HTMLVideoElement} source
 */
export function setup(source) {
    video = source;
    canvas = Object.assign(document.createElement('canvas'), {
        id: 'canvas',
        style: 'position: absolute;top: 0;left: 0',
        width: CONFIG.WIDTH,
        height: CONFIG.HEIGHT,
    });
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    updateDimensions();
    setStyle();
}

/**
 * Rescale everything based on source dimensions and display width
 */
function updateDimensions() {
    const scaleToWidth = window.innerWidth / video.videoWidth;
    const scaleToHeight = window.innerHeight / video.videoHeight;
    const bestScale = Math.min(scaleToWidth, scaleToHeight);
    canvas.width = Math.round(bestScale * video.videoWidth);
    canvas.height = Math.round(bestScale * video.videoHeight);
    ctx.scale(bestScale, bestScale);
    console.info(`Scaled from webcam (${video.videoWidth}, ${video.videoHeight}) to page (x:${canvas.width}, y:${canvas.height}, scale:${bestScale})`);
}

function setStyle() {
    ctx.font = "1em sans-serif";
    ctx.fillStyle = "#00ffff";
    ctx.strokeStyle = "#00ffff";
    ctx.textBaseline = "top";
    ctx.lineWidth = 8;
}

screen.orientation.onchange = () => {
    console.info("screen.orientation.onchange")
    updateDimensions();
    setStyle();
};

window.onresize = () => {
    console.info("window.onresize")
    updateDimensions();
    setStyle();
};