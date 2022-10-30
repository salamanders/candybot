/* jshint esversion: 11 */
/* jshint quotmark: double */

/* jshint forin: true */

/**
 * fetch handler
 * @param {Response} response
 * @return {{ok}|*}
 */
function handleErrors(response) {
    if (!response.ok) {
        console.error(response.statusText);
    }
    return response;
}

/**
 * Await enabled image loader polyfill
 * @param {string} src
 * @return {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * The image must be fully loaded.
 * @param {HTMLImageElement} img
 * @param {Number} scale
 * @return {Promise<HTMLImageElement>}
 */
export function scaleImage(img, scale = 1.0) {
    if (scale === 1.0) {
        return Promise.resolve(img);
    }
    const newWidth = img.width * scale;
    const newHeight = img.height * scale;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.clearRect(0, 0, newWidth, newHeight);
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = "high";
    tempCtx.drawImage(img, 0, 0, newWidth, newHeight);
    return loadImage(tempCanvas.toDataURL('image/png'));
}

/**
 *
 * @param {Array} arr
 * @param {function} condition
 * @return {Number}
 */
export function countOf(arr, condition) {
    return arr.reduce((accumulator, obj) => {
        if (condition(obj)) {
            return accumulator + 1;
        }
        return accumulator;
    }, 0);
}

export async function blockUntilDOMReady() {
    return new Promise(resolve => {
        // Block on document being fully ready, in case we need to build a login button
        if (document.readyState === 'complete') {
            console.info(`document.readyState=${document.readyState}`);
            resolve();
            return;
        }
        const onReady = () => {
            console.info(`blockUntilDOMReady:done`);
            resolve();
            document.removeEventListener('DOMContentLoaded', onReady, true);
            window.removeEventListener('load', onReady, true);
        };
        document.addEventListener('DOMContentLoaded', onReady, true);
        window.addEventListener('load', onReady, true);
    });
}

export class RateLimiter {
    /** @type {number} min ms to delay between actions */
    #minCoolDownMs;
    /** @type {DOMHighResTimeStamp} */
    #lastFired = 0;
    #lastReport;
    #fireCount = 0;
    #totalHits = 0;
    #name;

    constructor(minCoolDownMs = 100, name = '') {
        this.#minCoolDownMs = minCoolDownMs;
        this.#lastReport = performance.now();
        this.#name = name;
    }

    fire() {
        const currentTimeMs = performance.now();
        this.#totalHits++;
        if (currentTimeMs - this.#lastReport > 10_000) {
            console.info(`RateLimiter (${this.#name}) fired ${this.#fireCount}/${this.#totalHits}`);
            this.#lastReport = currentTimeMs;
        }
        if (currentTimeMs - this.#lastFired >= this.#minCoolDownMs) {
            this.#lastFired = currentTimeMs;
            this.#fireCount++;
            return true;
        }
        return false;
    }
}

/**
 * Usage: filterInPlace(a, x=>true);
 * @param a
 * @param condition
 * @param thisArg
 * @return {*}
 */
export function filterInPlace(a, condition, thisArg) {
    let j = 0;

    a.forEach((e, i) => {
        if (condition.call(thisArg, e, i, a)) {
            if (i !== j) a[j] = e;
            j++;
        }
    });

    a.length = j;
    return a;
}

// Same as randomInt, but returns a float
export function randomFloat(start, end) {
    if (end === undefined) return randomFloat(0, start); else return Math.random() * (end - start) + start;

}

export function randomSpread(center, spread) {
    return randomFloat(center - spread, center + spread);
}

/**
 *
 * @param {HTMLElement} target
 * @return {Promise<string>}
 */
export async function fullscreen(target) {
    return new Promise((resolve, reject) => {
        if (document.fullscreenElement) {
            resolve('Already in fullscreen.');
        }
        const dialog = Object.assign(document.createElement('dialog'), {
            open: 'true',
        });
        const enterFullscreenButton = Object.assign(document.createElement('button'), {
            innerHTML: 'Enter Full Screen Mode', onclick: async () => {
                dialog.remove();
                target.requestFullscreen({'navigationUI': 'hide'})
                    .then(() => resolve('Entered Fullscreen.'))
                    .catch((err) => {
                        reject(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`)
                    });
            }
        });
        dialog.appendChild(enterFullscreenButton);
        document.body.appendChild(dialog);
    });
}

export function signal(message) {
    console.warn(`Sending signal: /motor/${message}`);
    fetch('/motor', {
        method: 'POST', headers: {
            'Accept': 'application/json', 'Content-Type': 'application/json'
        }, body: JSON.stringify({action: message})
    })
        .then(handleErrors)
        .then(response => console.info("ok", response.text()))
        .catch(error => console.error(error));
}
