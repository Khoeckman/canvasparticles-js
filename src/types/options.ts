export interface CanvasParticlesOptions {
  background: CSSStyleDeclaration['background'] | false

  animation: {
    startOnEnter: boolean
    stopOnLeave: boolean
  }

  mouse: {
    interactionType: 0 | 1 | 2 /* see CanvasParticles.interactionType */
    connectDist: number /* post processed */
    distRatio: number
  }

  particles: {
    generationType: 0 | 1 | 2 /* see CanvasParticles.generationType */
    drawLines: boolean
    color: string | CanvasGradient | CanvasPattern
    ppm: number
    max: number
    maxWork: number
    connectDistance?: number /* assignment alias for `connectDist` */
    connectDist: number
    relSpeed: number
    relSize: number
    rotationSpeed: number
  }

  gravity: {
    repulsive: number
    pulling: number
    friction: number
    maxVelocity: number
  }

  debug: {
    drawGrid: boolean
    drawIndexes: boolean
  }
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export type CanvasParticlesOptionsInput = DeepPartial<CanvasParticlesOptions> & {
  mouse?: { connectDistMult?: number }
}
