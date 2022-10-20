import * as CONFIG from "./config.mjs";
import {filterInPlace} from "./polyfill.mjs";
import {SpriteMap} from "./sprite-map.mjs";

const MAX_PARTICLES = 500;
const PARTICLE_LIFE = 3_000;

/** @type {Object[]} */
const particles = [];

/** @type { SpriteMap} */
const particleSpriteMap = new SpriteMap('/img/sparkle.png', {
    numTilesX: 4,
    numTilesY: 4,
    frameDelayMs: 10
});
await particleSpriteMap.load();
console.debug('SpriteMap', particleSpriteMap);

export function spawn(x, y) {
    const currentMs = performance.now();
    filterInPlace(particles, particle =>
        particle.x >= -0.5 && particle.x <= 1.5 &&
        particle.y >= -0.5 && particle.y <= 1.5 &&
        currentMs - particle.created < PARTICLE_LIFE
    );
    const newParticle = {
        /** @type {DOMHighResTimeStamp} */
        created: performance.now(),
        /** @type {DOMHighResTimeStamp} */
        lastUpdated: performance.now(),
        x: x,
        y: y,
        // color: Math.floor(Math.random() * 0x1000000),
        // speed in percent_of_screen/ms
        dx: (Math.random() - 0.5) / 1_000,
        dy: (Math.random() - 0.5) / 1_000
    };
    if (particles.unshift(newParticle) >= MAX_PARTICLES) {
        particles.length = MAX_PARTICLES;
    }
    console.debug(`New particle at (${x}, ${y})`)
}

/** @param {CanvasRenderingContext2D} ctx */
export function moveAndDraw(ctx) {
    const currentMs = performance.now();
    for (const particle of particles) {
        const msSinceLastUpdate = currentMs - particle.lastUpdated;
        const pctLifeRemaining = 1 -  (currentMs - particle.created) / PARTICLE_LIFE;

        // Slow down as it decays
        particle.x += pctLifeRemaining * particle.dx * msSinceLastUpdate;
        particle.y += pctLifeRemaining * particle.dy * msSinceLastUpdate;
        particle.lastUpdated = currentMs;

        // Fade as it decays
        ctx.globalAlpha = pctLifeRemaining;
        particleSpriteMap.drawSprite(ctx,
            particle.x* CONFIG.WIDTH, particle.y * CONFIG.HEIGHT,
            particle.created);
    }
}
