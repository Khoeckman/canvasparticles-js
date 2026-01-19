// Copyright (c) 2022–2026 Kyle Hoeckman, MIT License
// https://github.com/Khoeckman/canvasparticles-js/blob/main/LICENSE

import type { CanvasParticlesCanvas, Particle, GridPos, ContextColor, LineSegment, SpatialGrid } from './types'
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

// Mulberry32 is ±392% faster than Math.random()
// Benchmark: https://jsbm.dev/muLCWR9RJCbmy
// Spectral test: /demo/mulberry32.html
const prng = Mulberry32(Math.random() * 2 ** 32).next

declare const __VERSION__: string

export default class CanvasParticles {
  static readonly version = __VERSION__

  private static readonly MAX_DT = 1000 / 50 // milliseconds between updates @ 50 FPS
  private static readonly BASE_DT = 1000 / 60 // milliseconds between updates @ 60 FPS

  /** Defines mouse interaction types with the particles */
  static readonly interactionType = Object.freeze({
    NONE: 0, // No mouse interaction
    SHIFT: 1, // Visual displacement only
    MOVE: 2, // Actual particle movement (default)
  })

  /** Defines how the particles are auto-generated */
  static readonly generationType = Object.freeze({
    MANUAL: 0, // Never auto-generate particles
    NEW: 1, // Generate particles from scratch
    MATCH: 2, // Add or remove particles to match new count (default)
  })

  /** Observes canvas elements entering or leaving the viewport to start/stop animation */
  static readonly canvasIntersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const canvas = entry.target as CanvasParticlesCanvas
        const instance = canvas.instance // The CanvasParticles class instance bound to this canvas

        if (!instance.options?.animation) return

        if ((canvas.inViewbox = entry.isIntersecting))
          instance.option.animation?.startOnEnter && instance.start({ auto: true })
        else instance.option.animation?.stopOnLeave && instance.stop({ auto: true, clear: false })
      }
    },
    {
      rootMargin: '-1px',
    }
  )

  static readonly canvasResizeObserver = new ResizeObserver((entries) => {
    // Seperate for loops is very important to prevent huge forced reflow overhead

    // First read all canvas rects at once
    for (const entry of entries) {
      const canvas = entry.target as CanvasParticlesCanvas
      canvas.instance.updateCanvasRect()
    }

    // Then resize all canvases at once
    for (const entry of entries) {
      const canvas = entry.target as CanvasParticlesCanvas
      canvas.instance.#resizeCanvas()
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

    if (value < min) {
      console.warn(new RangeError(`option.${name} was clamped to ${min} as ${value} is too low`))
    } else if (value > max) {
      console.warn(new RangeError(`option.${name} was clamped to ${max} as ${value} is too high`))
    }

    return CanvasParticles.defaultIfNaN(Math.min(Math.max(value ?? defaultValue, min), max), defaultValue)
  }

  canvas: CanvasParticlesCanvas
  private ctx: CanvasRenderingContext2D

  enableAnimating: boolean = false
  isAnimating: boolean = false
  private lastAnimationFrame: number = 0

  particles: Particle[] = []
  hasManualParticles = false // set to true once createParticle() is used
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

    this.resizeCanvas()
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true })
    window.addEventListener('scroll', this.handleScroll, { passive: true })
  }

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

  updateMousePos() {
    const { top, left } = this.canvas.rect
    this.mouseX = this.clientX - left
    this.mouseY = this.clientY - top
  }

  /** Resize the canvas and update particles accordingly */
  #resizeCanvas() {
    const width = (this.canvas.width = this.canvas.rect.width)
    const height = (this.canvas.height = this.canvas.rect.height)

    // Hide the mouse when resizing because it must be outside the viewport to do so
    this.mouseX = Infinity
    this.mouseY = Infinity

    this.width = Math.max(width + this.option.particles.connectDist * 2, 1)
    this.height = Math.max(height + this.option.particles.connectDist * 2, 1)
    this.offX = (width - this.width) / 2
    this.offY = (height - this.height) / 2

    const generationType = this.option.particles.generationType

    if (generationType !== CanvasParticles.generationType.MANUAL) {
      if (generationType === CanvasParticles.generationType.NEW || this.particles.length === 0) this.newParticles()
      else if (generationType === CanvasParticles.generationType.MATCH) this.matchParticleCount({ updateBounds: true })
    }

    if (this.isAnimating) this.#render()
  }

  /** Update the canvas bounding rectangle, resize the canvas and update particles accordingly */
  resizeCanvas() {
    this.updateCanvasRect()
    this.#resizeCanvas()
  }

  /** Update the target number of particles based on the current canvas size and `option.particles.ppm`, capped at `option.particles.max`. */
  #targetParticleCount(): number {
    // Amount of particles to be created
    let particleCount = Math.round((this.option.particles.ppm * this.width * this.height) / 1_000_000)
    particleCount = Math.min(this.option.particles.max, particleCount)

    if (!isFinite(particleCount)) throw new RangeError('particleCount must be finite')
    return particleCount | 0
  }

  /** Remove existing particles and generate new ones */
  newParticles({ keepAuto = false, keepManual = true } = {}) {
    const particleCount = this.#targetParticleCount()

    if (this.hasManualParticles && (keepAuto || keepManual)) {
      this.particles = this.particles.filter(
        (particle) => (keepAuto && !particle.isManual) || (keepManual && particle.isManual)
      )
      this.hasManualParticles = this.particles.length > 0
    } else {
      this.particles = []
    }

    if (!keepAuto) {
      for (let i = 0; i < particleCount; i++) this.#createParticle()
    }
  }

  /** Adjust particle array length to match `option.particles.ppm` */
  matchParticleCount({ updateBounds = false }: { updateBounds?: boolean } = {}) {
    const particleCount = this.#targetParticleCount()

    if (this.hasManualParticles) {
      const pruned: Particle[] = []
      let autoCount = 0

      // Keep manual particles while pruning automatic particles that exceed `particleCount`
      // Only count automatic particles towards `particledCount`
      for (const particle of this.particles) {
        if (particle.isManual) {
          pruned.push(particle)
          continue
        }

        if (autoCount >= particleCount) continue
        pruned.push(particle)
        autoCount++
      }
      this.particles = pruned
    } else {
      this.particles = this.particles.slice(0, particleCount)
    }

    // Only necessary after resize
    if (updateBounds) {
      for (const particle of this.particles) {
        this.#updateParticleBounds(particle)
      }
    }

    for (let i = this.particles.length; i < particleCount; i++) this.#createParticle()
  }

  /** Create a random new particle */
  #createParticle() {
    const posX = prng() * this.width
    const posY = prng() * this.height

    this.createParticle(
      posX,
      posY,
      prng() * TWO_PI,
      (0.5 + prng() * 0.5) * this.option.particles.relSpeed,
      (0.5 + Math.pow(prng(), 5) * 2) * this.option.particles.relSize,
      false
    )
  }

  /** Create a new particle with optional parameters */
  createParticle(posX: number, posY: number, dir: number, speed: number, size: number, isManual = true) {
    const particle: Omit<Particle, 'bounds'> = {
      posX, // Logical position in pixels
      posY, // Logical position in pixels
      x: posX, // Visual position in pixels
      y: posY, // Visual position in pixels
      velX: 0, // Horizonal speed in pixels per update
      velY: 0, // Vertical speed in pixels per update
      offX: 0, // Horizontal distance from drawn to logical position in pixels
      offY: 0, // Vertical distance from drawn to logical position in pixels
      dir: dir, // Direction in radians
      speed: speed, // Velocity in pixels per update
      size: size, // Ray in pixels of the particle
      gridPos: { x: 1, y: 1 },
      isVisible: false,
      isManual,
    }
    this.#updateParticleBounds(particle)
    this.particles.push(particle)
    this.hasManualParticles = true
  }

  /** Update the visible bounds of a particle */
  #updateParticleBounds(
    particle: Omit<Particle, 'bounds'> & Partial<Pick<Particle, 'bounds'>> // Make bounds optional on particle
  ): asserts particle is Particle {
    // The particle is considered visible within these bounds
    particle.bounds = {
      top: -particle.size,
      right: this.canvas.width + particle.size,
      bottom: this.canvas.height + particle.size,
      left: -particle.size,
    }
  }

  /* Randomize speed and size of all particles based on current options */
  randomizeParticles() {
    const relSpeed = this.option.particles.relSpeed
    const relSize = this.option.particles.relSize

    for (const particle of this.particles) {
      particle.speed = (0.5 + prng() * 0.5) * relSpeed
      particle.size = (0.5 + Math.pow(prng(), 5) * 2) * relSize
      this.#updateParticleBounds(particle) // because size changed
    }
  }

  /** Apply gravity forces between particles */
  #updateGravity(step: number) {
    const isRepulsiveEnabled = this.option.gravity.repulsive > 0
    const isPullingEnabled = this.option.gravity.pulling > 0

    if (!isRepulsiveEnabled && !isPullingEnabled) return

    const particles = this.particles
    const len = particles.length
    const connectDist = this.option.particles.connectDist
    const gravRepulsiveMult = connectDist * this.option.gravity.repulsive * step
    const gravPullingMult = connectDist * this.option.gravity.pulling * step
    const maxRepulsiveDist = connectDist / 2
    const maxRepulsiveDistSq = maxRepulsiveDist ** 2
    const epsilon = connectDist ** 2 / 256

    for (let a = 0; a < len; a++) {
      const pa = particles[a]

      for (let b = a + 1; b < len; b++) {
        // Code in this scope runs O(n^2) times per frame!
        const pb = particles[b]

        const distX = pa.posX - pb.posX
        const distY = pa.posY - pb.posY
        const distSq = distX * distX + distY * distY

        if (distSq >= maxRepulsiveDistSq && !isPullingEnabled) continue

        const invSqrt = 1 / Math.sqrt(distSq + epsilon)
        const invDist = invSqrt * invSqrt * invSqrt

        if (distSq < maxRepulsiveDistSq) {
          const grav = invDist * gravRepulsiveMult
          const gravX = -distX * grav
          const gravY = -distY * grav
          pa.velX -= gravX
          pa.velY -= gravY
          pb.velX += gravX
          pb.velY += gravY
        }

        if (!isPullingEnabled) continue

        const grav = invDist * gravPullingMult
        const gravX = -distX * grav
        const gravY = -distY * grav
        pa.velX += gravX
        pa.velY += gravY
        pb.velX -= gravX
        pb.velY -= gravY
      }
    }
  }

  /** Update positions, directions, and visibility of all particles */
  #updateParticles(step: number) {
    const width = this.width
    const height = this.height
    const offX = this.offX
    const offY = this.offY
    const mouseX = this.mouseX
    const mouseY = this.mouseY
    const rotationSpeed = this.option.particles.rotationSpeed * step
    const friction = this.option.gravity.friction
    const mouseConnectDist = this.option.mouse.connectDist
    const mouseDistRatio = this.option.mouse.distRatio
    const isMouseInteractionTypeNone = this.option.mouse.interactionType === CanvasParticles.interactionType.NONE
    const isMouseInteractionTypeMove = this.option.mouse.interactionType === CanvasParticles.interactionType.MOVE
    const easing = 1 - Math.pow(1 - 1 / 4, step)

    for (const p of this.particles) {
      p.dir += 2 * (Math.random() - 0.5) * rotationSpeed * step
      p.dir %= TWO_PI

      // Constant velocity
      const movX = Math.sin(p.dir) * p.speed
      const movY = Math.cos(p.dir) * p.speed

      // Apply velocities
      p.posX += (movX + p.velX) * step
      p.posY += (movY + p.velY) * step

      // Wrap particles around the canvas
      p.posX %= width
      if (p.posX < 0) p.posX += width

      p.posY %= height
      if (p.posY < 0) p.posY += height

      // Slightly decrease dynamic velocity
      p.velX *= Math.pow(friction, step)
      p.velY *= Math.pow(friction, step)

      // Distance from mouse
      const distX = p.posX + offX - mouseX
      const distY = p.posY + offY - mouseY

      // Mouse interaction
      if (!isMouseInteractionTypeNone) {
        const distRatio = mouseConnectDist / Math.hypot(distX, distY)

        if (mouseDistRatio < distRatio) {
          p.offX += (distRatio * distX - distX - p.offX) * easing
          p.offY += (distRatio * distY - distY - p.offY) * easing
        } else {
          p.offX -= p.offX * easing
          p.offY -= p.offY * easing
        }
      }

      // Visually displace the particles
      p.x = p.posX + p.offX
      p.y = p.posY + p.offY

      // Move the particles
      if (isMouseInteractionTypeMove) {
        p.posX = p.x
        p.posY = p.y
      }
      p.x += offX
      p.y += offY

      /**
       * Determine a particle's location in a 3x3 canvas grid to assess visibility.
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
      p.gridPos.x = (+(p.x >= p.bounds.left) + +(p.x > p.bounds.right)) as GridPos
      p.gridPos.y = (+(p.y >= p.bounds.top) + +(p.y > p.bounds.bottom)) as GridPos

      p.isVisible = p.gridPos.x === 1 && p.gridPos.y === 1
    }
  }

  /** Draw the particles on the canvas */
  #renderParticles() {
    const ctx = this.ctx

    for (const p of this.particles) {
      if (!p.isVisible) continue

      // Draw particles smaller than 1px as a square instead of a circle for performance
      if (p.size > 1) {
        // Draw circle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, TWO_PI)
        ctx.fill()
        ctx.closePath()
      } else {
        // Draw square (±183% faster)
        ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2)
      }
    }
  }

  /** @private */
  #buildSpatialGrid(): SpatialGrid {
    const particles = this.particles
    const len = particles.length
    const width = this.width | 0
    const invCellSize = Math.fround(1 / this.option.particles.connectDist)
    const grid: SpatialGrid = new Map()

    for (let i = 0; i < len; i++) {
      const particle = particles[i]
      const key = ((particle.x * invCellSize) | 0) + ((particle.y * invCellSize) | 0) * width
      const cell = grid.get(key)

      if (cell) cell.push(i)
      else grid.set(key, [i])
    }
    return grid
  }

  /** Determines whether a line between 2 particles crosses through the visible center of the canvas */
  static #isLineVisible(particleA: Particle, particleB: Particle) {
    // Visible if either particle is in the center
    if (particleA.isVisible || particleB.isVisible) return true

    // Not visible if both particles are in the same vertical or horizontal line that does not cross the center
    return !(
      (particleA.gridPos.x === particleB.gridPos.x && particleA.gridPos.x !== 1) ||
      (particleA.gridPos.y === particleB.gridPos.y && particleA.gridPos.y !== 1)
    )
  }

  /** Draw lines between particles if they are close enough */
  #renderConnections() {
    const particles = this.particles
    const len = particles.length
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
        if (!drawAll && !this.#isLineVisible(particleA, particleB)) continue

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

  /** Clear the canvas and render the particles and their connections onto the canvas */
  #render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.globalAlpha = this.color.alpha
    this.ctx.fillStyle = this.color.hex
    this.ctx.strokeStyle = this.color.hex
    this.ctx.lineWidth = 1

    this.#renderParticles()
    if (this.option.particles.drawLines) this.#renderConnections()
  }

  /** Main animation loop that updates and renders the particles */
  #animation() {
    if (!this.isAnimating) return

    requestAnimationFrame(() => this.#animation())

    const now = performance.now()

    // Elapsed time since last frame, clamped to avoid large simulation jumps
    const dt = Math.min(now - this.lastAnimationFrame, CanvasParticles.MAX_DT)

    // Normalized simulation step:
    // - step = 1   → exactly one baseline update (dt === BASE_DT)
    // - step > 1   → more time passed (lower FPS), advance further
    // - step < 1   → less time passed (higher FPS), advance less
    const step = dt / CanvasParticles.BASE_DT

    this.#updateGravity(step)
    this.#updateParticles(step)
    this.#render()
    this.lastAnimationFrame = now
  }

  /** Start the particle animation if it was not running before */
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

  /** Stops the particle animation and optionally clears the canvas */
  stop({ auto = false, clear = true }: { auto?: boolean; clear?: boolean } = {}): boolean {
    if (!auto) this.enableAnimating = false
    this.isAnimating = false
    if (clear !== false) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    return true
  }

  /** Gracefully destroy the instance and remove the canvas element */
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
        interactionType: ~~pno(
          'mouse.interactionType',
          options.mouse?.interactionType,
          CanvasParticles.interactionType.MOVE,
          { min: 0, max: 2 }
        ) as 0 | 1 | 2,
        connectDistMult: pno('mouse.connectDistMult', options.mouse?.connectDistMult, 2 / 3, { min: 0 }),
        connectDist: 1 /* post processed */,
        distRatio: pno('mouse.distRatio', options.mouse?.distRatio, 2 / 3, { min: 0 }),
      },
      particles: {
        generationType: ~~pno(
          'particles.generationType',
          options.particles?.generationType,
          CanvasParticles.generationType.MATCH,
          { min: 0, max: 2 }
        ) as 0 | 1 | 2,
        drawLines: !!(options.particles?.drawLines ?? true),
        color: options.particles?.color ?? 'black',
        ppm: ~~pno('particles.ppm', options.particles?.ppm, 100),
        max: Math.round(pno('particles.max', options.particles?.max, Infinity, { min: 0 })),
        maxWork: Math.round(pno('particles.maxWork', options.particles?.maxWork, Infinity, { min: 0 })),
        connectDist: ~~pno('particles.connectDistance', options.particles?.connectDistance, 150, { min: 1 }),
        relSpeed: pno('particles.relSpeed', options.particles?.relSpeed, 1, { min: 0 }),
        relSize: pno('particles.relSize', options.particles?.relSize, 1, { min: 0 }),
        rotationSpeed: pno('particles.rotationSpeed', options.particles?.rotationSpeed, 2, { min: 0 }) / 100,
      },
      gravity: {
        repulsive: pno('gravity.repulsive', options.gravity?.repulsive, 0, { min: 0 }),
        pulling: pno('gravity.pulling', options.gravity?.pulling, 0, { min: 0 }),
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

  /** Sets the canvas background */
  setBackground(background: CanvasParticlesOptionsInput['background']) {
    if (!background) return
    if (typeof background !== 'string') throw new TypeError('background is not a string')
    this.canvas.style.background = this.option.background = background
  }

  /** Transform the distance multiplier (float) to absolute distance (px) */
  setMouseConnectDistMult(connectDistMult: number) {
    const mult = CanvasParticles.parseNumericOption('mouse.connectDistMult', connectDistMult, 2 / 3, { min: 0 })
    this.option.mouse.connectDist = this.option.particles.connectDist * mult
  }

  /** Format particle color and opacity */
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
