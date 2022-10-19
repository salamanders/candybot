import * as CONFIG from "./config.mjs";
import {filterInPlace, RateLimiter} from "./polyfill.mjs";

const PARTICLE_MAX_COUNT = 100;

/** @type {Object[]} */
const particles = [];

let img = new Image();
img.src = '/img/spark.png';

const particleRateLimiter = new RateLimiter(25);

export function spawn(x, y) {
    if (particleRateLimiter.fire()) {
        filterInPlace(particles, particle => particle.x >= -0.5 && particle.x <= 1.5 && particle.y >= -0.5 && particle.y <= 1.5);

        const newParticle = {
            created: performance.now(),
            lastUpdated: performance.now(),
            x: x,
            y: y,
            color: Math.floor(Math.random() * 0x1000000),
            // speed in percent_of_screen/ms
            dx: (Math.random() - 0.5) / 1_000,
            dy: (Math.random() - 0.5) / 1_000,
        };
        if (particles.unshift(newParticle) > PARTICLE_MAX_COUNT) {
            particles.length = PARTICLE_MAX_COUNT;
        }
        console.debug(`New particle at (${x}, ${y})`)
        return true;
    }
    return false;
}

/** @param {CanvasRenderingContext2D} ctx */
export function moveAndDraw(ctx) {
    const currentTs = performance.now();
    for (const particle of particles) {
        const duration = currentTs - particle.lastUpdated;
        particle.x += particle.dx * duration;
        particle.y += particle.dy * duration;
        particle.lastUpdated = currentTs;
        ctx.drawImage(img, particle.x * CONFIG.WIDTH - img.width/2, particle.y * CONFIG.HEIGHT - img.height/2);
    }
}
