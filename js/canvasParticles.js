// Copyright (c) 2022–2025 Kyle Hoeckman, MIT License
// https://github.com/Khoeckman/canvasParticles/blob/main/LICENSE

'use strict'
;((root, factory) =>
  (typeof module === 'object' && module.exports && (module.exports = factory())) ||
  (typeof define === 'function' && define.amd && define(factory)) ||
  (root.CanvasParticles = factory()))(
  typeof self !== 'undefined' ? self : this,
  () =>
    class CanvasParticles {
      static version = '3.4.1'

      /**
       * Creates a new CanvasParticles instance.
       * @param {string} [selector] - The CSS selector for the canvas element.
       * @param {Object} [options={}] - Object structure: https://github.com/Khoeckman/canvasParticles?tab=readme-ov-file#options
       */
      constructor(selector, options = {}) {
        // Find and initialize canvas
        if (typeof selector !== 'string') throw new TypeError('selector is not a string')

        this.canvas = document.querySelector(selector)
        if (!(this.canvas instanceof HTMLCanvasElement)) throw new Error('selector does not point to a canvas')

        // Get 2d drawing functions
        this.ctx = this.canvas.getContext('2d')

        this.animating = false
        this.particles = []
        this.setOptions(options)

        // Event handling
        window.addEventListener('resize', this.#resizeCanvas)
        this.#resizeCanvas()

        window.addEventListener('mousemove', this.#updateMousePos)
        window.addEventListener('scroll', this.#updateMousePos)
      }

      #updateMousePos = event => {
        if (!this.animating) return

        if (event instanceof MouseEvent) {
          this.clientX = event.clientX
          this.clientY = event.clientY
        }
        const { left, top } = this.canvas.getBoundingClientRect()
        this.mouseX = this.clientX - left
        this.mouseY = this.clientY - top
      }

      #resizeCanvas = () => {
        this.canvas.width = this.canvas.offsetWidth
        this.canvas.height = this.canvas.offsetHeight

        // Prevent the mouse from affecting particles at (x: 0, y: 0) before it has moved.
        this.mouseX = Infinity
        this.mouseY = Infinity

        this.updateCount = Infinity
        this.width = this.canvas.width + this.options.particles.connectDist * 2
        this.height = this.canvas.height + this.options.particles.connectDist * 2
        this.offX = (this.canvas.width - this.width) / 2
        this.offY = (this.canvas.height - this.height) / 2

        if (this.options.resetOnResize || this.particles.length === 0) this.newParticles()
        else this.matchParticleCount()

        this.#updateParticleBounds()
      }

      #getParticleCount = () => {
        // Amount of particles to be created
        const particleCount = ~~((this.options.particles.ppm * this.width * this.height) / 1_000_000)
        this.particleCount = Math.min(this.options.particles.max, particleCount)

        if (!isFinite(this.particleCount)) throw new RangeError('number of particles must be finite. (options.particles.ppm)')
      }

      /**
       * Remove all particles and generate new ones.
       * The amount of new particles will match 'options.particles.ppm'
       * */
      newParticles = () => {
        this.#getParticleCount()

        this.particles = []
        for (let i = 0; i < this.particleCount; i++) this.createParticle()
      }

      /**
       * When resizing, add or remove some particles so that the final amount of particles will match 'options.particles.ppm'
       * */
      matchParticleCount = () => {
        this.#getParticleCount()

        this.particles = this.particles.slice(0, this.particleCount)
        while (this.particleCount > this.particles.length) this.createParticle()
      }

      createParticle = (posX, posY, dir, speed, size) => {
        size = size || 0.5 + Math.random() ** 5 * 2 * this.options.particles.relSize

        this.particles.push({
          posX: posX - this.offX || Math.random() * this.width, // Logical position in pixels
          posY: posY - this.offY || Math.random() * this.height, // Logical position in pixels
          x: posX, // Visual position in pixels
          y: posY, // Visual position in pixels
          velX: 0, // Horizonal speed in pixels per update
          velY: 0, // Vertical speed in pixels per update
          offX: 0, // Horizontal distance from drawn to logical position in pixels
          offY: 0, // Vertical distance from drawn to logical position in pixels
          dir: dir || Math.random() * 2 * Math.PI, // Direction in radians
          speed: speed || (0.5 + Math.random() * 0.5) * this.options.particles.relSpeed, // Velocity in pixels per update
          size, // Ray in pixels of the particle
        })
        this.#updateParticleBounds()
      }

      #updateParticleBounds = () => {
        this.particles.map(
          particle =>
            // Within these bounds the particle is considered visible
            (particle.bounds = {
              top: -particle.size,
              right: this.canvas.width + particle.size,
              bottom: this.canvas.height + particle.size,
              left: -particle.size,
            })
        )
      }

      /**
       * Calculates the gravity properties of each particle on the next frame.
       * Is executed once every 'options.framesPerUpdate' frames.
       * */
      #updateGravity = () => {
        const isRepulsiveEnabled = this.options.gravity.repulsive !== 0
        const isPullingEnabled = this.options.gravity.pulling !== 0

        if (isRepulsiveEnabled || isPullingEnabled) {
          const len = this.particleCount
          const gravRepulsiveMult = this.options.particles.connectDist * this.options.gravity.repulsive
          const gravPullingMult = this.options.particles.connectDist * this.options.gravity.pulling
          const maxRepulsiveDist = this.options.particles.connectDist / 2
          const maxGrav = this.options.particles.connectDist * 0.1

          for (let i = 0; i < len; i++) {
            for (let j = i + 1; j < len; j++) {
              // Code in this scope runs [particles ** 2 / 2] times!
              const particleA = this.particles[i]
              const particleB = this.particles[j]

              const distX = particleA.posX - particleB.posX
              const distY = particleA.posY - particleB.posY

              const dist = Math.sqrt(distX * distX + distY * distY)

              let angle, grav

              if (dist < maxRepulsiveDist) {
                // Apply repulsive force on all particles close together
                angle = Math.atan2(particleB.posY - particleA.posY, particleB.posX - particleA.posX)
                grav = (1 / dist) ** 1.8
                const gravMult = Math.min(maxGrav, grav * gravRepulsiveMult)
                const gravX = Math.cos(angle) * gravMult
                const gravY = Math.sin(angle) * gravMult
                particleA.velX -= gravX
                particleA.velY -= gravY
                particleB.velX += gravX
                particleB.velY += gravY
              }

              if (!isPullingEnabled) continue

              // Apply pulling force on all particles not close together
              if (angle === undefined) {
                angle = Math.atan2(particleB.posY - particleA.posY, particleB.posX - particleA.posX)
                grav = (1 / dist) ** 1.8
              }
              const gravMult = Math.min(maxGrav, grav * gravPullingMult)
              const gravX = Math.cos(angle) * gravMult
              const gravY = Math.sin(angle) * gravMult
              particleA.velX += gravX
              particleA.velY += gravY
              particleB.velX -= gravX
              particleB.velY -= gravY
            }
          }
        }
      }

      /**
       * Calculates the properties of each particle on the next frame.
       * Is executed once every 'options.framesPerUpdate' frames.
       * */
      #updateParticles = () => {
        for (let particle of this.particles) {
          // Moving the particle
          particle.dir =
            (particle.dir + Math.random() * this.options.particles.rotationSpeed * 2 - this.options.particles.rotationSpeed) % (2 * Math.PI)
          particle.velX *= this.options.gravity.friction
          particle.velY *= this.options.gravity.friction
          particle.posX =
            (particle.posX + particle.velX + ((Math.sin(particle.dir) * particle.speed) % this.width) + this.width) % this.width
          particle.posY =
            (particle.posY + particle.velY + ((Math.cos(particle.dir) * particle.speed) % this.height) + this.height) % this.height

          const distX = particle.posX + this.offX - this.mouseX
          const distY = particle.posY + this.offY - this.mouseY

          // Mouse events
          if (this.options.mouse.interactionType !== 0) {
            const distRatio = this.options.mouse.connectDist / Math.hypot(distX, distY)

            if (this.options.mouse.distRatio < distRatio) {
              particle.offX += (distRatio * distX - distX - particle.offX) / 4
              particle.offY += (distRatio * distY - distY - particle.offY) / 4
            } else {
              particle.offX -= particle.offX / 4
              particle.offY -= particle.offY / 4
            }
          }
          particle.x = particle.posX + particle.offX
          particle.y = particle.posY + particle.offY

          if (this.options.mouse.interactionType === 2) {
            // Make the mouse actually move the particles
            particle.posX = particle.x
            particle.posY = particle.y
          }
          particle.x += this.offX
          particle.y += this.offY

          particle.gridPos = this.#gridPos(particle) // The location of the particle relative to the visible center of the canvas
          particle.isVisible = particle.gridPos.x === 1 && particle.gridPos.y === 1
        }
      }

      /**
       * Determines the location of the particle in a 3x3 grid on the canvas.
       * The grid represents different regions of the canvas
       *
       * - { x: 0, y: 0 } = top-left
       * - { x: 1, y: 0 } = top
       * - { x: 2, y: 0 } = top-right
       * - { x: 0, y: 1 } = left
       * - { x: 1, y: 1 } = center (visible part of the canvas)
       * - { x: 2, y: 1 } = right
       * - { x: 0, y: 2 } = bottom-left
       * - { x: 1, y: 2 } = bottom
       * - { x: 2, y: 2 } = bottom-right
       *
       * @param {Object} particle - The coordinates of the particle.
       * @param {number} particle.x - The x-coordinate of the particle.
       * @param {number} particle.y - The y-coordinate of the particle.
       * @returns {Object} - The calculated grid position of the particle.
       * @returns {number} x - The horizontal grid position (0, 1, or 2).
       * @returns {number} y - The vertical grid position (0, 1, or 2).
       */
      #gridPos = particle => {
        return {
          x: (particle.x >= particle.bounds.left) + (particle.x > particle.bounds.right),
          y: (particle.y >= particle.bounds.top) + (particle.y > particle.bounds.bottom),
        }
      }

      /**
       * Determines whether a line between 2 particles crosses through the visible center of the canvas.
       * @param {Object} particleA - First particle with {gridPos, isVisible}.
       * @param {Object} particleB - Second particle with {gridPos, isVisible}.
       * @returns {boolean} - True if the line crosses the visible center, false otherwise.
       */
      #isLineVisible(particleA, particleB) {
        // Visible if either particle is in the center
        if (particleA.isVisible || particleB.isVisible) return true

        // Not visible if both particles are in the same vertical or horizontal line but outside the center
        return !(
          (particleA.gridPos.x === particleB.gridPos.x && particleA.gridPos.x !== 1) ||
          (particleA.gridPos.y === particleB.gridPos.y && particleA.gridPos.y !== 1)
        )
      }

      /**
       * Precomputes and caches stroke style strings for a given base color and all possible alpha values (0–255).
       * This is necessary because the rendering process involves up to [particles ** 2 / 2] lookups per frame.
       *
       * @param {string} color - The base color in the format `#rrggbb`.
       * @returns {Object} - A lookup table mapping each alpha value (0–255) to its corresponding stroke style string in the format `#rrggbbaa`.
       *
       * @example
       * const strokeStyleTable = this.#generateStrokeStyleTable("#abcdef");
       * strokeStyleTable[128] -> "#abcdef80"
       * strokeStyleTable[255] -> "#abcdefff"
       *
       * Notes:
       * - This function precomputes all possible stroke styles by appending a two-character
       *   hexadecimal alpha value (0x00–0xFF) to the base color.
       * - The table is stored in `this.strokeStyleTable` for quick lookups.
       */
      #generateStrokeStyleTable = color => {
        const table = {}

        // Precompute stroke styles for alpha values 0–255
        for (let alpha = 0; alpha < 256; alpha++) {
          // Convert to 2-character hex and combine base color with alpha
          table[alpha] = color + alpha.toString(16).padStart(2, '0')
        }
        return table
      }

      #renderParticles = () => {
        for (let particle of this.particles) {
          if (particle.isVisible) {
            // Draw the particle as a square if the size is smaller than 1 pixel (±183% faster than drawing only circles, using default settings)
            if (particle.size > 1) {
              // Draw circle
              this.ctx.beginPath()
              this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI)
              this.ctx.fill()
              this.ctx.closePath()
            } else {
              // Draw square (±335% faster than circle)
              this.ctx.fillRect(particle.x - particle.size, particle.y - particle.size, particle.size * 2, particle.size * 2)
            }
          }
        }
      }

      /**
       * Connects particles with lines if they are within the connection distance.
       */
      #renderConnections = () => {
        const len = this.particleCount
        const drawAll = this.options.particles.connectDist >= Math.min(this.canvas.width, this.canvas.height)

        const maxWorkPerParticle = this.options.particles.connectDist * this.options.particles.maxWork

        for (let i = 0; i < len; i++) {
          let particleWork = 0

          for (let j = i + 1; j < len; j++) {
            // Code in this scope runs [particles ** 2 / 2] times!
            const particleA = this.particles[i]
            const particleB = this.particles[j]

            if (!(drawAll || this.#isLineVisible(particleA, particleB))) continue
            // Draw a line only if will be visible

            const distX = particleA.x - particleB.x
            const distY = particleA.y - particleB.y

            const dist = Math.sqrt(distX * distX + distY * distY)

            if (dist > this.options.particles.connectDist) continue
            // Connect the 2 particles with a line only if the distance is small enough

            // Calculate the transparency of the line and lookup the stroke style
            if (dist > this.options.particles.connectDist / 2) {
              const alpha = ~~(Math.min(this.options.particles.connectDist / dist - 1, 1) * this.options.particles.opacity)
              this.ctx.strokeStyle = this.strokeStyleTable[alpha]
            } else {
              this.ctx.strokeStyle = this.options.particles.colorWithAlpha
            }

            // Draw the line
            this.ctx.beginPath()
            this.ctx.moveTo(particleA.x, particleA.y)
            this.ctx.lineTo(particleB.x, particleB.y)
            this.ctx.stroke()

            if ((particleWork += dist) >= maxWorkPerParticle) break
          }
        }
      }

      /**
       * Clear the canvas and render the particles and their connections onto the canvas.
       */
      #render = () => {
        this.canvas.width = this.canvas.width
        this.ctx.fillStyle = this.options.particles.colorWithAlpha
        this.ctx.lineWidth = 1

        this.#renderParticles()
        this.#renderConnections()
      }

      /**
       * Main animation loop that updates and renders the particles.
       * Runs recursively using `requestAnimationFrame`.
       */
      #animation = () => {
        if (!this.animating) return

        requestAnimationFrame(() => this.#animation())

        if (++this.updateCount >= this.options.framesPerUpdate) {
          this.updateCount = 0
          this.#updateGravity()
          this.#updateParticles()
          this.#render()
        }
      }

      /**
       * Public functions
       */

      /**
       * Starts the particle animation.
       * If already animating, does nothing.
       */
      start = () => {
        if (this.animating) return
        this.animating = true
        requestAnimationFrame(() => this.#animation())
      }

      /**
       * Stops the particle animation and clears the canvas.
       */
      stop = () => {
        this.animating = false
        this.canvas.width = this.canvas.width
      }

      /**
       * Public setters
       */

      /**
       * Set and validate the options object
       * @param {Object} options - Object structure: https://github.com/Khoeckman/canvasParticles?tab=readme-ov-file#options
       */
      setOptions = options => {
        const defaultIfNaN = (value, defaultValue) => (isNaN(+value) ? defaultValue : +value)

        // Format and store options
        this.options = {
          background: options.background ?? false,
          framesPerUpdate: defaultIfNaN(Math.max(1, parseInt(options.framesPerUpdate)), 1),
          resetOnResize: !!options.resetOnResize,
          mouse: {
            interactionType: defaultIfNaN(parseInt(options.mouse?.interactionType), 1),
            connectDistMult: defaultIfNaN(options.mouse?.connectDistMult, 2 / 3),
            distRatio: defaultIfNaN(options.mouse?.distRatio, 2 / 3),
          },
          particles: {
            color: options.particles?.color ?? 'black',
            ppm: defaultIfNaN(options.particles?.ppm, 100),
            max: defaultIfNaN(options.particles?.max, 500),
            maxWork: defaultIfNaN(Math.max(0, options.particles?.maxWork), Infinity),
            connectDist: defaultIfNaN(Math.max(1, options.particles?.connectDistance), 150),
            relSpeed: defaultIfNaN(Math.max(0, options.particles?.relSpeed), 1),
            relSize: defaultIfNaN(Math.max(0, options.particles?.relSize), 1),
            rotationSpeed: defaultIfNaN(Math.max(0, options.particles?.rotationSpeed / 100), 0.02),
          },
          gravity: {
            repulsive: defaultIfNaN(options.gravity?.repulsive, 0),
            pulling: defaultIfNaN(options.gravity?.pulling, 0),
            friction: defaultIfNaN(Math.max(0, Math.min(1, options.particles?.friction)), 0.8),
          },
        }

        this.setBackground(this.options.background)
        this.setMouseConnectDistMult(this.options.mouse.connectDistMult)
        this.setParticleColor(this.options.particles.color)
      }

      /**
       * Set canvas background
       * @param {string} background - The style of the background. Can be any CSS supported background format.
       */
      setBackground = background => {
        if (typeof background === 'string') this.canvas.style.background = this.options.background = background
      }

      /**
       * Transform distance multiplier to absolute distance
       * @param {float} connectDistMult - The maximum distance for the mouse to interact with the particles.
       * The value is multiplied by particles.connectDistance
       * @example 0.8 connectDistMult * 150 particles.connectDistance = 120 pixels
       */
      setMouseConnectDistMult = connectDistMult => {
        this.options.mouse.connectDist = this.options.particles.connectDist * (isNaN(connectDistMult) ? 2 / 3 : connectDistMult)
      }

      /**
       * Format particle color and opacity
       * @param {string} color - The color of the particles and their connections. Can be any CSS supported color format.
       */
      setParticleColor = color => {
        this.ctx.fillStyle = color

        // Check if `ctx.fillStyle` is in hex format ("#RRGGBB" without alpha).
        if (this.ctx.fillStyle[0] === '#') this.options.particles.opacity = 255
        else {
          // JavaScript's `ctx.fillStyle` ensures the color will otherwise be in rgba format (e.g., "rgba(136, 244, 255, 0.25)")

          // Extract the alpha value (0.25) from the rgba string, scale it to the range 0x00 to 0xff,
          // and convert it to an integer. This value represents the opacity as a 2-character hex string.
          this.options.particles.opacity = ~~(this.ctx.fillStyle.split(',').at(-1).slice(1, -1) * 255)

          // Example: extract 136, 244 and 255 from rgba(136, 244, 255, 0.25) and convert to hexadecimal '#rrggbb' format
          this.ctx.fillStyle = this.ctx.fillStyle.split(',').slice(0, -1).join(',') + ', 1)'
        }
        this.options.particles.color = this.ctx.fillStyle
        this.options.particles.colorWithAlpha = this.options.particles.color + this.options.particles.opacity.toString(16)

        this.strokeStyleTable = this.#generateStrokeStyleTable(this.options.particles.color) // Recalculate the stroke style table
      }
    }
)
