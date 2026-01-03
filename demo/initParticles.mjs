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
  background: 'hsl(125, 33%, 10%)',
  mouse: {
    connectDistMult: 1,
  },
  particles: {
    regenerateOnResize: true,
    color: '#96ff69',
    ppm: 120,
    max: 480,
    maxWork: 20,
    relSpeed: 0.75,
    rotationSpeed: 5,
  },
  gravity: {
    repulsive: 3,
  },
}).start()

// Initialize third canvas
new CanvasParticles('#cp-3', {
  background: '#523',
  mouse: {
    distRatio: 1,
  },
  particles: {
    color: '#f45',
    ppm: 80,
    max: 320,
    maxWork: 50,
    connectDistance: 250,
  },
  gravity: {
    repulsive: 10,
    pulling: 2,
    friction: 0.95,
  },
}).start()
