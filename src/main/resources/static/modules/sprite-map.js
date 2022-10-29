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
    /** @type {Number} */
    #scale;


    /**
     * @param {string} uri
     * @param {Object} options
     */
    constructor(uri, options = {}) {
        this.#uri = uri;
        this.#numTilesX = options['numTilesX'] ?? 1;
        this.#numTilesY = options['numTilesY'] ?? 1;
        this.#frameDelayMs = options['frameDelayMs'] ?? 50;
        this.#scale = options['scale'] ?? 1.0;
        this.load().then(() => console.info(`SpriteMap(${this.#uri}) loaded.`))
    }

    async load() {
        this.#image = await loadImage(this.#uri);
        this.#tileWidth = this.#image.width / this.#numTilesX;
        this.#tileHeight = this.#image.height / this.#numTilesY;
        if(!this.#image || !this.#tileWidth || !this.#tileHeight) {
            throw new Error(`Problems creating sprite for "${this.#uri}"`);
        }
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
 * @param {Number} scale
 * @return {Promise<HTMLImageElement>}
 */
export function loadImage(src, scale = 1.0) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if(scale === 1.0) {
            img.onload = () => resolve(img);
        } else {
            img.onload = () => resolve(img);
            //  scaleImage(img, scale));
        }
        img.onerror = reject;
        img.src = src;
    })
}

/**
 *
 * @param {HTMLImageElement} img
 * @param {Number} scale
 */
function scaleImage(img, scale) {
    const newWidth = img.width * scale;
    const newHeight = img.height * scale;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.clearRect(0,0,newWidth,newHeight);
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = "high";
    tempCtx.drawImage(img, 0, 0, newWidth, newHeight);
    const scaled = document.createElement("img");
    scaled.src = tempCanvas.toDataURL('image/png');
    console.log('scale debug', scaled, typeof scaled);
    return scaled;
}