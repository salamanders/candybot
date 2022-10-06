/* jshint esversion: 11 */
/* jshint quotmark: double */

/* jshint forin: true */


class MovingAverage {
    /** @type {string} */
    name;
    /** @type {number[]} */
    #points = [];
    /** @type {number} */
    #maxSize;
    /** @type {number} */
    #logEveryNHits;
    /** @type {number} */
    #hitCounter = 0;

    /**
     * @param {string} name
     * @param {number} maxSize
     * @param {number} logEveryNHits
     */
    constructor(name, maxSize = 10, logEveryNHits = 20) {
        this.name = name;
        this.#maxSize = maxSize;
        this.#logEveryNHits = logEveryNHits;
    }

    /**
     * @param {number} newVal
     */
    add(newVal) {
        if (this.#points.unshift(newVal) > this.#maxSize) {
            this.#points.length = this.#maxSize
        }
        this.#hitCounter++;
        if (this.#hitCounter >= this.#logEveryNHits) {
            this.#hitCounter = 0;
            console.info(`MovingAverage:${this.name}`, Math.round(this.get()));
        }
    }

    get() {
        if (this.#points.length > 0) {
            return this.#points.reduce((a, b) => a + b) / this.#points.length;
        } else {
            return 0;
        }
    }
}

export {MovingAverage}