import { showcase } from './initParticles.js'
import { loadPreset } from './presets.js'

// Update github image based on prefers-color-scheme

const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)')
const githubImg = document.querySelector('header nav li .button.github img')

const updateColorScheme = () => {
  const colorScheme = darkModePreference.matches ? 'dark' : 'light'
  githubImg.src = `img/github-${colorScheme}.webp`
}
updateColorScheme()
darkModePreference.onchange = updateColorScheme

// Sandbox

const sandboxError = document.getElementById('sandbox-error')
const sandboxOptions = document.getElementById('sandbox-options')

window.addEventListener('load', () => loadPreset('all'))

sandboxOptions.addEventListener('blur', function () {
  Prism.highlightElement(this)
})

// Togglables

const togglables = [...document.querySelectorAll('main .togglable input')]

togglables.forEach(checkbox => {
  checkbox.addEventListener('click', e => {
    const name = e.target.id.split(/-(.*)/s)[1]
    const op = e.target.checked ? 'start' : 'stop'
    showcase[name]?.[op]()

    togglables.forEach(checkbox => {
      const currentName = checkbox.id.split(/-(.*)/s)[1]
      if (name === currentName) return
      checkbox.checked = false
      showcase[currentName]?.stop()
    })
  })
})

// Runners

// https://css-tricks.com/snippets/javascript/htmlentities-for-javascript/
const htmlEntities = str => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const runButtons = [...document.querySelectorAll('main .run')]
let hue = 0
let hueRotateInterval
let sandbox

runButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (button.id === 'run-default-stop') showcase.default.stop()
    else if (button.id === 'run-default-start') showcase.default.start()
    else if (button.id === 'run-pushing-gravity-new') showcase['pulling-gravity'].newParticles()
    else if (button.id === 'run-pushing-gravity-max-work' || button.id === 'stop-pushing-gravity-max-work') {
      const maxWork = button.id === 'run-pushing-gravity-max-work' ? 12 : Infinity
      showcase['pulling-gravity'].options.particles.maxWork = maxWork

      const numberToken = document.querySelectorAll('#showcase article:has(#showcase-pulling-gravity) code .token.number')[2]
      numberToken.innerText = +maxWork
    } else if (button.id === 'run-hue-rotation') {
      clearInterval(hueRotateInterval)
      console.log('here')

      hueRotateInterval = setInterval(() => {
        const color = `hsl(${hue++}, 100%, 50%)`
        hue %= 360
        showcase['hue-rotation'].setParticleColor(color)

        const stringToken = document.querySelectorAll('#showcase article:has(#showcase-hue-rotation) code .token.string')[2]
        stringToken.innerText = color
      }, 20)
    } else if (button.id === 'stop-hue-rotation') clearTimeout(hueRotateInterval)
    else if (button.id === 'run-sandbox' || button.id === 'stop-sandbox') {
      sandbox?.stop()

      if (button.id === 'run-sandbox') {
        sandboxError.hidden = true
        let options
        try {
          eval(htmlEntities(sandboxOptions.innerText))
          if (options === undefined) throw new SyntaxError('Cannot assign options. Use syntax: options = <Object>')
        } catch (err) {
          sandboxError.innerText = err
          sandboxError.hidden = false
        }
        sandbox = new CanvasParticles('#cp-sandbox', options)
        sandbox.start()
      }
    }
  })
})

// Choices

const choiceLists = [...document.querySelectorAll('main .choice')]

choiceLists.forEach(list => {
  const buttons = list.querySelectorAll('button')

  list.addEventListener('click', e => {
    const button = e.target.closest('button')

    buttons.forEach(button => button.removeAttribute('class'))
    button.classList.add('active')

    if (list.id === 'installation-choice') {
      const content = document.querySelectorAll('#installation-choice + ul.content li')
      const choice = +button.getAttribute('data-choice')

      content.forEach(li => (li.hidden = true))
      content[choice].hidden = false
    }

    if (list.id === 'showcase-interact-choice') {
      const type = button.getAttribute('data-type')
      const interactionType = Math.min(type, 2)
      const distRatio = type == 3 ? 0.7 : 1
      const maxWork = type == 3 ? 20 : Infinity
      showcase.interact.options.mouse.interactionType = interactionType
      showcase.interact.options.mouse.distRatio = distRatio
      showcase.interact.options.particles.maxWork = maxWork

      const numberTokens = document.querySelectorAll('#showcase article:has(#showcase-interact) code .token.number')
      numberTokens[0].innerText = '' + interactionType
      numberTokens[2].innerText = '' + distRatio
      numberTokens[3].innerText = '' + maxWork
    }

    if (list.id === 'sandbox-preset-choice') {
      loadPreset(button.getAttribute('data-preset'))
      Prism.highlightElement(sandboxOptions)
    }
  })
})

// Color inputs

const backgroundInput = document.querySelector('#showcase-coloring-form label:first-of-type input')
const colorInput = document.querySelector('#showcase-coloring-form label:last-of-type input')

backgroundInput.addEventListener('input', function () {
  this.style.background = this.value
  showcase.coloring.setBackground(this.value)

  const stringTokens = document.querySelectorAll('#showcase article:has(#showcase-coloring) code .token.string')
  stringTokens[1].innerText = "'" + this.value + "'"
})

colorInput.addEventListener('input', function () {
  this.style.background = this.value
  showcase.coloring.options.particles.color = this.value

  const stringTokens = document.querySelectorAll('#showcase article:has(#showcase-coloring) code .token.string')
  stringTokens[2].innerText = "'" + this.value + "'"
})
