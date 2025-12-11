export interface CanvasParticlesOptions {
  background: CSSStyleDeclaration['background'] | false
  framesPerUpdate: number
  animation: {
    startOnEnter: boolean
    stopOnLeave: boolean
  }
  mouse: {
    interactionType: number
    connectDistMult: number
    connectDist: number
    distRatio: number
  }
  particles: {
    regenerateOnResize: boolean
    color: string | CanvasGradient | CanvasPattern
    ppm: number
    max: number
    maxWork: number
    connectDistance?: number
    connectDist: number
    relSpeed: number
    relSize: number
    rotationSpeed: number
  }
  gravity: {
    repulsive: number
    pulling: number
    friction: number
  }
}
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}
export type CanvasParticlesOptionsInput = DeepPartial<CanvasParticlesOptions>
export {}
