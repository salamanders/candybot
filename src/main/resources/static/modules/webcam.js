/* jshint esversion: 11 */
/* jshint quotmark: single */
/* jshint forin: true */

import * as CONFIG from './config.js';

/** @type {HTMLVideoElement} */
export let video;

export async function setup() {
    console.time('SimpleWebcam.setup');

    return new Promise(async (resolve) => {
        video = Object.assign(document.createElement('video'), {
            id: 'video',
            style: 'display:none',
            autoplay: true,
            playsinline: true,
            width: CONFIG.WIDTH,
            height: CONFIG.HEIGHT,
        });
        // document.body.appendChild(video);
        /** @type {MediaStreamConstraints} */
        const constraints = {
            video: {
                width: {ideal: CONFIG.WIDTH},
                height: {ideal: CONFIG.HEIGHT},
                facingMode: {ideal: 'environment'},
                frameRate: {ideal: CONFIG.FPS},
                zoom: true
            }
        };
        // Set the callback first before wiring up the webcam
        video.onloadedmetadata = () => {
            console.info(`onloadedmetadata webcam resolution: ${video.videoWidth}, ${video.videoHeight}`);
            console.timeEnd('SimpleWebcam.setup');
            resolve();
        };

        video.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
        // await video.play();

        const [track] = video.srcObject.getVideoTracks();
        const capabilities = track.getCapabilities();
        const settings = track.getSettings();
        if ('zoom' in settings) {
            console.info('Attempting to zoom out...');
            await track.applyConstraints({advanced: [{zoom: capabilities.zoom.min}]});
            console.info('zoomed out!')
        } else {
            console.info(`Not zoom capable.`);
        }
    });
}

/** @param {CanvasRenderingContext2D} ctx */
export function draw(ctx) {
    //ctx.save();
    //ctx.scale(-1, 1);
    //ctx.translate(-width, 0);
    ctx.drawImage(video, 0, 0);
    //ctx.restore();
}

