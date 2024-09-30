const presets = {
  all: `options = {
  background: '#151019',
  framesPerUpdate: 1,
  resetOnResize: false,
  mouse: {
    interactionType: 2,
    connectDistMult: 0.7,
    distRatio: 0.6,
  },
  particles: {
    color: '#8cf',
    ppm: 120,
    max: 250,
    maxWork: 30,
    connectDistance: 125,
    relSize: 1,
    relSpeed: 1,
    rotationSpeed: 2,
  },
  gravity: {
    repulsive: 0.55,
    pulling: 0,
    friction: 0.99,
  }
}`,

  gravity: `options = {
  background: '#423',
  mouse: {
    interactionType: 2,
  },
  particles: {
    color: '#f45',
    ppm: 200,
    maxWork: 20,
    connectDistance: 125,
    relSize: 0.5,
    relSpeed: 5,
    rotationSpeed: 5,
  },
  gravity: {
    repulsive: 3.5,
    pulling: 1.25,
    friction: 0.99,
  }
}`,

  shapes: `options = {
  background: 'linear-gradient(100deg, #f80, #0f8 150%)',
  mouse: {
    connectDistMult: 0.7,
  },
  particles: {
    color: 'white',
    ppm: 125,
    connectDistance: 175,
  },
  gravity: {
    repulsive: 3,
  },
}`,

  empty: `options = {
  // have fun!
}`,
}

const playgroundOptions = document.getElementById('playground-options')

export const loadPreset = presetName => {
  playgroundOptions.textContent = presets[presetName]
  Prism.highlightElement(playgroundOptions)
}
