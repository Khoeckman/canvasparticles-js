// Type definitions for canvasParticles 3.6.9
// Project: https://github.com/Khoeckman/canvasParticles
// Definitions by: Grok (based on provided JavaScript code and options documentation)

export default class CanvasParticles {
  /**
   * The version of the CanvasParticles library, used to display on the homepage.
   */
  static readonly version: string

  /**
   * Enum-like object defining possible mouse interaction types with particles.
   */
  static readonly interactionType: {
    readonly NONE: 0
    readonly SHIFT: 1
    readonly MOVE: 2
  }

  /**
   * IntersectionObserver to start or stop animation when the canvas enters or exits the viewport.
   */
  static readonly canvasIntersectionObserver: IntersectionObserver

  /**
   * Creates a new CanvasParticles instance.
   * @param selector - The CSS selector to the canvas element or the HTMLCanvasElement itself.
   * @param options - Configuration options for the particle system.
   */
  constructor(selector: string | HTMLCanvasElement, options?: CanvasParticlesOptions)

  /**
   * The canvas element associated with this instance.
   */
  canvas: HTMLCanvasElement

  /**
   * The 2D rendering context of the canvas.
   */
  ctx: CanvasRenderingContext2D

  /**
   * Flag indicating whether animation is enabled.
   */
  enableAnimating: boolean

  /**
   * Flag indicating whether the animation is currently running.
   */
  animating: boolean

  /**
   * Array of particles managed by this instance.
   */
  particles: Particle[]

  /**
   * Current mouse X position relative to the canvas.
   */
  mouseX: number

  /**
   * Current mouse Y position relative to the canvas.
   */
  mouseY: number

  /**
   * Client X coordinate of the mouse.
   */
  clientX: number

  /**
   * Client Y coordinate of the mouse.
   */
  clientY: number

  /**
   * Logical width of the particle system, including connection distance buffer.
   */
  width: number

  /**
   * Logical height of the particle system, including connection distance buffer.
   */
  height: number

  /**
   * Horizontal offset for particle rendering.
   */
  offX: number

  /**
   * Vertical offset for particle rendering.
   */
  offY: number

  /**
   * Counter for frames since last update.
   */
  updateCount: number

  /**
   * Target number of particles based on canvas size and ppm.
   */
  particleCount: number

  /**
   * Lookup table for stroke styles with varying alpha values.
   */
  strokeStyleTable: { [alpha: number]: string }

  /**
   * Configuration options for the particle system.
   */
  options: CanvasParticlesOptions

  /**
   * Resizes the canvas to match its display size and updates particle properties.
   */
  resizeCanvas(): void

  /**
   * Updates the mouse position relative to the canvas.
   * @param event - The mouse or scroll event.
   */
  updateMousePos(event: MouseEvent | Event): void

  /**
   * Generates new particles to match the target particle count.
   */
  newParticles(): void

  /**
   * Adjusts the number of particles to match the target count.
   */
  matchParticleCount(): void

  /**
   * Creates a new particle with specified or random properties.
   * @param posX - Initial X position (optional).
   * @param posY - Initial Y position (optional).
   * @param dir - Initial direction in radians (optional).
   * @param speed - Initial speed (optional).
   * @param size - Particle size (optional).
   */
  createParticle(posX?: number, posY?: number, dir?: number, speed?: number, size?: number): void

  /**
   * Starts the particle animation.
   * @param options - Optional configuration for starting the animation.
   * @returns The current instance for method chaining.
   */
  start(options?: { auto?: boolean }): this

  /**
   * Stops the particle animation and optionally clears the canvas.
   * @param options - Optional configuration for stopping the animation.
   * @returns `true` when the animation is successfully stopped.
   */
  stop(options?: { auto?: boolean; clear?: boolean }): boolean

  /**
   * Destroys the instance, removes event listeners, and removes the canvas element.
   */
  destroy(): void

  /**
   * Sets and validates the options for the particle system.
   * @param options - Configuration options.
   */
  setOptions(options: CanvasParticlesOptions): void

  /**
   * Sets the canvas background.
   * @param background - The CSS background style or false to disable.
   * @throws TypeError if background is not a string or false.
   */
  setBackground(background: string | false): void

  /**
   * Sets the mouse connection distance multiplier.
   * @param connectDistMult - Multiplier for the mouse interaction distance.
   */
  setMouseConnectDistMult(connectDistMult: number): void

  /**
   * Sets the particle color and opacity.
   * @param color - The CSS color for particles and connections.
   */
  setParticleColor(color: string): void
}

/**
 * Configuration options for the CanvasParticles class.
 * @remarks Your screen resolution and refresh rate will directly impact performance.
 */
interface CanvasParticlesOptions {
  /**
   * Background of the canvas. Can be any CSS supported value for the background property.
   * @default false
   * @remarks No background will be set if background is not a string.
   */
  background?: string | false

  /**
   * How many times the same frame will be shown before an update happens.
   * @default 1
   * @example 60 fps / 2 framesPerUpdate = 30 updates/s
   * @example 144 fps / 3 framesPerUpdate = 48 updates/s
   * @remarks Recommended: 1 - 3
   */
  framesPerUpdate?: number

  /**
   * Animation settings.
   */
  animation?: {
    /**
     * Whether to start the animation when the canvas enters the viewport.
     * @default true
     */
    startOnEnter?: boolean

    /**
     * Whether to stop the animation when the canvas leaves the viewport.
     * @default true
     */
    stopOnLeave?: boolean
  }

  /**
   * Mouse interaction settings.
   */
  mouse?: {
    /**
     * The type of interaction the mouse will have with particles.
     * - `CanvasParticles.interactionType.NONE` (0): No interaction.
     * - `CanvasParticles.interactionType.SHIFT` (1): The mouse can visually shift the particles.
     * - `CanvasParticles.interactionType.MOVE` (2): The mouse can move the particles.
     * @default 1
     * @remarks `distRatio` should be less than 1 to allow dragging; closer to 0 is easier to drag.
     */
    interactionType?: number

    /**
     * The maximum distance for the mouse to interact with the particles.
     * The value is multiplied by `particles.connectDistance`.
     * @default 2/3
     * @example 0.8 connectDistMult * 150 particles.connectDistance = 120 pixels
     */
    connectDistMult?: number

    /**
     * All particles within set radius from the mouse will be drawn to `mouse.connectDistance` pixels from the mouse.
     * @default 2/3
     * @example radius = 150 connectDistance / 0.4 distRatio = 375 pixels
     * @remarks Keep this value above `mouse.connectDistMult`. Recommended: 0.2 - 1.
     */
    distRatio?: number

    /**
     * Computed mouse connection distance (read-only).
     */
    connectDist?: number
  }

  /**
   * Particle settings.
   */
  particles?: {
    /**
     * Create new particles when the canvas gets resized.
     * @default false
     * @remarks If false, will instead add or remove a few particles to match `particles.ppm`.
     */
    regenerateOnResize?: boolean

    /**
     * The color of the particles and their connections. Can be any CSS supported color format.
     * @default 'black'
     */
    color?: string

    /**
     * Particles per million pixels (ppm). Determines how many particles are created per million pixels of the canvas.
     * @default 100
     * @example FHD on Chrome = 1920 width * 937 height = 1799040 pixels; 1799040 pixels * 100 ppm / 1_000_000 = 179.904 = 179 particles
     * @remarks The amount of particles exponentially reduces performance. People with large screens will have a bad experience with high values. One solution is to increase `particles.connectDistance` and decrease this value. Recommended: < 120.
     */
    ppm?: number

    /**
     * The maximum number of particles allowed.
     * @default 500
     * @remarks Recommended: < 500
     */
    max?: number

    /**
     * The maximum "work" a particle can perform before its connections are no longer drawn.
     * @default Infinity
     * @example 10 maxWork = 10 * 150 connectDistance = max 1500 pixels of lines drawn per particle
     * @remarks Low values will stabilize performance at the cost of creating an ugly effect where connections may flicker.
     */
    maxWork?: number

    /**
     * The maximum distance for a connection between two particles.
     * @default 150
     * @remarks Heavily affects performance.
     */
    connectDist?: number

    /**
     * The relative moving speed of the particles. The moving speed is a random value between 0.5 and 1 pixels per update multiplied by this value.
     * @default 1
     */
    relSpeed?: number

    /**
     * The relative size of the particles. The radius is a random value between 0.5 and 2.5 pixels multiplied by this value.
     * @default 1
     */
    relSize?: number

    /**
     * The speed at which the particles randomly change direction.
     * @default 2
     * @example 1 rotationSpeed = max direction change of 0.01 radians per update
     * @remarks Recommended: < 10
     */
    rotationSpeed?: number

    /**
     * Computed opacity for particles (read-only).
     */
    opacity?: number

    /**
     * Computed color with alpha (read-only).
     */
    colorWithAlpha?: string
  }

  /**
   * Gravitational force settings.
   * @remarks Heavily reduces performance if `gravity.repulsive` or `gravity.pulling` is not equal to 0.
   */
  gravity?: {
    /**
     * The repulsive force between particles.
     * @default 0
     * @remarks Recommended: 0.50 - 5.00
     */
    repulsive?: number

    /**
     * The attractive force pulling particles together. Works poorly if `gravity.repulsive` is too low.
     * @default 0
     * @remarks `gravity.repulsive` should be great enough to prevent forming a singularity. Recommended: 0.01 - 0.10
     */
    pulling?: number

    /**
     * The smoothness of the gravitational forces. The force gets multiplied by the friction every update.
     * @default 0.8
     * @example force after x updates = force * friction ** x
     * @remarks Recommended: 0.500 - 0.999
     */
    friction?: number
  }
}

/**
 * Interface for a single particle.
 */
interface Particle {
  /**
   * Logical X position in pixels.
   */
  posX: number

  /**
   * Logical Y position in pixels.
   */
  posY: number

  /**
   * Visual X position in pixels.
   */
  x: number

  /**
   * Visual Y position in pixels.
   */
  y: number

  /**
   * Horizontal velocity in pixels per update.
   */
  velX: number

  /**
   * Vertical velocity in pixels per update.
   */
  velY: number

  /**
   * Horizontal offset from logical to visual position.
   */
  offX: number

  /**
   * Vertical offset from logical to visual position.
   */
  offY: number

  /**
   * Direction in radians.
   */
  dir: number

  /**
   * Velocity in pixels per update.
   */
  speed: number

  /**
   * Particle radius in pixels.
   */
  size: number

  /**
   * Bounds for visibility checking.
   */
  bounds: {
    top: number
    right: number
    bottom: number
    left: number
  }

  /**
   * Grid position in a 3x3 canvas grid.
   */
  gridPos: {
    x: number
    y: number
  }

  /**
   * Whether the particle is visible in the canvas center.
   */
  isVisible: boolean
}
