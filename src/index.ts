// Copyright (c) 2022–2025 Kyle Hoeckman, MIT License
// https://github.com/Khoeckman/canvasparticles-js/blob/main/LICENSE

import type { CanvasParticlesCanvas, Particle, ParticleGridPos } from './types'
import type { CanvasParticlesOptions, CanvasParticlesOptionsInput } from './types/options'

declare const __VERSION__: string

export default class CanvasParticles {
  static version = __VERSION__

  /** Defines mouse interaction types with the particles */
  static interactionType = Object.freeze({
    NONE: 0, // No mouse interaction
    SHIFT: 1, // Visual displacement only
    MOVE: 2, // Actual particle movement
  })

  /** Observes canvas elements entering or leaving the viewport to start/stop animation */
  static canvasIntersectionObserver = new IntersectionObserver((entry) => {
    entry.forEach((change) => {
      const canvas = change.target as CanvasParticlesCanvas
      const instance = canvas.instance // The CanvasParticles class instance bound to this canvas

      if (!instance.options?.animation) return

      if ((canvas.inViewbox = change.isIntersecting))
        instance.options.animation?.startOnEnter && instance.start({ auto: true })
      else instance.options.animation?.stopOnLeave && instance.stop({ auto: true, clear: false })
    })
  })

  canvas: CanvasParticlesCanvas
  ctx: CanvasRenderingContext2D

  enableAnimating: boolean
  animating: boolean

  particles: Particle[]

  mouseX!: number
  mouseY!: number
  width!: number
  height!: number
  offX!: number
  offY!: number
  updateCount!: number
  particleCount!: number
  strokeStyleTable!: Record<string, string>
  clientX!: number
  clientY!: number
  option!: CanvasParticlesOptions

  /**
   * Initialize a CanvasParticles instance
   * @param selector - Canvas element or CSS selector
   * @param options - Configuration object for particles (https://github.com/Khoeckman/canvasParticles?tab=readme-ov-file#options)
   */
  constructor(selector: string | HTMLCanvasElement, options: CanvasParticlesOptionsInput = {}) {
    let canvas

    // Find the HTMLCanvasElement and assign it to `this.canvas`
    if (selector instanceof HTMLCanvasElement) canvas = selector
    else {
      if (typeof selector !== 'string')
        throw new TypeError('selector is not a string and neither a HTMLCanvasElement itself')

      canvas = document.querySelector(selector)
      if (!(canvas instanceof HTMLCanvasElement)) throw new Error('selector does not point to a canvas')
    }
    this.canvas = canvas as CanvasParticlesCanvas
    this.canvas.instance = this // Circular assignment to find the instance bound to this canvas
    this.canvas.inViewbox = true

    // Get 2d drawing methods
    this.ctx = this.canvas.getContext('2d')!

    this.enableAnimating = false
    this.animating = false
    this.particles = []
    this.options = options

    CanvasParticles.canvasIntersectionObserver.observe(this.canvas)

    // Setup event handlers
    this.resizeCanvas = this.resizeCanvas.bind(this)
    this.updateMousePos = this.updateMousePos.bind(this)

    window.addEventListener('resize', this.resizeCanvas)
    this.resizeCanvas()

    window.addEventListener('mousemove', this.updateMousePos)
    window.addEventListener('scroll', this.updateMousePos)
  }

  /** @public Resize the canvas and update particles accordingly */
  resizeCanvas() {
    this.canvas.width = this.canvas.offsetWidth
    this.canvas.height = this.canvas.offsetHeight

    // Prevent the mouse acting like it's at { x: 0, y: 0 } before the first MouseEvent
    this.mouseX = Infinity
    this.mouseY = Infinity

    this.updateCount = Infinity
    this.width = Math.max(this.canvas.width + this.option.particles.connectDist * 2, 1)
    this.height = Math.max(this.canvas.height + this.option.particles.connectDist * 2, 1)
    this.offX = (this.canvas.width - this.width) / 2
    this.offY = (this.canvas.height - this.height) / 2

    if (this.option.particles.regenerateOnResize || this.particles.length === 0) this.newParticles()
    else this.matchParticleCount({ updateBounds: true })
  }

  /** @public Update mouse coordinates relative to the canvas */
  updateMousePos(event: Event) {
    if (!this.enableAnimating) return

    if (event instanceof MouseEvent) {
      this.clientX = event.clientX
      this.clientY = event.clientY
    }

    // Take the position of the canvas relative to the viewport into account
    const { left, top } = this.canvas.getBoundingClientRect()
    this.mouseX = this.clientX - left
    this.mouseY = this.clientY - top
  }

  /** @private Update the target number of particles based on the current canvas size and `options.particles.ppm`, capped at `options.particles.max`. */
  #updateParticleCount() {
    // Amount of particles to be created
    const particleCount = ((this.option.particles.ppm * this.width * this.height) / 1_000_000) | 0
    this.particleCount = Math.min(this.option.particles.max, particleCount)

    if (!isFinite(this.particleCount))
      throw new RangeError('number of particles must be finite. (options.particles.ppm)')
  }

  /** @public Remove existing particles and generate new ones */
  newParticles() {
    this.#updateParticleCount()

    this.particles = []
    for (let i = 0; i < this.particleCount; i++) this.createParticle()
  }

  /** @public Adjust particle array length to match `options.particles.ppm` */
  matchParticleCount({ updateBounds = false }: { updateBounds?: boolean } = {}) {
    this.#updateParticleCount()

    this.particles = this.particles.slice(0, this.particleCount)
    if (updateBounds) this.particles.forEach((particle) => this.#updateParticleBounds(particle))
    while (this.particleCount > this.particles.length) this.createParticle()
  }

  /** @public Create a new particle with optional parameters */
  createParticle(posX?: number, posY?: number, dir?: number, speed?: number, size?: number) {
    posX = typeof posX === 'number' ? posX - this.offX : Math.random() * this.width
    posY = typeof posY === 'number' ? posY - this.offX : Math.random() * this.width

    const particle: Omit<Particle, 'bounds'> = {
      posX, // Logical position in pixels
      posY, // Logical position in pixels
      x: posX, // Visual position in pixels
      y: posY, // Visual position in pixels
      velX: 0, // Horizonal speed in pixels per update
      velY: 0, // Vertical speed in pixels per update
      offX: 0, // Horizontal distance from drawn to logical position in pixels
      offY: 0, // Vertical distance from drawn to logical position in pixels
      dir: dir || Math.random() * 2 * Math.PI, // Direction in radians
      speed: speed || (0.5 + Math.random() * 0.5) * this.option.particles.relSpeed, // Velocity in pixels per update
      size: size || (0.5 + Math.random() ** 5 * 2) * this.option.particles.relSize, // Ray in pixels of the particle
      gridPos: { x: 1, y: 1 },
      isVisible: false,
    }
    this.#updateParticleBounds(particle)
    this.particles.push(particle as Particle)
  }

  /** @private Update the visible bounds of a particle */
  #updateParticleBounds(particle: Omit<Particle, 'bounds'> & Partial<Pick<Particle, 'bounds'>>) {
    // The particle is considered visible within these bounds
    particle.bounds = {
      top: -particle.size,
      right: this.canvas.width + particle.size,
      bottom: this.canvas.height + particle.size,
      left: -particle.size,
    }
  }

  /** @private Apply gravity forces between particles once every `options.framesPerUpdate` frames */
  #updateGravity() {
    const isRepulsiveEnabled = this.option.gravity.repulsive !== 0
    const isPullingEnabled = this.option.gravity.pulling !== 0

    if (isRepulsiveEnabled || isPullingEnabled) {
      const len = this.particleCount
      const gravRepulsiveMult = this.option.particles.connectDist * this.option.gravity.repulsive
      const gravPullingMult = this.option.particles.connectDist * this.option.gravity.pulling
      const maxRepulsiveDist = this.option.particles.connectDist / 2
      const maxGrav = this.option.particles.connectDist * 0.1

      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          // Note: Code in this scope runs { particleCount ** 2 / 2 } times per update!
          const particleA = this.particles[i]
          const particleB = this.particles[j]

          const distX = particleA.posX - particleB.posX
          const distY = particleA.posY - particleB.posY

          const dist = Math.sqrt(distX * distX + distY * distY)

          let angle
          let grav = 1

          if (dist < maxRepulsiveDist) {
            // Apply repulsive forces on all particles closer than { dist / 2 }
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

          // Apply pulling forces on all particles
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

  /** @private Update positions, directions, and visibility of all particles once every `options.framesPerUpdate` frames */
  #updateParticles() {
    if (this.width <= 0 || this.height <= 0) this.resizeCanvas()

    for (let particle of this.particles) {
      // Randomly perturb direction
      particle.dir =
        (particle.dir + Math.random() * this.option.particles.rotationSpeed * 2 - this.option.particles.rotationSpeed) %
        (2 * Math.PI)
      particle.velX *= this.option.gravity.friction
      particle.velY *= this.option.gravity.friction
      particle.posX =
        (particle.posX + particle.velX + ((Math.sin(particle.dir) * particle.speed) % this.width) + this.width) %
        this.width
      particle.posY =
        (particle.posY + particle.velY + ((Math.cos(particle.dir) * particle.speed) % this.height) + this.height) %
        this.height

      const distX = particle.posX + this.offX - this.mouseX
      const distY = particle.posY + this.offY - this.mouseY

      // Mouse interaction
      if (this.option.mouse.interactionType !== CanvasParticles.interactionType.NONE) {
        const distRatio = this.option.mouse.connectDist / Math.hypot(distX, distY)

        if (this.option.mouse.distRatio < distRatio) {
          particle.offX += (distRatio * distX - distX - particle.offX) / 4
          particle.offY += (distRatio * distY - distY - particle.offY) / 4
        } else {
          particle.offX -= particle.offX / 4
          particle.offY -= particle.offY / 4
        }
      }

      // Visually displace the particles
      particle.x = particle.posX + particle.offX
      particle.y = particle.posY + particle.offY

      // Move the particles
      if (this.option.mouse.interactionType === CanvasParticles.interactionType.MOVE) {
        particle.posX = particle.x
        particle.posY = particle.y
      }
      particle.x += this.offX
      particle.y += this.offY

      particle.gridPos = this.#gridPos(particle)
      particle.isVisible = particle.gridPos.x === 1 && particle.gridPos.y === 1
    }
  }

  /**
   * @private Determine a particle's location in a 3x3 canvas grid to assess visibility.
   *
   * This helps identify whether two particles, even if off-canvas, might have a visible connection.
   *
   * Grid regions:
   * - { x: 0, y: 0 } = top-left
   * - { x: 1, y: 0 } = top
   * - { x: 2, y: 0 } = top-right
   * - { x: 0, y: 1 } = left
   * - { x: 1, y: 1 } = center (visible part of the canvas)
   * - { x: 2, y: 1 } = right
   * - { x: 0, y: 2 } = bottom-left
   * - { x: 1, y: 2 } = bottom
   * - { x: 2, y: 2 } = bottom-right
   */
  #gridPos(particle: Particle): ParticleGridPos {
    return {
      x: (+(particle.x >= particle.bounds.left) + +(particle.x > particle.bounds.right)) as 0 | 1 | 2,
      y: (+(particle.y >= particle.bounds.top) + +(particle.y > particle.bounds.bottom)) as 0 | 1 | 2,
    }
  }

  /** @private Determines whether a line between 2 particles crosses through the visible center of the canvas */
  #isLineVisible(particleA: Particle, particleB: Particle) {
    // Visible if either particle is in the center
    if (particleA.isVisible || particleB.isVisible) return true

    // Not visible if both particles are in the same vertical or horizontal line but outside the center
    return !(
      (particleA.gridPos.x === particleB.gridPos.x && particleA.gridPos.x !== 1) ||
      (particleA.gridPos.y === particleB.gridPos.y && particleA.gridPos.y !== 1)
    )
  }

  /**
   * @private Generates a lookup table of colors for all alpha values (0–255) based on a base color.
   *
   * This optimizes rendering by avoiding repeated string calculations for every particle connection.
   *
   * @example
   * const strokeTable = this.#generateHexAlphaTable("#abcdef");
   * strokeTable[128] -> "#abcdef80"
   * strokeTable[255] -> "#abcdefff"
   */
  #generateHexAlphaTable(color: string | CanvasGradient | CanvasPattern): Record<string, string> {
    const table: Record<string, string> = {}

    // Precompute stroke styles for alpha values 0–255
    for (let alpha = 0; alpha < 256; alpha++) {
      // Convert to 2-character hex and combine base color with alpha
      table[alpha] = color + alpha.toString(16).padStart(2, '0')
    }
    return table
  }

  /** @private Draw the particles on the canvas */
  #renderParticles() {
    for (let particle of this.particles) {
      if (particle.isVisible) {
        // Draw very small particles (<1px) as squares for performance, otherwise draw a circle
        if (particle.size > 1) {
          // Draw circle
          this.ctx.beginPath()
          this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI)
          this.ctx.fill()
          this.ctx.closePath()
        } else {
          // Draw square (±183% faster)
          this.ctx.fillRect(
            particle.x - particle.size,
            particle.y - particle.size,
            particle.size * 2,
            particle.size * 2
          )
        }
      }
    }
  }

  /** @private Draw lines between particles if they are close enough */
  #renderConnections() {
    const len = this.particleCount
    const drawAll = this.option.particles.connectDist >= Math.min(this.canvas.width, this.canvas.height)

    const maxWorkPerParticle = this.option.particles.connectDist * this.option.particles.maxWork

    for (let i = 0; i < len; i++) {
      let particleWork = 0

      for (let j = i + 1; j < len; j++) {
        // Note: Code in this scope runs { particleCount ** 2 / 2 } times per frame!
        const particleA = this.particles[i]
        const particleB = this.particles[j]

        // Don't draw the line if it wouldn't be visible
        if (!(drawAll || this.#isLineVisible(particleA, particleB))) continue

        const distX = particleA.x - particleB.x
        const distY = particleA.y - particleB.y

        const dist = Math.sqrt(distX * distX + distY * distY)

        // Don't draw the line if the particles are too far away
        if (dist > this.option.particles.connectDist) continue

        // Calculate the transparency of the line and lookup the stroke style
        // Note: This is the heaviest task of the entire animation process
        if (dist > this.option.particles.connectDist / 2) {
          const alpha = (Math.min(this.option.particles.connectDist / dist - 1, 1) * this.option.particles.opacity) | 0
          this.ctx.strokeStyle = this.strokeStyleTable[alpha]
        } else {
          this.ctx.strokeStyle = this.option.particles.colorWithAlpha
        }

        // Draw the line
        this.ctx.beginPath()
        this.ctx.moveTo(particleA.x, particleA.y)
        this.ctx.lineTo(particleB.x, particleB.y)
        this.ctx.stroke()

        // Stop drawing lines from this particle if it has exceeded what's allowed by configuration
        if ((particleWork += dist) >= maxWorkPerParticle) break
      }
    }
  }

  /** @private Clear the canvas and render the particles and their connections onto the canvas */
  #render() {
    this.canvas.width = this.canvas.width
    this.ctx.fillStyle = this.option.particles.colorWithAlpha
    this.ctx.lineWidth = 1

    this.#renderParticles()
    this.#renderConnections()
  }

  /** @private Main animation loop that updates and renders the particles */
  #animation() {
    if (!this.animating) return

    requestAnimationFrame(() => this.#animation())

    if (++this.updateCount >= this.option.framesPerUpdate) {
      this.updateCount = 0
      this.#updateGravity()
      this.#updateParticles()
      this.#render()
    }
  }

  /** @public Start the particle animation if it was not running before */
  start({ auto = false }: { auto?: boolean } = {}): CanvasParticles {
    if (!this.animating && (!auto || this.enableAnimating)) {
      this.enableAnimating = true
      this.animating = true
      requestAnimationFrame(() => this.#animation())
    }

    // Stop animating because it will start automatically once the canvas enters the viewbox
    if (!this.canvas.inViewbox && this.option.animation.startOnEnter) this.animating = false

    return this
  }

  /** @public Stops the particle animation and optionally clears the canvas */
  stop({ auto = false, clear = true }: { auto?: boolean; clear?: boolean } = {}): boolean {
    if (!auto) this.enableAnimating = false
    this.animating = false
    if (clear !== false) this.canvas.width = this.canvas.width

    return true
  }

  /** @public Gracefully destroy the instance and remove the canvas element */
  destroy() {
    this.stop()

    CanvasParticles.canvasIntersectionObserver.unobserve(this.canvas)

    window.removeEventListener('resize', this.resizeCanvas)
    window.removeEventListener('mousemove', this.updateMousePos)
    window.removeEventListener('scroll', this.updateMousePos)

    this.canvas?.remove()

    Object.keys(this).forEach((key) => delete (this as any)[key]) // Remove references to help GC
  }

  /** Set and validate options (https://github.com/Khoeckman/canvasParticles?tab=readme-ov-file#options) */
  set options(options: CanvasParticlesOptionsInput) {
    const defaultIfNaN = (value: number, defaultValue: number): number => (isNaN(+value) ? defaultValue : +value)

    const parseNumericOption = (
      value: number | undefined,
      defaultValue: number,
      clamp?: { min?: number; max?: number }
    ): number => {
      const { min = -Infinity, max = Infinity } = clamp ?? {}
      return defaultIfNaN(Math.min(Math.max(value ?? defaultValue, min), max), defaultValue)
    }

    // Format and parse all options
    this.option = {
      background: options.background ?? false,
      framesPerUpdate: parseNumericOption(options.framesPerUpdate, 1, { min: 1 }),
      animation: {
        startOnEnter: !!(options.animation?.startOnEnter ?? true),
        stopOnLeave: !!(options.animation?.stopOnLeave ?? true),
      },
      mouse: {
        interactionType: parseNumericOption(options.mouse?.interactionType, 1),
        connectDistMult: parseNumericOption(options.mouse?.connectDistMult, 2 / 3),
        connectDist: 1 /* post processed */,
        distRatio: parseNumericOption(options.mouse?.distRatio, 2 / 3),
      },
      particles: {
        regenerateOnResize: !!options.particles?.regenerateOnResize,
        color: options.particles?.color ?? 'black',
        colorWithAlpha: '#00000000' /* post processed */,
        ppm: parseNumericOption(options.particles?.ppm, 100),
        max: parseNumericOption(options.particles?.max, 500),
        maxWork: parseNumericOption(options.particles?.maxWork, Infinity, { min: 0 }),
        connectDist: parseNumericOption(options.particles?.connectDistance, 150, { min: 1 }),
        relSpeed: parseNumericOption(options.particles?.relSpeed, 1, { min: 0 }),
        relSize: parseNumericOption(options.particles?.relSize, 1, { min: 1 }),
        rotationSpeed: parseNumericOption(options.particles?.rotationSpeed, 2, { min: 0 }) / 100,
        opacity: 0 /* post processed */,
      },
      gravity: {
        repulsive: parseNumericOption(options.gravity?.repulsive, 0),
        pulling: parseNumericOption(options.gravity?.pulling, 0),
        friction: parseNumericOption(options.gravity?.friction, 0.8, { min: 0, max: 1 }),
      },
    }

    this.setBackground(this.option.background)
    this.setMouseConnectDistMult(this.option.mouse.connectDistMult)
    this.setParticleColor(this.option.particles.color)
  }

  get options(): CanvasParticlesOptions {
    return this.option
  }

  /** @public Sets the canvas background */
  setBackground(background: CanvasParticlesOptionsInput['background']) {
    if (!background) return
    if (typeof background !== 'string') throw new TypeError('background is not a string')
    this.canvas.style.background = this.option.background = background
  }

  /** @public Transform the distance multiplier (float) to absolute distance (px) */
  setMouseConnectDistMult(connectDistMult: number) {
    this.option.mouse.connectDist =
      this.option.particles.connectDist * (isNaN(connectDistMult) ? 2 / 3 : connectDistMult)
  }

  /** @public Format particle color and opacity */
  setParticleColor(color: string | CanvasGradient | CanvasPattern) {
    this.ctx.fillStyle = color

    // Check if `ctx.fillStyle` is in hex format ("#RRGGBB")
    if (String(this.ctx.fillStyle)[0] === '#') this.option.particles.opacity = 255
    else {
      // JavaScript's `ctx.fillStyle` causes the color to otherwise end up in in rgba format ("rgba(136, 244, 255, 0.25)")

      // Extract the alpha value (0.25) from the rgba string and scale it from 0x00 to 0xff
      this.option.particles.opacity =
        (parseFloat(String(this.ctx.fillStyle).split(',').at(-1)?.slice(1, -1) ?? '1') * 255) | 0

      // Extracts e.g. 136, 244 and 255 from rgba(136, 244, 255, 0.25) and converts it to '#rrggbb'
      this.ctx.fillStyle = String(this.ctx.fillStyle).split(',').slice(0, -1).join(',') + ', 1)'
    }
    this.option.particles.color = this.ctx.fillStyle
    this.option.particles.colorWithAlpha = this.option.particles.color + this.option.particles.opacity.toString(16)

    // Recalculate the stroke style lookup table
    this.strokeStyleTable = this.#generateHexAlphaTable(this.option.particles.color)
  }
}
