/* jshint esversion: 11 */
/* jshint quotmark: single */

/* jshint forin: true */

export class SpriteMap {
    #uri;
    #image;
    /** @type {Number} */
    #numTilesX;
    /** @type {Number} */
    #numTilesY;
    /** @type {Number} */
    #tileWidth;
    /** @type {Number} */
    #tileHeight;
    /** @type {Number} */
    #frameDelayMs;

    /**
     * @param {string} uri
     * @param {Object} options
     */
    constructor(uri, options = {}) {
        this.#uri = uri;
        this.#numTilesX = options['numTilesX'] ?? 1;
        this.#numTilesY = options['numTilesY'] ?? 1;
        this.#frameDelayMs = options['frameDelayMs'] ?? 50;
        this.load().then(() => console.info(`SpriteMap(${this.#uri}) loaded.`))
    }

    async load() {
        this.#image = await loadImage(this.#uri);
        this.#tileWidth = this.#image.width / this.#numTilesX;
        this.#tileHeight = this.#image.height / this.#numTilesY;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {Number} targetCenterX
     * @param {Number} targetCenterY
     * @param {DOMHighResTimeStamp} createdMs
     */
    drawSprite(ctx, targetCenterX, targetCenterY, createdMs) {
        if (!ctx || !targetCenterX || !targetCenterY || !createdMs) {
            throw new Error("missing required params");
        }
        const currentFrame = Math.floor((performance.now() - createdMs) / this.#frameDelayMs) % (this.#numTilesX * this.#numTilesY);
        const spriteTileX = currentFrame % this.#numTilesX;
        const spriteTileY = Math.floor(currentFrame / this.#numTilesX);
        ctx.drawImage(this.#image,
            // Source x, y
            spriteTileX * this.#tileWidth, spriteTileY * this.#tileHeight,
            // Source w, h
            this.#tileWidth, this.#tileHeight,
            // Target x, y
            targetCenterX - this.#tileWidth / 2,
            targetCenterY - this.#tileHeight / 2,
            // Target w, h
            this.#tileWidth, this.#tileHeight
        )
    }
}

/**
 *
 * @param {string} src
 * @return {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    })
}
