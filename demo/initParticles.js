import CanvasParticles from '../dist/index.mjs'

//  Initialize first canvas
new CanvasParticles('#cp-1', {
  background: 'linear-gradient(115deg, #354089, black)',
  mouse: {
    interactionType: 2,
    connectDistMult: 0.8,
    distRatio: 1,
  },
  particles: {
    color: '#88c8ff40',
    max: 300,
    maxWork: 15,
    relSpeed: 0.8,
    rotationSpeed: 1,
  },
  gravity: {
    repulsive: 2,
    friction: 0.8,
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
    max: 300,
    maxWork: 15,
    rotationSpeed: 0.2,
  },
}).start()

// Initialize third canvas
new CanvasParticles('#cp-3', {
  background: '#423',
  mouse: {
    interactionType: 2,
    connectDistMult: 0.5,
    distRatio: 1,
  },
  particles: {
    color: '#f45c',
    ppm: 150,
    max: 300,
    connectDistance: 300,
    rotationSpeed: 5,
  },
  gravity: {
    repulsive: 10,
    pulling: 2,
    friction: 0.9,
  },
}).start()
