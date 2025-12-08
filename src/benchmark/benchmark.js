// Version
document.getElementById('version').innerText = CanvasParticles.version ?? 'unknown'

// Populate canvas container
const root = document.querySelector(':root')

const canvasContainer = document.getElementById('canvas-container')

const startAnimationButton = document.getElementById('start-animation')
const stopAnimationButton = document.getElementById('stop-animation')

const generateRandomCanvasOptions = (ppm) => {
  return {
    background: `hsl(${~~(Math.random() * 360)}, ${~~(Math.random() * 80)}%, ${~~(Math.random() * 100)}%)`,
    animation: {},
    mouse: {
      interactionType: 2,
    },
    particles: {
      color: `hsl(${~~(Math.random() * 360)}, ${80 + ~~(Math.random() * 20)}%, ${40 + ~~(Math.random() * 20)}%)`,
      ppm,
      max: Infinity,
      maxWork: 99,
    },
  }
}

let canvasElements = []

const populateCanvasContainer = () => {
  const count = +document.getElementById('canvas-count-number').value
  const ppm = +document.getElementById('ppm-number').value
  const width = +document.getElementById('canvas-width').value
  const height = +document.getElementById('canvas-height').value

  root.style.setProperty('--benchmark-width', width + 'px')
  root.style.setProperty('--benchmark-height', height + 'px')

  // Gracefully destroy existing elements
  if (canvasElements.length) {
    canvasElements.forEach((canvas) => canvas.instance.destroy())
    canvasElements = []
  }

  const fragment = document.createDocumentFragment()

  for (let i = 0; i < count; i++) {
    const canvas = document.createElement('canvas')
    canvas.id = 'benchmark-' + i

    fragment.appendChild(canvas)

    canvasElements.push(new CanvasParticles(canvas, generateRandomCanvasOptions(ppm)).canvas)
  }

  canvasContainer.innerHTML = ''
  canvasContainer.appendChild(fragment)

  startAnimationButton.disabled = null
  stopAnimationButton.disabled = null
}

// Handle settings form
const settingsForm = document.getElementById('settings-form')

// Form inputs

// Sync number field and slider
const canvasCountNumberInput = document.querySelector('#canvas-count-number')
const canvasCountRangeInput = document.querySelector('#canvas-count-range')

canvasCountNumberInput.addEventListener('input', (e) => (canvasCountRangeInput.value = e.target.value))
canvasCountRangeInput.addEventListener('input', (e) => (canvasCountNumberInput.value = e.target.value))

// Sync number field and slider
const ppmNumberInput = document.querySelector('#ppm-number')
const ppmRangeInput = document.querySelector('#ppm-range')

ppmNumberInput.addEventListener('input', (e) => (ppmRangeInput.value = e.target.value))
ppmRangeInput.addEventListener('input', (e) => (ppmNumberInput.value = e.target.value))

// Enforce min and max limits
canvasCountNumberInput.addEventListener('change', function () {
  this.value = Math.max(1, Math.min(999, this.value))
})

ppmNumberInput.addEventListener('change', function () {
  this.value = Math.max(1, Math.min(999, this.value))
})

// Form actions
settingsForm.addEventListener('submit', populateCanvasContainer)

startAnimationButton.addEventListener('click', () => canvasElements.forEach((canvas) => canvas.instance.start()))
stopAnimationButton.addEventListener('click', () =>
  canvasElements.forEach((canvas) => canvas.instance.stop({ clear: false }))
)
