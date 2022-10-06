/* jshint esversion: 11 */
/* jshint quotmark: double */
/* jshint forin: true */

class SimpleVideo {
    video;
    /** @type {CanvasRenderingContext2D} */
    videoOutCtx;
    #sourceDimensions = {width: 360, height: 270};
    /** Update scale to fit in the screen, then the width/height to match the scale */
    displayDimensions = {width: 360, height: 270, scale: 1};

    constructor() {
        this.video = document.getElementById("video");
        this.video.onloadedmetadata = () => {
            console.info("video.onloadedmetadata")
            console.info("videoWidth:", this.video.videoWidth);
            console.info("videoHeight:", this.video.videoHeight);
            this.updateDimensions();
        };
        /** @type {HTMLCanvasElement} */
        const videoOut = document.getElementById("canvas");
        this.videoOutCtx = videoOut.getContext("2d");
        screen.orientation.onchange = () => {
            console.info("screen.orientation.onchange")
            this.updateDimensions();
        };
        window.onresize = () => {
            console.info("window.onresize")
            this.updateDimensions();
        };
    }

    async run() {
        return this.#startVideoStream();
    }
    /**
     * Rescale everything based on source dimensions and display width
     * TODO: Max Height
     */
    updateDimensions() {
        this.#sourceDimensions.width = this.video.videoWidth;
        this.#sourceDimensions.height = this.video.videoHeight;

        const scaleToWidth = window.innerWidth / this.#sourceDimensions.width;
        const scaleToHeight = window.innerHeight / this.#sourceDimensions.height;
        this.displayDimensions.scale = Math.min(scaleToWidth, scaleToHeight);
        this.displayDimensions.width = this.#sourceDimensions.width * this.displayDimensions.scale;
        this.displayDimensions.height = this.#sourceDimensions.height * this.displayDimensions.scale;

        this.videoOutCtx.scale(this.displayDimensions.scale, this.displayDimensions.scale);
        this.videoOutCtx.canvas.width = this.displayDimensions.width;
        this.videoOutCtx.canvas.height = this.displayDimensions.height;

        console.info("Source:", this.#sourceDimensions);
        console.info("Display:", this.displayDimensions);
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
        this.video.srcObject = await navigator.mediaDevices.getUserMedia(constraints);

        const [track] = this.video.srcObject.getVideoTracks();
        const capabilities = track.getCapabilities();
        const settings = track.getSettings();
        if ("zoom" in settings) {
            console.warn("zoom is supported yay!  Zooming out.");
            await track.applyConstraints({advanced: [{zoom: capabilities.zoom.min}]});
        }
        await this.video.play();
        console.timeEnd("#startVideoStream");
    }
}

export {SimpleVideo};