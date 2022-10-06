/* jshint esversion: 11 */
/* jshint quotmark: double */

/* jshint forin: true */


class RateLimit {
    /** @type {function} */
    #fn;
    /** @type {number} min percent of time to wait between heavy lifting */
    #minPercentIdle;
    /** @type {number} min ms to delay between actions */
    #minCoolDownMs;
    /** @type {boolean} */
    running = true;
    /** @type {number} most recent busy time */
    totalTimeMs = 0;

    /**
     * @param {function} fn
     * @param {number} minPercentIdle
     * @param {number} minCoolDownMs
     */
    constructor(fn, minPercentIdle = 0.0, minCoolDownMs = 0) {
        this.#fn = fn;
        this.#minPercentIdle = minPercentIdle;
        this.#minCoolDownMs = minCoolDownMs;
    }

    static #asyncTimeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        await this.#loop();
    }

    async #loop() {
        const startTimeMs = performance.now();
        await this.#fn();
        const endTimeMs = performance.now();
        this.totalTimeMs = endTimeMs - startTimeMs;
        const percentBasedWait = this.totalTimeMs * this.#minPercentIdle;
        const actualWait = Math.max(this.#minCoolDownMs, percentBasedWait)
        await RateLimit.#asyncTimeout(actualWait);
        if (this.running) {
            await this.#loop();
        } else {
            console.warn("!running, so ending loop.")
        }
    }
}

export {RateLimit}