import CanvasParticles from '../dist/index.mjs'

//  Initialize first canvas
new CanvasParticles('#cp-1', {
  background: 'linear-gradient(115deg, #354089, black)',
  mouse: {
    connectDistMult: 75,
    distRatio: 1,
  },
  particles: {
    color: '#88c8ff',
    ppm: 8000,
    max: 16000,
    maxWork: 1,
    connectDistance: 2,
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
    maxWork: 50,
    relSpeed: 0.75,
    rotationSpeed: 5,
  },
  gravity: {
    repulsive: 3,
  },
  debug: {
    drawGrid: true,
    drawIndexes: true,
  },
}).start()

// Initialize third canvas
new CanvasParticles('#cp-3', {
  background: '#423',
  mouse: {
    interactionType: 2,
    connectDistMult: 1.5,
    distRatio: 0.9,
  },
  particles: {
    color: '#f45',
    ppm: 400,
    max: 800,
    maxWork: 40,
    connectDistance: 80,
    relSpeed: 0.5,
  },
  gravity: {
    repulsive: 12,
    pulling: 1,
    maxVelocity: 3,
  },
}).start()

const cp4 = new CanvasParticles('#cp-4', {
  mouse: {
    interactionType: CanvasParticles.interactionType.SHIFT, // = 1
    connectDistMult: 1.25,
    distRatio: 1,
  },
  particles: {
    generationType: CanvasParticles.generationType.MATCH, // = 2
    color: 'red',
    maxWork: 100,
    ppm: 20,
    connectDistance: 200,
    rotationSpeed: 0,
  },
}).start()

const createParticleSineWave = () => {
  cp4.resizeCanvas()
  cp4.newParticles({ keepAuto: true, keepManual: false })

  const w = cp4.width
  const h = cp4.height

  // Manually create particles in a sine wave pattern
  for (let x = 0; x < w; x += 4) {
    const y = h / 4 + Math.sin(x / 100) * (h / 4)
    cp4.createParticle(x, y, 0, 1, 5)
  }

  for (let y = 0; y < h; y += 4) {
    const x = w / 2 + Math.sin(y / 100) * (h / 4)
    cp4.createParticle(x, y, 0, 2.3, 5)
  }
}

createParticleSineWave()
window.addEventListener('resize', createParticleSineWave)
