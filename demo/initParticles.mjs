import CanvasParticles from '../dist/index.mjs'

//  Initialize first canvas
new CanvasParticles('#cp-1', {
  background: 'linear-gradient(115deg, #354089, black)',
  mouse: {
    connectDistMult: 1,
    distRatio: 1,
  },
  particles: {
    drawLines: false,
    color: '#88c8ff',
    ppm: 10000,
    max: 20000,
    relSpeed: 0.05,
  },
}).start()

// Initialize second canvas
new CanvasParticles('#cp-2', {
  background: 'hsl(125, 42%, 35%)',
  particles: {
    color: '#96ff69',
    ppm: 150,
    max: 300,
    maxWork: 20,
    relSpeed: 1.25,
    relSize: 2,
    rotationSpeed: 5,
  },
  gravity: {
    repulsive: 3,
  },
}).start()

// Initialize third canvas
new CanvasParticles('#cp-3', {
  background: '#423',
  mouse: {
    distRatio: 1,
  },
  particles: {
    regenerateOnResize: true,
    color: '#f45c',
    ppm: 150,
    max: 300,
    connectDistance: 250,
    rotationSpeed: 3,
  },
  gravity: {
    repulsive: 15,
    pulling: 3,
    friction: 0.9,
  },
}).start()
