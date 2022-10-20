/* jshint esversion: 11 */
/* jshint quotmark: double */

/* jshint forin: true */

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
        if(currentTimeMs - this.#lastReport > 10_000) {
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
            if (i!==j) a[j] = e;
            j++;
        }
    });

    a.length = j;
    return a;
}
