import * as POLY from "./shared.js";
import {filterInPlace} from "./shared.js";
import {SpriteMap} from "./sprite-map.js";

import * as CONFIG from "./config.js";

const MAX_PARTICLES = 500;
const MAX_PARTICLE_LIFE = 3_000;
const MAX_PARTICLE_SPEED = 0.3
/** @type {Object[]} */
const particles = [];

/** @type { SpriteMap[]} */
const spriteMaps = [];

spriteMaps.push(
    new SpriteMap('/img/spritesheet_yellowspark.png', {
        numTilesX: 4,
        numTilesY: 4,
        frameDelayMs: 10,
        scale: 1,
    }));

spriteMaps.push(
    new SpriteMap('/img/spritesheet_whitespark.png', {
        numTilesX: 13,
        numTilesY: 1,
        frameDelayMs: 17,
        scale: 1,
    }));

await Promise.all(spriteMaps.map(sm => sm.load()));

export function spawn(x, y) {
    if (!x || !y) {
        throw new Error("`x` and `y` are required.")
    }
    const currentMs = performance.now();
    filterInPlace(particles, particle =>
        particle.x >= 0 && particle.x <= CONFIG.WIDTH &&
        particle.y >= 0 && particle.y <= CONFIG.HEIGHT &&
        currentMs < particle.end
    );
    const totalLifeMs = POLY.randomSpread(MAX_PARTICLE_LIFE, MAX_PARTICLE_LIFE / 2);
    const newParticle = {
        /** @type {DOMHighResTimeStamp} */
        created: currentMs,
        end: currentMs + totalLifeMs,
        total: totalLifeMs,
        /** @type {DOMHighResTimeStamp} */
        lastUpdated: currentMs,
        x: x,
        y: y,
        // color: Math.floor(Math.random() * 0x1000000),
        // speed in total distance (pixels) over lifetime.
        dx: POLY.randomSpread(0, MAX_PARTICLE_SPEED),
        // Upward bias
        dy: POLY.randomSpread(-MAX_PARTICLE_SPEED * (2 / 3), MAX_PARTICLE_SPEED),
        sprite: spriteMaps[Math.floor(Math.random() * spriteMaps.length)],
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
        const pctLifeUsed = (currentMs - particle.created) / particle.total;
        const pctLifeRemaining = 1 - pctLifeUsed;

        // Slow down as it decays
        particle.x += pctLifeRemaining * particle.dx * msSinceLastUpdate;
        particle.y += pctLifeRemaining * particle.dy * msSinceLastUpdate;
        particle.lastUpdated = currentMs;

        // Fade as it decays
        ctx.globalAlpha = pctLifeRemaining;
        particle.sprite.drawSprite(ctx,
            particle.x, particle.y,
            particle.created);
    }
}
