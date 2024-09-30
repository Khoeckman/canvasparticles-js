new CanvasParticles('#cp-title', {
  background: 'var(--bg)',
  resetOnResize: false,
  mouse: {
    interactionType: 1,
    connectDistMult: 1,
    distRatio: 1,
  },
  particles: {
    color: '#888',
    ppm: 30,
    max: 200,
    connectDistance: 200,
  },
}).start()

export const showcase = {}

showcase.default = new CanvasParticles('#showcase-default')

showcase.coloring = new CanvasParticles('#showcase-coloring', {
  // Any CSS Supported value for the 'background' property
  background: 'rgb(21, 16, 25)',
  particles: {
    // Any CSS Supported color
    color: 'hsl(206, 100%, 77%)',
    max: 60,
  },
})

showcase.interact = new CanvasParticles('#showcase-interact', {
  background: '#000',
  mouse: {
    interactionType: 2,
    connectDistMult: 0.8,
    distRatio: 0.7,
  },
  particles: {
    color: '#f42',
    ppm: 150,
    max: 90,
    relSpeed: 2,
  },
})

showcase.quantity = new CanvasParticles('#showcase-quantity', {
  background: 'hsl(125, 42%, 35%)',
  mouse: {
    connectDistMult: 1,
  },
  particles: {
    color: 'rgb(150, 255, 105)',
    // Particles per million pixels the canvas covers
    ppm: 200,
    max: 300,
  },
})

showcase['connect-distance'] = new CanvasParticles('#showcase-connect-distance', {
  background: 'linear-gradient(100deg, #f80, #0f8 150%)',
  mouse: {
    interactionType: 2,
    connectDistMult: 0.3,
    distRatio: 1,
  },
  particles: {
    color: '#000',
    max: 60,
    connectDistance: 400,
    relSpeed: 2,
  },
})

showcase.movement = new CanvasParticles('#showcase-movement', {
  background: '#60a',
  mouse: {
    interactionType: 2,
    distRatio: 1,
  },
  particles: {
    color: '#ffa',
    max: 60,
    relSpeed: 3,
    rotationSpeed: 40,
  },
})

showcase['pushing-gravity'] = new CanvasParticles('#showcase-pushing-gravity', {
  background: '#423',
  particles: {
    color: '#f45c',
    ppm: 200,
    max: 100,
    connectDistance: 175,
  },
  gravity: {
    repulsive: 3,
    fricion: 0.995,
  },
})

showcase['pulling-gravity'] = new CanvasParticles('#showcase-pulling-gravity', {
  background: '#423',
  mouse: {
    interactionType: 2,
    distRatio: 1,
  },
  particles: {
    color: '#f45c',
    ppm: 150,
    max: 80,
    maxWork: 40,
    rotationSpeed: 5,
  },
  gravity: {
    repulsive: 5,
    pulling: 3,
  },
})

// Start all showcases without gravity
Object.values(showcase).forEach(showcase => {
  if (showcase.options.gravity.repulsive === 0 && showcase.options.gravity.pulling === 0) showcase.start()
})
