const title = new CanvasParticles('#cp-title', {
  background: 'var(--bg)',
  mouse: {
    interactionType: 1,
    connectDistMult: 1.1,
    distRatio: 1,
  },
  particles: {
    regenerateOnResize: true,
    color: '#848888',
    ppm: 50,
    max: 999,
    connectDistance: 175,
  },
})
title.start()

export const showcase = {}

showcase.default = new CanvasParticles('#showcase-default')

showcase.coloring = new CanvasParticles('#showcase-coloring', {
  // Any CSS Supported value for the 'background' property
  background: 'rgb(21, 16, 25)',
  mouse: {
    interactionType: 1,
  },
  particles: {
    // Any CSS Supported color
    color: 'hsl(206, 100%, 77%)',
  },
})

showcase.interact = new CanvasParticles('#showcase-interact', {
  background: '#000',
  mouse: {
    connectDistMult: 0.8,
    distRatio: 0.7,
  },
  particles: {
    color: '#f42',
    ppm: 120,
    maxWork: 40,
    relSpeed: 2,
  },
})

showcase.quantity = new CanvasParticles('#showcase-quantity', {
  background: 'hsl(125, 42%, 35%)',
  mouse: {
    interactionType: 1,
    connectDistMult: 1.5,
    distRatio: 1.5,
  },
  particles: {
    color: 'rgb(150, 255, 105)',
    // Particles per million pixels the canvas covers
    ppm: 2000,
    max: 4000,
    connectDistance: 50,
  },
})

showcase['connect-distance'] = new CanvasParticles('#showcase-connect-distance', {
  background: 'linear-gradient(100deg, #f80, #0f8 150%)',
  mouse: {
    connectDistMult: 0.4,
  },
  particles: {
    color: '#0006',
    connectDistance: 400,
  },
})

showcase.movement = new CanvasParticles('#showcase-movement', {
  background: '#60a',
  mouse: {
    interactionType: 1,
    connectDistMult: 1,
    distRatio: 1,
  },
  particles: {
    color: '#ffa',
    ppm: 120,
    connectDistance: 120,
    relSpeed: 3,
    relSize: 2,
    rotationSpeed: 40,
  },
})

showcase['pushing-gravity'] = new CanvasParticles('#showcase-pushing-gravity', {
  background: '#423',
  mouse: {
    interactionType: 1,
  },
  particles: {
    color: '#f45c',
    ppm: 150,
    connectDistance: 175,
  },
  gravity: {
    repulsive: 5,
    fricion: 0.95,
  },
})

showcase['pulling-gravity'] = new CanvasParticles('#showcase-pulling-gravity', {
  background: '#423',
  mouse: {
    distRatio: 1,
  },
  particles: {
    color: '#f45c',
    ppm: 1600,
    max: 160,
    connectDistance: 175,
    relSpeed: 0.2,
    rotationSpeed: 0.2,
  },
  gravity: {
    repulsive: 14,
    pulling: 4,
  },
})

showcase['hue-rotation'] = new CanvasParticles('#showcase-hue-rotation', {
  background: 'var(--bg)',
  particles: {
    color: 'hsl(0, 100%, 50%)',
  },
})

showcase['multiple-colors-1'] = new CanvasParticles('#showcase-multiple-colors-1', {
  background: 'black',
  particles: {
    color: 'yellow',
    ppm: 69,
    maxWork: 30,
  },
})

showcase['multiple-colors-2'] = new CanvasParticles('#showcase-multiple-colors-2', {
  background: 'transparent',
  particles: {
    color: 'aqua',
    ppm: 69,
    maxWork: 30,
  },
})

showcase['create-particles'] = new CanvasParticles('#showcase-create-particles', {
  background: 'var(--bg)',
  mouse: {
    interactionType: 1,
    connectDistMult: 10,
    distRatio: 1,
  },
  particles: {
    color: '#f40',
    connectDistance: 15,
    rotationSpeed: 0,
  },
})

// Create a sine wave of particles moving down
const createParticleSineWaves = () => {
  showcase['create-particles'].newParticles({ keepManual: false })

  for (let x = 0; x < showcase['create-particles'].width; x += 1) {
    const y1 = Math.sin(x / 50) * 150
    const y2 = Math.cos(x / 15) * 50 + 250
    showcase['create-particles'].createParticle(x, y1, 0, 1, 2)
    showcase['create-particles'].createParticle(x, y2, 0, 1, 3)
  }
}

createParticleSineWaves()
window.addEventListener('resize', createParticleSineWaves)

Object.entries(showcase).forEach(([_, showcase]) => showcase.start())
