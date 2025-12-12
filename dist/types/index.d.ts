import CanvasParticles from '..'
import { CanvasParticlesOptions } from './options'
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
}
export interface ParticleBounds {
  top: number
  right: number
  bottom: number
  left: number
}
export interface ParticleGridPos {
  x: 0 | 1 | 2
  y: 0 | 1 | 2
}
export interface ContextColor {
  hex: string
  alpha: number
}
export {}
