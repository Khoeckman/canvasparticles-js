import CanvasParticles from '../dist/index.mjs'

//  Initialize first canvas
new CanvasParticles('#cp-1', {
  background: 'linear-gradient(115deg, #354089, black)',
  mouse: {
    interactionType: 2,
    connectDistMult: 200,
    distRatio: 1,
  },
  particles: {
    color: '#88c8ff',
    ppm: 10000,
    max: 20000,
    maxWork: 0,
    connectDistance: 1,
    relSpeed: 0.05,
  },
}).start()

// Initialize second canvas
new CanvasParticles('#cp-2', {
  background: 'hsl(125, 42%, 35%)',
  resetOnResize: true,
  mouse: {
    interactionType: 2,
  },
  particles: {
    color: '#96ff69',
    ppm: 250,
    max: 1000,
    maxWork: 50,
    relSpeed: 0.1,
  },
}).start()

// Initialize third canvas
new CanvasParticles('#cp-3', {
  background: '#423',
  mouse: {
    interactionType: 2,
    connectDistMult: 2,
    distRatio: 0.9,
  },
  particles: {
    color: '#f45c',
    ppm: 750,
    max: 1500,
    maxWork: 50,
    connectDistance: 100,
    relSpeed: 1,
    rotationSpeed: 2,
  },
  gravity: {
    repulsive: 5,
    pulling: 1,
    friction: 0.75,
  },
}).start()

// Causes issues somehow:
// Initialize third canvas
/* new CanvasParticles('#cp-3', {
  background: '#423',
  mouse: {
    interactionType: 2,
    connectDistMult: 2,
    distRatio: 0.75,
  },
  particles: {
    color: '#f45c',
    ppm: 240,
    max: 1200,
    maxWork: 100,
    connectDistance: 50,
    relSpeed: 0,
    rotationSpeed: 5,
  },
  gravity: {
    repulsive: 4,
    pulling: 2,
    friction: 0.5,
  },
}).start()
 */
