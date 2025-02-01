const title = new CanvasParticles('#cp-title', {
  background: 'var(--bg)',
  mouse: {
    interactionType: 1,
    connectDistMult: 1,
    distRatio: 1,
  },
  particles: {
    color: '#848888',
    ppm: 40,
    max: 200,
    connectDistance: 200,
  },
})
title.start()

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
    maxWork: 40,
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
    ppm: 250,
    max: 300,
    connectDistance: 125,
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
    color: '#0006',
    ppm: 60,
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
    maxWork: 10,
    relSpeed: 3,
    relSize: 2,
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
    ppm: 200,
    max: 120,
    relSpeed: 0,
    rotationSpeed: 0,
  },
  gravity: {
    repulsive: 10,
    pulling: 3,
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
  mouse: {
    interactionType: 2,
  },
  particles: {
    color: 'yellow',
    ppm: 69,
    maxWork: 30,
  },
})

showcase['multiple-colors-2'] = new CanvasParticles('#showcase-multiple-colors-2', {
  background: 'transparent',
  mouse: {
    interactionType: 2,
  },
  particles: {
    color: 'aqua',
    ppm: 69,
    maxWork: 30,
  },
})

const startIgnore = ['pushing-gravity', 'pulling-gravity']

Object.entries(showcase).forEach(([name, showcase]) => {
  if (!startIgnore.includes(name)) showcase.start()
})
