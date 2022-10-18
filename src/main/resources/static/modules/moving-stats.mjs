/* jshint esversion: 11 */
/* jshint quotmark: double */

/* jshint forin: true */

/** Track a value over time. */
class MovingStats {
    /** @type {string} */
    name;
    /** @type {number[]} */
    #points = [];
    /** @type {number} */
    #maxSize;
    /** @type {number} */
    #logEveryNMs;
    /** @type {DOMHighResTimeStamp} */
    #lastHitTimeMs = performance.now();
    /** @type {DOMHighResTimeStamp} */
    #lastOutputTimeMs = performance.now();

    /**
     * @param {string} name
     * @param {number} maxSize
     * @param {number} logEveryNSeconds
     */
    constructor(name, maxSize = 100, logEveryNSeconds = 10) {
        this.name = name;
        this.#maxSize = maxSize;
        this.#logEveryNMs = logEveryNSeconds * 1000;
    }

    /** Measuring average ms time between hits */
    hit() {
        this.add(performance.now() - this.#lastHitTimeMs)
    }

    /**
     * @param {number} newVal
     */
    add(newVal) {
        const currentMs = performance.now();
        if (this.#points.unshift(newVal) > this.#maxSize) {
            this.#points.length = this.#maxSize
        }
        if (currentMs - this.#lastOutputTimeMs > this.#logEveryNMs) {
            // output!
            console.info(`MovingStats:${this.name}`, this.get());
            this.#lastOutputTimeMs = currentMs;
        }
        this.#lastHitTimeMs = currentMs;
    }

    get() {
        if (this.#points.length > 0) {
            return {
                avg: Math.round(this.#points.reduce((a, b) => a + b) / this.#points.length),
                min: Math.round(Math.min(...this.#points)),
                max: Math.round(Math.max(...this.#points)),
            };
        } else {
            return {};
        }
    }
}

export {MovingStats}