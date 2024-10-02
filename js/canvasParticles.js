// Copyright (c) 2022–2024 Kyle Hoeckman, MIT License
// https://github.com/Khoeckman/canvasParticles/blob/main/LICENSE

/**
 * Canvas Particles JS
 *
 * @class CanvasParticles
 * @version 3.2.13
 */
class CanvasParticles {
  static version = '3.2.13'
  animating = false

  /**
   * Creates a new CanvasParticles instance.
   * @param {string} [selector] - The CSS selector for the canvas element.
   * @param {Object} [options={}] - Object structure: https://github.com/Khoeckman/canvasParticles?tab=readme-ov-file#options
   */
  constructor(selector, options = {}) {
    // Find and initialize canvas
    if (typeof selector !== 'string') throw new TypeError('selector is not a string')

    this.canvas = document.querySelector(selector)
    if (!(this.canvas instanceof HTMLCanvasElement)) throw new ReferenceError('selector does not point to a canvas')

    // Get 2d drawing functions
    this.ctx = this.canvas.getContext('2d')

    // Format and store options
    this.options = {
      background: options.background ?? false,
      framesPerUpdate: Math.max(1, parseInt(options.framesPerUpdate) ?? 1),
      resetOnResize: !!(options.resetOnResize ?? false),
      mouse: {
        interactionType: +(parseInt(options.mouse?.interactionType) ?? 1),
        connectDistMult: +(options.mouse?.connectDistMult ?? 2 / 3),
        distRatio: +(options.mouse?.distRatio ?? 2 / 3),
      },
      particles: {
        color: options.particles?.color ?? 'black',
        ppm: +(options.particles?.ppm ?? 100),
        max: +(options.particles?.max ?? 500),
        maxWork: Math.max(0, options.particles?.maxWork ?? Infinity),
        connectDist: Math.max(1, options.particles?.connectDistance ?? 150),
        relSpeed: Math.max(0, options.particles?.relSpeed ?? 1),
        relSize: Math.max(0, options.particles?.relSize ?? 1),
        rotationSpeed: Math.max(0, (options.particles?.rotationSpeed ?? 2) / 100),
      },
      gravity: {
        repulsive: +(options.gravity?.repulsive ?? 0),
        pulling: +(options.gravity?.pulling ?? 0),
        friction: Math.max(0, options.particles?.friction ?? 0.8),
      },
    }

    // Use default value if number could not be formatted
    if (isNaN(this.options.framesPerUpdate)) this.options.framesPerUpdate = 1

    if (isNaN(this.options.mouse.interactionType)) this.options.mouse.interactionType = 1
    if (isNaN(this.options.mouse.connectDistMult)) this.options.mouse.connectDistMult = 2 / 3
    if (isNaN(this.options.mouse.distRatio)) this.options.mouse.distRatio = 2 / 3

    if (isNaN(this.options.particles.ppm)) this.options.particles.ppm = 100
    if (isNaN(this.options.particles.max)) this.options.particles.max = 500
    if (isNaN(this.options.particles.maxWork)) this.options.particles.maxWork = Infinity
    if (isNaN(this.options.particles.connectDist)) this.options.particles.connectDist = 150
    if (isNaN(this.options.particles.relSpeed)) this.options.particles.relSpeed = 1
    if (isNaN(this.options.particles.relSize)) this.options.particles.relSize = 1
    if (isNaN(this.options.particles.rotationSpeed)) this.options.particles.rotationSpeed = 0.02

    if (isNaN(this.options.gravity.repulsive)) this.options.gravity.repulsive = 0
    if (isNaN(this.options.gravity.pulling)) this.options.gravity.pulling = 0
    if (isNaN(this.options.gravity.friction)) this.options.gravity.friction = 0.9

    this.setBackground(this.options.background)
    this.setParticleColor(this.options.particles.color)

    // Transform distance multiplier to absolute distance
    this.options.mouse.connectDist = this.options.particles.connectDist * this.options.mouse.connectDistMult
    delete this.options.mouse.connectDistMult

    // Event handling
    window.addEventListener('resize', this.resizeCanvas)
    this.resizeCanvas()

    const updateMousePos = event => {
      if (!this.animating) return

      if (event instanceof MouseEvent) {
        this.clientX = event.clientX
        this.clientY = event.clientY
      }
      this.mouseX = this.clientX - this.canvas.offsetLeft + window.scrollX
      this.mouseY = this.clientY - this.canvas.offsetTop + window.scrollY
    }
    window.addEventListener('mousemove', updateMousePos)
    window.addEventListener('scroll', updateMousePos)
  }

  resizeCanvas = () => {
    this.canvas.width = this.canvas.offsetWidth
    this.canvas.height = this.canvas.offsetHeight

    // Hide mouse before first MouseMove event
    this.mouseX = Infinity
    this.mouseY = Infinity

    this.updateCount = Infinity
    this.width = this.canvas.width + this.options.particles.connectDist * 2
    this.height = this.canvas.height + this.options.particles.connectDist * 2
    this.offX = (this.canvas.width - this.width) / 2
    this.offY = (this.canvas.height - this.height) / 2

    // Amount of particles to be created
    const particles = Math.floor((this.options.particles.ppm * this.width * this.height) / 1000000)
    this.len = Math.min(this.options.particles.max, particles)

    if (this.options.resetOnResize || typeof this.particles === 'undefined') this.newParticles()
    else this.matchParticlesAmount()
  }

  /**
   * Remove all particles and generates new ones.
   * The amount of new particles will match 'options.particles.ppm'
   * */
  newParticles = () => {
    if (this.len === Infinity) throw new RangeError('cannot create an infinite amount of particles')
    this.particles = []
    for (let i = 0; i < this.len; i++) this.createParticle()
  }

  /**
   * When resizing, add or remove some particles.
   * The final amount of particles will match 'options.particles.ppm'
   * */
  matchParticlesAmount = () => {
    if (this.len === Infinity) throw new RangeError('cannot create an infinite amount of particles')
    this.particles = this.particles.slice(0, this.len)
    while (this.len > this.particles.length) this.createParticle()
  }

  createParticle = function (posX, posY, dir, speed, size) {
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
      size: size || 0.5 + Math.random() ** 5 * 2 * this.options.particles.relSize, // Ray in pixels of the particle
    })
    const point = this.particles.at(-1)
    point.gridPos = this.gridPos(point) // The location of the particle relative to the visible center of the canvas
    point.isVisible = point.gridPos.x === 1 && point.gridPos.y === 1
  }

  /**
   * Calculates the properties of each particle on the next frame.
   * Is executed once every 'options.framesPerUpdate' frames.
   * */
  update = () => {
    const len = this.len
    const enabledRepulsive = this.options.gravity.repulsive !== 0
    const enabledPulling = this.options.gravity.pulling !== 0
    const gravRepulsiveMult = this.options.particles.connectDist * this.options.gravity.repulsive
    const gravPullingMult = this.options.particles.connectDist * this.options.gravity.pulling

    if (enabledRepulsive || enabledPulling) {
      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          // Code in this scope runs [particles ** 2 / 2] times!
          const pointA = this.particles[i]
          const pointB = this.particles[j]
          const dist = Math.hypot(pointA.posX - pointB.posX, pointA.posY - pointB.posY)
          const angle = Math.atan2(pointB.posY - pointA.posY, pointB.posX - pointA.posX)

          if (dist < this.options.particles.connectDist / 2) {
            // Apply repulsive force on all particles close together
            const grav = (1 / Math.max(dist, 10)) ** 1.8 * gravRepulsiveMult
            const gravX = Math.cos(angle) * grav
            const gravY = Math.sin(angle) * grav
            pointA.velX -= gravX
            pointA.velY -= gravY
            pointB.velX += gravX
            pointB.velY += gravY
          } else if (enabledPulling) {
            // Apply pulling force on all particles not close together
            const grav = (1 / Math.max(dist, 10)) ** 1.8 * gravPullingMult
            const gravX = Math.cos(angle) * grav
            const gravY = Math.sin(angle) * grav
            pointA.velX += gravX
            pointA.velY += gravY
            pointB.velX -= gravX
            pointB.velY -= gravY
          }
        }
      }
    }

    for (let point of this.particles) {
      // Moving the particle
      point.dir =
        (point.dir + Math.random() * this.options.particles.rotationSpeed * 2 - this.options.particles.rotationSpeed) % (2 * Math.PI)
      point.velX *= this.options.gravity.friction
      point.velY *= this.options.gravity.friction
      point.posX = (point.posX + point.velX + ((Math.sin(point.dir) * point.speed) % this.width) + this.width) % this.width
      point.posY = (point.posY + point.velY + ((Math.cos(point.dir) * point.speed) % this.height) + this.height) % this.height

      const distX = point.posX + this.offX - this.mouseX
      const distY = point.posY + this.offY - this.mouseY

      // Mouse events
      if (this.options.mouse.interactionType !== 0) {
        const distRatio = this.options.mouse.connectDist / Math.hypot(distX, distY)

        if (this.options.mouse.distRatio < distRatio) {
          point.offX += (distRatio * distX - distX - point.offX) / 4
          point.offY += (distRatio * distY - distY - point.offY) / 4
        } else {
          point.offX -= point.offX / 4
          point.offY -= point.offY / 4
        }
      }
      point.x = point.posX + point.offX
      point.y = point.posY + point.offY

      if (this.options.mouse.interactionType === 2) {
        // Make the mouse actually move the particles
        point.posX = point.x
        point.posY = point.y
      }
      point.x += this.offX
      point.y += this.offY

      point.gridPos = this.gridPos(point)
      point.isVisible = point.gridPos.x === 1 && point.gridPos.y === 1
    }
  }

  /**
   * Determines the location of the particle in a 3x3 grid on the canvas.
   * The grid represents different regions of the canvas:
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
   * @param {Object} point - The coordinates of the particle.
   * @param {number} point.x - The x-coordinate of the particle.
   * @param {number} point.y - The y-coordinate of the particle.
   * @returns {Object} - The calculated grid position of the particle.
   * @returns {number} x - The horizontal grid position (0, 1, or 2).
   * @returns {number} y - The vertical grid position (0, 1, or 2).
   */
  gridPos = function (point) {
    return {
      x: (point.x >= 0) + (point.x > this.width),
      y: (point.y >= 0) + (point.y > this.height),
    }
  }

  /**
   * Determines whether a line between 2 particles crosses through the visible center of the canvas.
   * @param {Object} pointA - First particle with {gridPos, isVisible}.
   * @param {Object} pointB - Second particle with {gridPos, isVisible}.
   * @returns {boolean} - True if the line crosses the visible center, false otherwise.
   */
  isLineVisible = function (pointA, pointB) {
    // Visible if either point is in the center
    if (pointA.isVisible || pointB.isVisible) return true

    // Not visible if both points are in the same vertical or horizontal line but outside the center
    return !(
      (pointA.gridPos.x === pointB.gridPos.x && pointA.gridPos.x !== 1) ||
      (pointA.gridPos.y === pointB.gridPos.y && pointA.gridPos.y !== 1)
    )
  }

  /**
   * Renders the particles and their connections onto the canvas.
   * Connects particles with lines if they are within the connection distance.
   */
  render = () => {
    this.canvas.width = this.canvas.width // Clear canvas
    this.ctx.fillStyle = this.options.particles.color + this.options.particles.opacity.hex
    this.ctx.lineWidth = 1

    for (let point of this.particles) {
      if (point.isVisible) {
        // Draw the particle as a square if the size is smaller than 1 pixel (±183% faster than drawing only circles)
        if (point.size > 1) {
          // Draw circle
          this.ctx.beginPath()
          this.ctx.arc(point.x, point.y, point.size, 0, 2 * Math.PI)
          this.ctx.fill()
          this.ctx.closePath()
        } else {
          // Draw square (±335% faster than circle)
          this.ctx.fillRect(point.x - point.size, point.y - point.size, point.size * 2, point.size * 2)
        }
      }
    }

    const len = this.len
    const drawAll = this.options.particles.connectDist >= Math.min(this.width, this.height)

    const maxWorkPerParticle = this.options.particles.connectDist * this.options.particles.maxWork
    const maxWork = maxWorkPerParticle * len
    let work = 0

    for (let i = 0; i < len; i++) {
      let particleWork = 0

      for (let j = i + 1; j < len; j++) {
        // Code in this scope runs [particles ** 2 / 2] times!
        const pointA = this.particles[i]
        const pointB = this.particles[j]

        // Draw a line if its visible
        if (this.isLineVisible(pointA, pointB) | drawAll) {
          const distX = pointA.x - pointB.x
          const distY = pointA.y - pointB.y
          const dist = Math.sqrt(distX * distX + distY * distY)

          // Connect the 2 points with a line if the distance is small enough
          if (dist < this.options.particles.connectDist) {
            // Calculate the transparency of the line
            if (dist >= this.options.particles.connectDist / 2) {
              const alpha = Math.floor(
                Math.min(this.options.particles.connectDist / dist - 1, 1) * this.options.particles.opacity.value
              ).toString(16)
              this.ctx.strokeStyle = this.options.particles.color + (alpha.length === 2 ? alpha : '0' + alpha)
            } else this.ctx.strokeStyle = this.options.particles.color + this.options.particles.opacity.hex

            // Draw the line
            this.ctx.beginPath()
            this.ctx.moveTo(pointA.x, pointA.y)
            this.ctx.lineTo(pointB.x, pointB.y)
            this.ctx.stroke()

            if ((work += dist) >= maxWork || (particleWork += dist) >= maxWorkPerParticle) break
          }
        }
      }
      if (work >= maxWork) break
    }
  }

  /**
   * Main animation loop that updates and renders the particles.
   * Runs recursively using `requestAnimationFrame`.
   */
  animation = () => {
    if (!this.animating) return

    requestAnimationFrame(() => this.animation())

    if (++this.updateCount >= this.options.framesPerUpdate) {
      this.updateCount = 0
      this.update()
      this.render()
    }
  }

  /**
   * Starts the particle animation.
   * If already animating, does nothing.
   */
  start = () => {
    if (this.animating) return
    this.animating = true
    requestAnimationFrame(() => this.animation())
  }

  /**
   * Stops the particle animation and clears the canvas.
   */
  stop = () => {
    this.animating = false
    this.canvas.width = this.canvas.width
  }

  setBackground = background => {
    if (typeof background === 'string') this.canvas.style.background = this.options.background = background
  }

  /**
   * Format particle color and opacity
   * @param {string} color - The color of the particles and their connections. Can be any CSS supported color format.
   */
  setParticleColor = color => {
    this.ctx.fillStyle = color

    if (this.ctx.fillStyle[0] === '#') {
      this.options.particles.opacity = { value: 255, hex: 'ff' }
      this.options.particles.color = this.ctx.fillStyle
    } else {
      // Example: extract 0.25 from rgba(136, 244, 255, 0.25) and convert to range 0x00 to 0xff and store as a 2 char string
      const value = ~~(this.ctx.fillStyle.split(',').at(-1).slice(1, -1) * 255)
      this.options.particles.opacity = {
        value: value,
        hex: value.toString(16),
      }

      // Example: extract 136, 244 and 255 from rgba(136, 244, 255, 0.25) and convert to '#001122' format
      this.ctx.fillStyle = this.ctx.fillStyle.split(',').slice(0, -1).join(',') + ', 1)'
      this.options.particles.color = this.ctx.fillStyle
    }
  }
}

try {
  if (typeof module !== undefined) module.exports = CanvasParticles
} catch (err) {
  globalThis.CanvasParticles = CanvasParticles
}
