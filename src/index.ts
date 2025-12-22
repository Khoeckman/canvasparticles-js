// Copyright (c) 2022–2025 Kyle Hoeckman, MIT License
// https://github.com/Khoeckman/canvasparticles-js/blob/main/LICENSE

import type { CanvasParticlesCanvas, Particle, ParticleGridPos, ContextColor, LineSegment } from './types'
import type { CanvasParticlesOptions, CanvasParticlesOptionsInput } from './types/options'

const TWO_PI = 2 * Math.PI

/** Extremely fast, simple 32‑bit PRNG */
function Mulberry32(seed: number) {
  let state = seed >>> 0

  return {
    next() {
      let t = (state + 0x6d2b79f5) | 0
      state = t
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
  }
}

// Mulberry32 is ±388% faster than Math.random()
// Benchmark: https://jsbm.dev/muLCWR9RJCbmy
// Spectral test: /demo/mulberry32.html
const prng = Mulberry32(Math.random() * 2 ** 32).next

declare const __VERSION__: string

export default class CanvasParticles {
  static readonly version = __VERSION__

  /** Defines mouse interaction types with the particles */
  static readonly interactionType = Object.freeze({
    NONE: 0, // No mouse interaction
    SHIFT: 1, // Visual displacement only
    MOVE: 2, // Actual particle movement
  })

  /** Observes canvas elements entering or leaving the viewport to start/stop animation */
  static readonly canvasIntersectionObserver = new IntersectionObserver((entries) => {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const canvas = entry.target as CanvasParticlesCanvas
      const instance = canvas.instance // The CanvasParticles class instance bound to this canvas

      if (!instance.options?.animation) return

      if ((canvas.inViewbox = entry.isIntersecting))
        instance.options.animation?.startOnEnter && instance.start({ auto: true })
      else instance.options.animation?.stopOnLeave && instance.stop({ auto: true, clear: false })
    }
  })

  static readonly canvasResizeObserver = new ResizeObserver((entries) => {
    // Seperate for loops is very important to prevent huge forced reflow overhead

    // First read all canvas rects at once
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const canvas = entry.target as CanvasParticlesCanvas
      canvas.instance.updateCanvasRect()
    }

    // Then resize all canvases at once
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const canvas = entry.target as CanvasParticlesCanvas
      canvas.instance.resizeCanvas()
    }
  })

  /** Helper functions for options parsing */
  private static readonly defaultIfNaN = (value: number, defaultValue: number): number =>
    isNaN(+value) ? defaultValue : +value

  private static readonly parseNumericOption = (
    name: string,
    value: number | undefined,
    defaultValue: number,
    clamp?: { min?: number; max?: number }
  ): number => {
    if (value == undefined) return defaultValue

    const { min = -Infinity, max = Infinity } = clamp ?? {}

    if (isFinite(min) && value < min) {
      console.warn(new RangeError(`option.${name} was clamped to ${min} as ${value} is too low`))
    } else if (isFinite(max) && value > max) {
      console.warn(new RangeError(`option.${name} was clamped to ${max} as ${value} is too high`))
    }

    return CanvasParticles.defaultIfNaN(Math.min(Math.max(value ?? defaultValue, min), max), defaultValue)
  }

  canvas: CanvasParticlesCanvas
  private ctx: CanvasRenderingContext2D

  enableAnimating: boolean = false
  isAnimating: boolean = false

  particles: Particle[] = []
  particleCount: number = 0

  private clientX: number = Infinity
  private clientY: number = Infinity
  mouseX: number = Infinity
  mouseY: number = Infinity
  width!: number
  height!: number
  private offX!: number
  private offY!: number
  option!: CanvasParticlesOptions
  color!: ContextColor

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
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('failed to get 2D context from canvas')
    this.ctx = ctx

    this.options = options // Uses setter

    CanvasParticles.canvasIntersectionObserver.observe(this.canvas)
    CanvasParticles.canvasResizeObserver.observe(this.canvas)

    // Setup event handlers
    this.resizeCanvas = this.resizeCanvas.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleScroll = this.handleScroll.bind(this)

    this.updateCanvasRect()
    this.resizeCanvas()

    window.addEventListener('mousemove', this.handleMouseMove, { passive: true })
    window.addEventListener('scroll', this.handleScroll, { passive: true })
  }

  /* @public Update the canvas bounding rectangle and mouse position relative to it */
  updateCanvasRect() {
    const { top, left, width, height } = this.canvas.getBoundingClientRect()
    this.canvas.rect = { top, left, width, height }
  }

  handleMouseMove(event: MouseEvent) {
    if (!this.enableAnimating) return

    this.clientX = event.clientX
    this.clientY = event.clientY
    if (!this.isAnimating) return
    this.updateMousePos()
  }

  handleScroll() {
    if (!this.enableAnimating) return

    this.updateCanvasRect()
    if (!this.isAnimating) return
    this.updateMousePos()
  }

  /** @public Update mouse coordinates */
  updateMousePos() {
    const { top, left } = this.canvas.rect
    this.mouseX = this.clientX - left
    this.mouseY = this.clientY - top
  }

  /** @public Resize the canvas and update particles accordingly */
  resizeCanvas() {
    const width = (this.canvas.width = this.canvas.rect.width)
    const height = (this.canvas.height = this.canvas.rect.height)

    // Hide the mouse when resizing because it must be outside the viewport to do so
    this.mouseX = Infinity
    this.mouseY = Infinity

    this.width = Math.max(width + this.option.particles.connectDist * 2, 1)
    this.height = Math.max(height + this.option.particles.connectDist * 2, 1)
    this.offX = (width - this.width) / 2
    this.offY = (height - this.height) / 2

    if (this.option.particles.regenerateOnResize || this.particles.length === 0) this.newParticles()
    else this.matchParticleCount({ updateBounds: true })

    if (this.isAnimating) this.#render()
  }

  /** @private Update the target number of particles based on the current canvas size and `options.particles.ppm`, capped at `options.particles.max`. */
  #updateParticleCount() {
    // Amount of particles to be created
    const particleCount = ((this.option.particles.ppm * this.width * this.height) / 1_000_000) | 0
    this.particleCount = Math.min(this.option.particles.max, particleCount)

    if (!isFinite(this.particleCount)) throw new RangeError('particleCount must be finite')
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
    posX = typeof posX === 'number' ? posX - this.offX : prng() * this.width
    posY = typeof posY === 'number' ? posY - this.offY : prng() * this.height

    const particle: Omit<Particle, 'bounds'> = {
      posX, // Logical position in pixels
      posY, // Logical position in pixels
      x: posX, // Visual position in pixels
      y: posY, // Visual position in pixels
      velX: 0, // Horizonal speed in pixels per update
      velY: 0, // Vertical speed in pixels per update
      offX: 0, // Horizontal distance from drawn to logical position in pixels
      offY: 0, // Vertical distance from drawn to logical position in pixels
      dir: dir || prng() * TWO_PI, // Direction in radians
      speed: speed || (0.5 + prng() * 0.5) * this.option.particles.relSpeed, // Velocity in pixels per update
      size: size || (0.5 + prng() ** 5 * 2) * this.option.particles.relSize, // Ray in pixels of the particle
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

  /** @private Apply gravity forces between particles */
  #updateGravity() {
    const isRepulsiveEnabled = this.option.gravity.repulsive > 0
    const isPullingEnabled = this.option.gravity.pulling > 0

    if (!isRepulsiveEnabled && !isPullingEnabled) return

    const len = this.particleCount
    const particles = this.particles
    const gravRepulsiveMult = this.option.particles.connectDist * this.option.gravity.repulsive
    const gravPullingMult = this.option.particles.connectDist * this.option.gravity.pulling
    const maxRepulsiveDist = this.option.particles.connectDist / 2
    const maxRepulsiveDistSq = maxRepulsiveDist ** 2
    const maxGrav = this.option.particles.connectDist * 0.1

    for (let i = 0; i < len; i++) {
      const particleA = particles[i]

      for (let j = i + 1; j < len; j++) {
        // Code in this scope runs O(n^2) times per frame!
        const particleB = particles[j]

        const distX = particleA.posX - particleB.posX
        const distY = particleA.posY - particleB.posY
        const distSq = distX * distX + distY * distY

        let angle
        let grav
        let gravMult

        if (distSq >= maxRepulsiveDistSq && !isPullingEnabled) continue

        angle = Math.atan2(particleB.posY - particleA.posY, particleB.posX - particleA.posX)
        grav = (1 / Math.sqrt(distSq)) ** 1.8
        const angleX = Math.cos(angle)
        const angleY = Math.sin(angle)

        if (distSq < maxRepulsiveDistSq) {
          gravMult = Math.min(maxGrav, grav * gravRepulsiveMult)
          const gravX = angleX * gravMult
          const gravY = angleY * gravMult
          particleA.velX -= gravX
          particleA.velY -= gravY
          particleB.velX += gravX
          particleB.velY += gravY
        }

        if (!isPullingEnabled) continue

        gravMult = Math.min(maxGrav, grav * gravPullingMult)
        const gravX = angleX * gravMult
        const gravY = angleY * gravMult
        particleA.velX += gravX
        particleA.velY += gravY
        particleB.velX -= gravX
        particleB.velY -= gravY
      }
    }
  }

  /** @private Update positions, directions, and visibility of all particles */
  #updateParticles() {
    const len = this.particleCount
    const particles = this.particles
    const width = this.width
    const height = this.height
    const offX = this.offX
    const offY = this.offY
    const mouseX = this.mouseX
    const mouseY = this.mouseY
    const rotationSpeed = this.option.particles.rotationSpeed
    const friction = this.option.gravity.friction
    const mouseConnectDist = this.option.mouse.connectDist
    const mouseDistRatio = this.option.mouse.distRatio
    const isMouseInteractionTypeNone = this.option.mouse.interactionType === CanvasParticles.interactionType.NONE
    const isMouseInteractionTypeMove = this.option.mouse.interactionType === CanvasParticles.interactionType.MOVE

    for (let i = 0; i < len; i++) {
      const particle = particles[i]

      particle.dir += 2 * (Math.random() - 0.5) * rotationSpeed
      particle.dir %= TWO_PI

      // Constant velocity
      const movX = Math.sin(particle.dir) * particle.speed
      const movY = Math.cos(particle.dir) * particle.speed

      // Apply velocities
      particle.posX += movX + particle.velX
      particle.posY += movY + particle.velY

      // Wrap particles around the canvas
      particle.posX %= width
      if (particle.posX < 0) particle.posX += width

      particle.posY %= height
      if (particle.posY < 0) particle.posY += height

      // Slightly decrease dynamic velocity
      particle.velX *= friction
      particle.velY *= friction

      // Distance from mouse
      const distX = particle.posX + offX - mouseX
      const distY = particle.posY + offY - mouseY

      // Mouse interaction
      if (!isMouseInteractionTypeNone) {
        const distRatio = mouseConnectDist / Math.hypot(distX, distY)

        if (mouseDistRatio < distRatio) {
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
      if (isMouseInteractionTypeMove) {
        particle.posX = particle.x
        particle.posY = particle.y
      }
      particle.x += offX
      particle.y += offY

      this.#gridPos(particle)
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
  #gridPos(particle: Particle): void {
    particle.gridPos.x = (+(particle.x >= particle.bounds.left) + +(particle.x > particle.bounds.right)) as 0 | 1 | 2
    particle.gridPos.y = (+(particle.y >= particle.bounds.top) + +(particle.y > particle.bounds.bottom)) as 0 | 1 | 2
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

  /** @private Draw the particles on the canvas */
  #renderParticles() {
    const len = this.particleCount
    const particles = this.particles
    const ctx = this.ctx

    for (let i = 0; i < len; i++) {
      const particle = particles[i]

      if (!particle.isVisible) continue

      // Draw particles smaller than 1px as a square instead of a circle for performance
      if (particle.size > 1) {
        // Draw circle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, TWO_PI)
        ctx.fill()
        ctx.closePath()
      } else {
        // Draw square (±183% faster)
        ctx.fillRect(particle.x - particle.size, particle.y - particle.size, particle.size * 2, particle.size * 2)
      }
    }
  }

  /** @private Draw lines between particles if they are close enough */
  #renderConnections() {
    const len = this.particleCount
    const particles = this.particles
    const ctx = this.ctx
    const maxDist = this.option.particles.connectDist
    const maxDistSq = maxDist ** 2
    const halfMaxDist = maxDist / 2
    const halfMaxDistSq = halfMaxDist ** 2
    const drawAll = maxDist >= Math.min(this.canvas.width, this.canvas.height)
    const maxWorkPerParticle = maxDistSq * this.option.particles.maxWork
    const alpha = this.color.alpha
    const alphaFactor = this.color.alpha * maxDist

    /** Batch line segments of max alpha */
    const bucket: LineSegment[] = []

    for (let i = 0; i < len; i++) {
      const particleA = particles[i]
      let particleWork = 0

      for (let j = i + 1; j < len; j++) {
        // Code in this scope runs O(n^2) times per frame!
        const particleB = particles[j]

        // Don't draw the line if it wouldn't be visible
        if (!(drawAll || this.#isLineVisible(particleA, particleB))) continue

        const distX = particleA.x - particleB.x
        const distY = particleA.y - particleB.y

        const distSq = distX * distX + distY * distY

        // Don't draw the line if the particles are too far away
        if (distSq > maxDistSq) continue

        if (distSq > halfMaxDistSq) {
          // Calculate line alpha
          ctx.globalAlpha = alphaFactor / Math.sqrt(distSq) - alpha

          // Draw the line
          ctx.beginPath()
          ctx.moveTo(particleA.x, particleA.y)
          ctx.lineTo(particleB.x, particleB.y)
          ctx.stroke()
        } else {
          bucket.push([particleA.x, particleA.y, particleB.x, particleB.y])
        }

        // Stop drawing lines from this particle if it has exceeded what's allowed by configuration
        if ((particleWork += distSq) >= maxWorkPerParticle) break
      }
    }

    if (!bucket.length) return

    // Render all bucketed lines at once
    ctx.globalAlpha = alpha
    ctx.beginPath()

    for (let i = 0; i < bucket.length; i++) {
      const line = bucket[i]
      ctx.moveTo(line[0], line[1])
      ctx.lineTo(line[2], line[3])
    }
    ctx.stroke()
  }

  /** @private Clear the canvas and render the particles and their connections onto the canvas */
  #render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.globalAlpha = this.color.alpha
    this.ctx.fillStyle = this.color.hex
    this.ctx.strokeStyle = this.color.hex
    this.ctx.lineWidth = 1

    this.#renderParticles()
    this.#renderConnections()
  }

  /** @private Main animation loop that updates and renders the particles */
  #animation() {
    if (!this.isAnimating) return

    requestAnimationFrame(() => this.#animation())

    this.#updateGravity()
    this.#updateParticles()
    this.#render()
  }

  /** @public Start the particle animation if it was not running before */
  start({ auto = false }: { auto?: boolean } = {}): CanvasParticles {
    if (!this.isAnimating && (!auto || this.enableAnimating)) {
      this.enableAnimating = true
      this.isAnimating = true
      this.updateCanvasRect()
      requestAnimationFrame(() => this.#animation())
    }

    // Stop animating because it will start automatically once the canvas enters the viewbox
    if (!this.canvas.inViewbox && this.option.animation.startOnEnter) this.isAnimating = false

    return this
  }

  /** @public Stops the particle animation and optionally clears the canvas */
  stop({ auto = false, clear = true }: { auto?: boolean; clear?: boolean } = {}): boolean {
    if (!auto) this.enableAnimating = false
    this.isAnimating = false
    if (clear !== false) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    return true
  }

  /** @public Gracefully destroy the instance and remove the canvas element */
  destroy() {
    this.stop()

    CanvasParticles.canvasIntersectionObserver.unobserve(this.canvas)
    CanvasParticles.canvasResizeObserver.unobserve(this.canvas)

    window.removeEventListener('mousemove', this.handleMouseMove)
    window.removeEventListener('scroll', this.handleScroll)

    this.canvas?.remove()

    Object.keys(this).forEach((key) => delete (this as any)[key]) // Remove references to help GC
  }

  /** Set and validate options (https://github.com/Khoeckman/canvasParticles?tab=readme-ov-file#options) */
  set options(options: CanvasParticlesOptionsInput) {
    const pno = CanvasParticles.parseNumericOption

    // Format and parse all options
    this.option = {
      background: options.background ?? false,
      animation: {
        startOnEnter: !!(options.animation?.startOnEnter ?? true),
        stopOnLeave: !!(options.animation?.stopOnLeave ?? true),
      },
      mouse: {
        interactionType: pno('mouse.interactionType', options.mouse?.interactionType, 1),
        connectDistMult: pno('mouse.connectDistMult', options.mouse?.connectDistMult, 2 / 3),
        connectDist: 1 /* post processed */,
        distRatio: pno('mouse.distRatio', options.mouse?.distRatio, 2 / 3),
      },
      particles: {
        regenerateOnResize: !!options.particles?.regenerateOnResize,
        color: options.particles?.color ?? 'black',
        ppm: pno('particles.ppm', options.particles?.ppm, 100),
        max: pno('particles.max', options.particles?.max, Infinity),
        maxWork: pno('particles.maxWork', options.particles?.maxWork, Infinity, { min: 0 }),
        connectDist: pno('particles.connectDistance', options.particles?.connectDistance, 150, { min: 1 }),
        relSpeed: pno('particles.relSpeed', options.particles?.relSpeed, 1, { min: 0 }),
        relSize: pno('particles.relSize', options.particles?.relSize, 1, { min: 1 }),
        rotationSpeed: pno('particles.rotationSpeed', options.particles?.rotationSpeed, 2, { min: 0 }) / 100,
      },
      gravity: {
        repulsive: pno('gravity.repulsive', options.gravity?.repulsive, 0),
        pulling: pno('gravity.pulling', options.gravity?.pulling, 0),
        friction: pno('gravity.friction', options.gravity?.friction, 0.8, { min: 0, max: 1 }),
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
    if (String(this.ctx.fillStyle)[0] === '#') {
      this.color = {
        hex: String(this.ctx.fillStyle),
        alpha: 1.0,
      }
    } else {
      // JavaScript's `ctx.fillStyle` causes the color to otherwise end up in in rgba format ("rgba(136, 244, 255, 0.25)")

      // Extract the alpha value from the rgba string
      let alpha = String(this.ctx.fillStyle).split(',').at(-1) // ' 0.25)'
      alpha = alpha?.slice(1, -1) ?? '1' // '0.25'

      // Extracts e.g. 136, 244 and 255 from rgba(136, 244, 255, 0.25) and converts it to '#rrggbb'
      this.ctx.fillStyle = String(this.ctx.fillStyle).split(',').slice(0, -1).join(',') + ', 1)'

      this.color = {
        hex: String(this.ctx.fillStyle),
        alpha: isNaN(+alpha) ? 1 : +alpha,
      } // 0.25 or 1
    }
  }
}
