/* jshint esversion: 11 */
/* jshint quotmark: double */
/* jshint forin: true */

/** @type {HTMLVideoElement} */
export let video;
/** @type {number} Webcam's actual width */
export let width = 640;
/** @type {number} */
export let height = 480;

export async function start() {
    console.time("start");

    return new Promise(async (resolve) => {
        video = Object.assign(document.createElement('video'), {
            id: 'video',
            style: 'display:none',
            autoplay: true,
            playsinline: true,
            width: width,
            height: height,
        });
        document.body.appendChild(video);

        /** @type {MediaStreamConstraints} */
        const constraints = {
            video: {
                width: {ideal: width},
                height: {ideal: height},
                facingMode: {ideal: "user"},
                frameRate: {ideal: 15},
                zoom: true
            }
        };
        // Set the callback first before wiring up the webcam
        video.onloadedmetadata = () => {
            width = video.videoWidth;
            height = video.videoHeight
            console.info(`onloadedmetadata webcam resolution: ${width}, ${height}`);
            console.timeEnd("start");
            resolve();
        };

        video.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
        await video.play();

        const [track] = video.srcObject.getVideoTracks();
        const capabilities = track.getCapabilities();
        const settings = track.getSettings();
        if ("zoom" in settings) {
            console.info("zoom is supported yay!  Zooming out.");
            await track.applyConstraints({advanced: [{zoom: capabilities.zoom.min}]});
        } else {
            console.info(`Not zoom capable.`);
        }
    });
}


