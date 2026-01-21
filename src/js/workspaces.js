import HyperStorage from './HyperStorage.mjs'

const presets = {
  all: `sandbox.options = {
  background: '#151019',
  animation: {
    startOnEnter: true,
    stopOnLeave: true,
  },
  mouse: {
    interactionType: CanvasParticles.interactionType.MOVE, // = 2
    connectDistMult: 0.7,
    distRatio: 0.6,
  },
  particles: {
    generationType: CanvasParticles.generationType.REGEN, // = 2
    drawLines: true,
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
    friction: 0.9,
    preventExplosions: true,
  },
  debug: {
    drawGrid: false,
    drawIndexes: false,
  }
}`,

  dots: `sandbox.options = {
  background: '#423',
  mouse: {
    connectDistMult: 125,
    distRatio: 1,
  },
  particles: {
    drawLines: false,
    color: '#f75',
    ppm: 999,
    connectDistance: 1,
    relSpeed: 0.1,
    rotationSpeed: 3,
  }
}`,

  shapes: `sandbox.options = {
  background: 'linear-gradient(100deg, #f80, #0f8 150%)',
  mouse: {
    interactionType: 1,
    connectDistMult: 0.7,
  },
  particles: {
    color: 'white',
    ppm: 125,
    connectDistance: 175,
  },
  gravity: {
    repulsive: 3,
    friction: 0.8,
  },
}`,

  empty: `sandbox.options = {
  // have fun!
}`,
}

const workspaceStore = new HyperStorage('cpjs.sandbox.workspace', {})

const sandboxOptions = document.getElementById('sandbox-options')
let selectedWorkspaceName = null

export const loadPreset = (presetName) => {
  selectedWorkspaceName = null
  sandboxOptions.textContent = presets[presetName]
  Prism.highlightElement(sandboxOptions)
}

export const loadWorkspace = (workspaceName) => {
  selectedWorkspaceName = workspaceName

  if (!workspaceStore.value?.[workspaceName]) workspaceStore.value[workspaceName] = presets.empty

  sandboxOptions.textContent = workspaceStore.value[workspaceName]
  Prism.highlightElement(sandboxOptions)
}

const saveWorkspace = (workspaceName, code) => {
  workspaceStore.value = { ...workspaceStore.value, [workspaceName]: code }
}

sandboxOptions.addEventListener('input', function () {
  saveWorkspace(selectedWorkspaceName, this.innerText)
})
