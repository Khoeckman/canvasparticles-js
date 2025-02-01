// Version
document.getElementById('version').innerText = CanvasParticles.version ?? 'unknown'

// Helper
const getRandomColor = (min = 0, max = 255) => {
  const range = max - min
  const red = min + Math.floor(Math.random() * range)
  const green = min + Math.floor(Math.random() * range)
  const blue = min + Math.floor(Math.random() * range)
  return `rgb(${red}, ${green}, ${blue})`
}

// Populate canvas container
const canvasContainer = document.getElementById('canvas-container')

let canvasElements = []

const populateCanvasContainer = () => {
  const count = +document.getElementById('canvas-count-number').value
  const ppm = +document.getElementById('ppm-number').value
  const width = +document.getElementById('canvas-width').value
  const height = +document.getElementById('canvas-height').value

  canvasContainer.innerHTML = ''
  canvasElements = []

  for (let i = 0; i < count; i++) {
    const canvas = document.createElement('canvas')
    canvas.id = '#benchmark-' + i
    canvas.width = width
    canvas.height = height
    canvasContainer.appendChild(canvas)

    canvasElements.push(
      new CanvasParticles(canvas, {
        background: getRandomColor(0, 255),
        animation: {},
        mouse: {
          interactionType: 2,
        },
        particles: {
          color: getRandomColor(0, 255),
          ppm,
          maxWork: 99,
        },
      }).canvas
    )
  }
}

// Handle settings form
const settingsForm = document.getElementById('settings-form')

// Form inputs

// Sync number field and slider
const canvasCountNumberInput = document.querySelector('#canvas-count-number')
const canvasCountRangeInput = document.querySelector('#canvas-count-range')

canvasCountNumberInput.addEventListener('input', e => (canvasCountRangeInput.value = e.target.value))
canvasCountRangeInput.addEventListener('input', e => (canvasCountNumberInput.value = e.target.value))

// Sync number field and slider
const ppmNumberInput = document.querySelector('#ppm-number')
const ppmRangeInput = document.querySelector('#ppm-range')

ppmNumberInput.addEventListener('input', e => (ppmRangeInput.value = e.target.value))
ppmRangeInput.addEventListener('input', e => (ppmNumberInput.value = e.target.value))

// Enforce min and max limits
canvasCountNumberInput.addEventListener('change', function () {
  this.value = Math.max(1, Math.min(999, this.value))
})

ppmNumberInput.addEventListener('change', function () {
  this.value = Math.max(1, Math.min(999, this.value))
})

// Form actions
settingsForm.addEventListener('submit', populateCanvasContainer)

document.getElementById('start-animation').addEventListener('click', () => canvasElements.forEach(canvas => canvas.instance.start()))
document.getElementById('stop-animation').addEventListener('click', () => canvasElements.forEach(canvas => canvas.instance.stop()))
