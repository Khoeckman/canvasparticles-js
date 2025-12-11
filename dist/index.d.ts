import type { CanvasParticlesCanvas, Particle } from './types'
import type { CanvasParticlesOptions, CanvasParticlesOptionsInput } from './types/options'
export default class CanvasParticles {
  #private
  static version: string
  /** Defines mouse interaction types with the particles */
  static interactionType: Readonly<{
    NONE: 0
    SHIFT: 1
    MOVE: 2
  }>
  /** Observes canvas elements entering or leaving the viewport to start/stop animation */
  static canvasIntersectionObserver: IntersectionObserver
  canvas: CanvasParticlesCanvas
  ctx: CanvasRenderingContext2D
  enableAnimating: boolean
  animating: boolean
  particles: Particle[]
  mouseX: number
  mouseY: number
  width: number
  height: number
  offX: number
  offY: number
  updateCount: number
  particleCount: number
  strokeStyleTable: Record<string, string>
  clientX: number
  clientY: number
  option: CanvasParticlesOptions
  /**
   * Initialize a CanvasParticles instance
   * @param selector - Canvas element or CSS selector
   * @param options - Configuration object for particles (https://github.com/Khoeckman/canvasParticles?tab=readme-ov-file#options)
   */
  constructor(selector: string | HTMLCanvasElement, options?: CanvasParticlesOptionsInput)
  /** @public Resize the canvas and update particles accordingly */
  resizeCanvas(
    rect?:
      | {
          width: number
          height: number
        }
      | null
      | Event
  ): void
  /** @public Update mouse coordinates relative to the canvas */
  updateMousePos(event: Event): void
  /** @public Remove existing particles and generate new ones */
  newParticles(): void
  /** @public Adjust particle array length to match `options.particles.ppm` */
  matchParticleCount({ updateBounds }?: { updateBounds?: boolean }): void
  /** @public Create a new particle with optional parameters */
  createParticle(posX?: number, posY?: number, dir?: number, speed?: number, size?: number): void
  /** @public Start the particle animation if it was not running before */
  start({ auto, reflow }?: { auto?: boolean; reflow?: boolean }): CanvasParticles
  /** @public Stops the particle animation and optionally clears the canvas */
  stop({ auto, clear }?: { auto?: boolean; clear?: boolean }): boolean
  /** @public Gracefully destroy the instance and remove the canvas element */
  destroy(): void
  /** Set and validate options (https://github.com/Khoeckman/canvasParticles?tab=readme-ov-file#options) */
  set options(options: CanvasParticlesOptionsInput)
  get options(): CanvasParticlesOptions
  /** @public Sets the canvas background */
  setBackground(background: CanvasParticlesOptionsInput['background']): void
  /** @public Transform the distance multiplier (float) to absolute distance (px) */
  setMouseConnectDistMult(connectDistMult: number): void
  /** @public Format particle color and opacity */
  setParticleColor(color: string | CanvasGradient | CanvasPattern): void
}
