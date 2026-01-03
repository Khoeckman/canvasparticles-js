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
    generationType: CanvasParticles.generationType.NEW, // = 1
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

const cp4 = new CanvasParticles('#cp-4', {
  mouse: {
    interactionType: CanvasParticles.interactionType.MOVE, // = 2
    connectDistMult: 1.25,
    distRatio: 1,
  },
  particles: {
    generationType: CanvasParticles.generationType.MANUAL, // = 0
    color: 'red',
    maxWork: 100,
    connectDistance: 200,
    rotationSpeed: 0,
  },
}).start()

const iw1_4 = window.innerWidth / 4
const ih1_4 = window.innerHeight / 4

// Manually create particles in a sine wave pattern
for (let x = 0; x < window.innerWidth; x += 4) {
  const y = ih1_4 + Math.sin(x / 100) * ih1_4
  cp4.createParticle(x, y, 0, 1, 5)
}

for (let y = -ih1_4; y < window.innerHeight + cp4.option.particles.connectDist / 2; y += 4) {
  const x = 2 * iw1_4 + Math.sin(y / 100) * ih1_4
  cp4.createParticle(x, y, 0, 1, 5)
}
