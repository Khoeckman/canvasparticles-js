// Version
document.getElementById('version').innerText = CanvasParticles.version ?? 'unknown'

// Populate canvas container
const root = document.querySelector(':root')

const canvasContainer = document.getElementById('canvas-container')

const startAnimationButton = document.getElementById('start-animation')
const stopAnimationButton = document.getElementById('stop-animation')

const benchmarkStatus = document.getElementById('benchmark-status')

// Prevent the UI from lagging while processing large amounts of data
const scheduleDataProcessing = (data, processCallback, chunkCallback = () => {}) => {
  return new Promise((resolve) => {
    const len = data.length

    if (!data || len === 0) {
      resolve()
      return
    }

    async function runChunk() {
      const start = performance.now()

      // Yield at least every 4ms
      while (i < len && performance.now() - start < 4) {
        processCallback(data[i], i++)
      }
      chunkCallback(len, Math.min(i, len))

      // Schedule the next chunk if more work remains
      if (i < len) {
        scheduler.postTask(runChunk, { priority: 'background' })
      } else {
        return resolve()
      }
    }

    let i = 0
    scheduler.postTask(runChunk, { priority: 'background' })
  })
}

const generateRandomCanvasOptions = (ppm) => {
  return {
    background: `hsl(${~~(Math.random() * 360)}, ${~~(Math.random() * 80)}%, ${~~(Math.random() * 100)}%)`,
    animation: {},
    mouse: {
      interactionType: 2,
    },
    particles: {
      color: `hsl(${~~(Math.random() * 360)}, ${80 + ~~(Math.random() * 20)}%, ${40 + ~~(Math.random() * 20)}%)`,
      ppm: 0 /* Particles are created later */,
      max: Infinity,
      maxWork: ~~(30 + (ppm / 999) * 20),
      connectDist: 100,
    },
  }
}

let mutex = false
let instances = []

const populateCanvasContainer = async () => {
  if (mutex) return
  mutex = true

  startAnimationButton.title = 'Creating canvas elements'
  stopAnimationButton.title = 'Creating canvas elements'
  startAnimationButton.disabled = true
  stopAnimationButton.disabled = true

  benchmarkStatus.innerText = 'Preparing…'

  // Allow the text to update before lagging the UI
  await new Promise(requestAnimationFrame)
  await new Promise(requestAnimationFrame)

  const count = +document.getElementById('canvas-count-number').value
  const ppm = +document.getElementById('ppm-number').value
  const width = +document.getElementById('canvas-width').value
  const height = +document.getElementById('canvas-height').value

  // Ultra fast destruction
  canvasContainer.innerHTML = ''

  root.style.setProperty('--benchmark-width', width + 'px')
  root.style.setProperty('--benchmark-height', height + 'px')

  // Gracefully destroy existing elements
  await scheduleDataProcessing(
    instances,
    (instance, i) => {
      instance.destroy()
    },
    (len, i) => {
      benchmarkStatus.innerText = 'Destroying old canvases ' + i + '/' + len
    }
  )
  instances = []

  const fragment = document.createDocumentFragment()

  await scheduleDataProcessing(
    Array(count),
    (instance, i) => {
      const canvas = document.createElement('canvas')
      canvas.id = 'benchmark-' + i

      instance = new CanvasParticles(canvas, generateRandomCanvasOptions(ppm))
      instances.push(instance)

      fragment.appendChild(instance.canvas)
    },
    (len, i) => {
      benchmarkStatus.innerText = 'Creating canvas elements ' + i + '/' + len
    }
  )

  benchmarkStatus.innerText = 'Adding canvases to the DOM…'

  // Allow the text to update before lagging the UI
  await new Promise(requestAnimationFrame)
  await new Promise(requestAnimationFrame)

  canvasContainer.appendChild(fragment)

  await scheduleDataProcessing(
    instances,
    (instance, i) => {
      instance.updateCanvasRect()
    },
    (len, i) => {
      benchmarkStatus.innerText = 'Getting positions of canvases ' + i + '/' + len
    }
  )

  await scheduleDataProcessing(
    instances,
    (instance, i) => {
      instance.resizeCanvas()
    },
    (len, i) => {
      benchmarkStatus.innerText = 'Resizing canvases ' + i + '/' + len
    }
  )

  await scheduleDataProcessing(
    instances,
    (instance, i) => {
      instance.option.particles.ppm = ppm
      instance.newParticles()
    },
    (len, i) => {
      benchmarkStatus.innerText = 'Filling canvases with particles ' + i + '/' + len
    }
  )

  benchmarkStatus.innerText = 'Created canvas elements'

  startAnimationButton.removeAttribute('title')
  stopAnimationButton.removeAttribute('title')
  startAnimationButton.disabled = null
  stopAnimationButton.disabled = null

  mutex = false
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
  this.value = Math.max(1, Math.min(9999, this.value))
})

ppmNumberInput.addEventListener('change', function () {
  this.value = Math.max(1, Math.min(999, this.value))
})

const canvasWidthInput = document.getElementById('canvas-width')
const canvasHeightInput = document.getElementById('canvas-height')

canvasWidthInput.addEventListener('change', function () {
  this.value = Math.max(1, Math.min(3200, this.value))
})

canvasHeightInput.addEventListener('change', function () {
  this.value = Math.max(1, Math.min(3200, this.value))
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
