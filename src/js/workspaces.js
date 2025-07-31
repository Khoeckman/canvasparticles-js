const presets = {
  all: `sandbox.setOptions({
  background: '#151019',
  framesPerUpdate: 1,
  animation: {
    startOnEnter: true,
    stopOnLeave: true,
  },
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
    regenerateOnResize: false
  },
  gravity: {
    repulsive: 0.55,
    pulling: 0,
    friction: 0.99,
  }
})`,

  gravity: `sandbox.setOptions({
  background: '#423',
  animation: {
    startOnEnter: false,
  },
  mouse: {
    interactionType: 2,
  },
  particles: {
    color: '#f45',
    ppm: 175,
    maxWork: 30,
    connectDistance: 125,
    relSize: 0.5,
    relSpeed: 5,
    rotationSpeed: 5,
  },
  gravity: {
    repulsive: 5,
    pulling: 0.3,
    friction: 0.99,
  }
})`,

  shapes: `sandbox.setOptions({
  background: 'linear-gradient(100deg, #f80, #0f8 150%)',
  mouse: {
    connectDistMult: 0.7,
  },
  particles: {
    color: 'white',
    ppm: 125,
    connectDistance: 175,
    regenerateOnResize: true
  },
  gravity: {
    repulsive: 3,
  },
})`,

  empty: `sandbox.setOptions({
  // have fun!
})`,
}

const sandboxOptions = document.getElementById('sandbox-options')
let selectedWorkspace = null

export const loadPreset = presetName => {
  selectedWorkspace = null
  sandboxOptions.textContent = presets[presetName]
  Prism.highlightElement(sandboxOptions)
}

export const loadWorkspace = workspaceName => {
  selectedWorkspace = workspaceName
  let workspace = localStorage.getItem('cpjs.sandbox.workspace.' + workspaceName)

  if (!workspace) {
    localStorage.setItem('cpjs.sandbox.workspace.' + workspaceName, presets.empty)
    workspace = presets.empty
  }

  sandboxOptions.textContent = workspace
  Prism.highlightElement(sandbox)
}

const saveSelectedWorkspace = data => {
  if (!selectedWorkspace) return
  localStorage.setItem('cpjs.sandbox.workspace.' + selectedWorkspace, data)
}

sandboxOptions.addEventListener('input', () => saveSelectedWorkspace(sandboxOptions.innerText))
