import type CanvasParticles from '..'
import type { CanvasParticlesOptions } from './options'

export interface CanvasParticlesCanvas extends HTMLCanvasElement {
  instance: CanvasParticles
  rect: CanvasRect
  inViewbox: boolean
  options: CanvasParticlesOptions
}

interface CanvasRect {
  top: number
  left: number
  width: number
  height: number
}

export interface Particle {
  posX: number
  posY: number
  x: number
  y: number
  velX: number
  velY: number
  offX: number
  offY: number
  dir: number
  speed: number
  size: number
  bounds: ParticleBounds
  gridPos: ParticleGridPos
  isVisible: boolean
  isManual: boolean
}

export interface ParticleBounds {
  top: number
  right: number
  bottom: number
  left: number
}

export type GridPos = 0 | 1 | 2

export interface ParticleGridPos {
  x: GridPos
  y: GridPos
}

export interface ContextColor {
  hex: string
  alpha: number
}

export type SpatialGrid = Map</* key: */ number, /* indexesOfParticles: */ number[]>
