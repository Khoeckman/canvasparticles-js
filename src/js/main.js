import { showcase } from './initParticles.js'
import { loadPreset, loadWorkspace } from './workspaces.js'

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
      showcase[currentName]?.stop({ clear: false })
    })
  })
})

// Runners

const runButtons = [...document.querySelectorAll('main .run')]
let hue = 0
let hueRotateInterval
const sandbox = new CanvasParticles('#cp-sandbox', { animation: { startOnEnter: false } })

runButtons.forEach(button => {
  const handler = (() => {
    switch (button.id) {
      case 'run-default-stop':
        return () => showcase.default.stop()

      case 'run-default-stop-noclear':
        return () => showcase.default.stop({ clear: false })

      case 'run-default-start':
        return () => showcase.default.start()

      case 'run-pushing-gravity-new':
        return () => showcase['pulling-gravity'].newParticles()

      case 'run-pushing-gravity-max-work':
      case 'stop-pushing-gravity-max-work':
        return () => {
          const maxWork = button.id === 'run-pushing-gravity-max-work' ? 12 : Infinity
          showcase['pulling-gravity'].options.particles.maxWork = maxWork

          const numberToken = document.querySelectorAll('#showcase article:has(#showcase-pulling-gravity) code .token.number')[2]
          numberToken.innerText = +maxWork
        }

      case 'run-hue-rotation':
        return () => {
          clearInterval(hueRotateInterval)

          hueRotateInterval = setInterval(() => {
            const color = `hsl(${hue++}, 100%, 50%)`
            hue %= 360
            showcase['hue-rotation'].setParticleColor(color)

            const stringToken = document.querySelectorAll('#showcase article:has(#showcase-hue-rotation) code .token.string')[2]
            stringToken.innerText = color
          }, 20)
        }

      case 'stop-hue-rotation':
        return () => clearInterval(hueRotateInterval)

      case 'run-sandbox':
        return () => {
          sandboxError.hidden = true

          try {
            eval(sandboxOptions.innerText)
          } catch (err) {
            sandboxError.innerText = err
            sandboxError.hidden = false
          }
          sandbox.matchParticleCount()
          sandbox.start()
        }

      case 'stop-sandbox':
        return () => sandbox.stop({ clear: false })
    }
  })()

  button.addEventListener('click', handler)
})

// Choices

const choiceLists = [...document.querySelectorAll('main .choice')]

choiceLists.forEach(list => {
  const handler = (() => {
    const buttons = list.querySelectorAll('button')

    switch (list.id) {
      case 'installation-choice':
        return e => {
          const button = e.target.closest('button')

          buttons.forEach(button => button.removeAttribute('class'))
          button.classList.add('active')

          const content = document.querySelectorAll('#installation-choice + ul.content li')
          const choice = +button.getAttribute('data-choice')

          content.forEach(li => (li.hidden = true))
          content[choice].hidden = false
        }

      case 'showcase-interact-choice':
        return e => {
          const button = e.target.closest('button')

          buttons.forEach(button => button.removeAttribute('class'))
          button.classList.add('active')

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

      case 'sandbox-preset-choice':
        return e => {
          const button = e.target.closest('button')

          buttons.forEach(button => button.removeAttribute('class'))
          document
            .getElementById('sandbox-workspace-choice')
            .querySelectorAll('button')
            .forEach(button => button.removeAttribute('class'))
          button.classList.add('active')

          loadPreset(button.getAttribute('data-preset'))
          Prism.highlightElement(sandboxOptions)
        }
      case 'sandbox-workspace-choice':
        return e => {
          const button = e.target.closest('button')

          buttons.forEach(button => button.removeAttribute('class'))
          document
            .getElementById('sandbox-preset-choice')
            .querySelectorAll('button')
            .forEach(button => button.removeAttribute('class'))
          button.classList.add('active')

          loadWorkspace(button.getAttribute('data-workspace'))
          Prism.highlightElement(sandboxOptions)
        }
    }
  })()

  list.addEventListener('click', handler)
})

// Color inputs

const backgroundInput = document.querySelector('#showcase-coloring-form label:first-of-type input')
const colorInput = document.querySelector('#showcase-coloring-form label:last-of-type input')

backgroundInput.addEventListener('input', function () {
  this.style.background = this.value
  showcase.coloring.setBackground(this.value)

  const stringTokens = document.querySelectorAll('#showcase article:has(#showcase-coloring) code .token.string')
  stringTokens[1].innerText = `'${this.value}'`
})

colorInput.addEventListener('input', function () {
  this.style.background = this.value
  showcase.coloring.setParticleColor(this.value)

  const stringTokens = document.querySelectorAll('#showcase article:has(#showcase-coloring) code .token.string')
  stringTokens[2].innerText = `'${this.value}'`
})
