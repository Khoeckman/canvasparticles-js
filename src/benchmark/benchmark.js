// Version
document.getElementById('version').innerText = CanvasParticles.version ?? 'unknown'

// Populate canvas container
const root = document.querySelector(':root')

const canvasContainer = document.getElementById('canvas-container')

const startAnimationButton = document.getElementById('start-animation')
const stopAnimationButton = document.getElementById('stop-animation')

const benchmarkStatus = document.getElementById('benchmark-status')

// Prevent the UI from lagging while executing a large number of operations
const singlethread = async (data, batch, callback) => {
  for (let i = 0; i < data.length; i++) {
    callback(data[i], i)

    // Allow one frame to render every `batch` operations
    if (i % batch == 0) await new Promise(requestAnimationFrame)
  }
}

const generateRandomCanvasOptions = () => {
  return {
    background: `hsl(${~~(Math.random() * 360)}, ${~~(Math.random() * 80)}%, ${~~(Math.random() * 100)}%)`,
    animation: {},
    mouse: {
      interactionType: 2,
    },
    particles: {
      color: `hsl(${~~(Math.random() * 360)}, ${80 + ~~(Math.random() * 20)}%, ${40 + ~~(Math.random() * 20)}%)`,
      ppm: 0,
      max: Infinity,
      maxWork: 99,
    },
  }
}

let instances = []

const populateCanvasContainer = async () => {
  startAnimationButton.title = 'Creating canvas elements'
  stopAnimationButton.title = 'Creating canvas elements'
  startAnimationButton.disabled = true
  stopAnimationButton.disabled = true

  benchmarkStatus.innerText = 'Creating canvas elements'

  const count = +document.getElementById('canvas-count-number').value
  const ppm = +document.getElementById('ppm-number').value
  const width = +document.getElementById('canvas-width').value
  const height = +document.getElementById('canvas-height').value

  root.style.setProperty('--benchmark-width', width + 'px')
  root.style.setProperty('--benchmark-height', height + 'px')

  // Gracefully destroy existing elements
  if (instances.length) {
    instances.forEach((instance) => instance.destroy())
    instances = []
  }

  const fragment = document.createDocumentFragment()

  for (let i = 0; i < count; i++) {
    const canvas = document.createElement('canvas')
    canvas.id = 'benchmark-' + i

    const instance = new CanvasParticles(canvas, generateRandomCanvasOptions())
    instances.push(instance)

    fragment.appendChild(instance.canvas)
  }

  canvasContainer.innerHTML = ''
  canvasContainer.appendChild(fragment)
  void canvasContainer.offsetHeight // Force reflow

  await singlethread(instances, 7, (instance, i) => {
    instance.resizeCanvas()
    benchmarkStatus.innerText = 'Resizing canvases ' + (i + 1) + '/' + instances.length
  })

  await singlethread(instances, 107, (instance, i) => {
    instance.option.particles.ppm = ppm
    instance.newParticles()
    benchmarkStatus.innerText = 'Filling canvases with particles ' + (i + 1) + '/' + instances.length
  })

  benchmarkStatus.innerText = 'Created canvas elements'

  startAnimationButton.removeAttribute('title')
  stopAnimationButton.removeAttribute('title')
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

startAnimationButton.addEventListener('click', () => {
  instances.forEach((instance) => instance.start())
  benchmarkStatus.innerText = 'Animating'
})
stopAnimationButton.addEventListener('click', () => {
  instances.forEach((instance) => instance.stop({ clear: false }))
  benchmarkStatus.innerText = 'Stopped'
})
