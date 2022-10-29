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


export function setup() {
    canvas = Object.assign(document.createElement('canvas'), {
        id: 'canvas',
        style: 'position: absolute;top: 0;left: 0',
        width: CONFIG.WIDTH,
        height: CONFIG.HEIGHT,
    });
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    setStyle();
}

/**
 *
 * @param {HTMLVideoElement} source
 */
export function setVideo(source) {
    video = source;
    updateDimensions();
}

/**
 * Rescale everything based on source dimensions and display width
 */
function updateDimensions() {
    if (!video) {
        throw new Error("Must call setVideo before updateDimensions");
    }
    const scaleToWidth = window.innerWidth / video.videoWidth;
    const scaleToHeight = window.innerHeight / video.videoHeight;
    const bestScale = Math.min(scaleToWidth, scaleToHeight);
    canvas.width = Math.round(bestScale * video.videoWidth);
    canvas.height = Math.round(bestScale * video.videoHeight);
    ctx.scale(bestScale, bestScale);
    console.info(`Scaled from webcam (${video.videoWidth}, ${video.videoHeight}) to page (x:${canvas.width}, y:${canvas.height}, scale:${bestScale})`);
    setStyle();
}

function setStyle() {
    ctx.font = "6em sans-serif";
    ctx.fillStyle = "#00ffff";
    ctx.strokeStyle = "#00ffff";
    ctx.textBaseline = "top";
    ctx.lineWidth = 8;
    ctx.globalAlpha = 1;
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