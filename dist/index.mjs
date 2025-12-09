class CanvasParticles {
  static version = '4.0.7'
  static interactionType = Object.freeze({
    NONE: 0,
    SHIFT: 1,
    MOVE: 2,
  })
  static canvasIntersectionObserver = new IntersectionObserver((entry) => {
    entry.forEach((change) => {
      const canvas = change.target
      const instance = canvas.instance
      if (!instance.options?.animation) return
      if ((canvas.inViewbox = change.isIntersecting))
        instance.options.animation?.startOnEnter &&
          instance.start({
            auto: true,
          })
      else
        instance.options.animation?.stopOnLeave &&
          instance.stop({
            auto: true,
            clear: false,
          })
    })
  })
  canvas
  ctx
  enableAnimating
  animating
  particles
  mouseX
  mouseY
  width
  height
  offX
  offY
  updateCount
  particleCount
  strokeStyleTable
  clientX
  clientY
  option
  constructor(selector, options = {}) {
    let canvas
    if (selector instanceof HTMLCanvasElement) canvas = selector
    else {
      if (typeof selector !== 'string')
        throw new TypeError('selector is not a string and neither a HTMLCanvasElement itself')
      canvas = document.querySelector(selector)
      if (!(canvas instanceof HTMLCanvasElement)) throw new Error('selector does not point to a canvas')
    }
    this.canvas = canvas
    this.canvas.instance = this
    this.canvas.inViewbox = true
    this.ctx = this.canvas.getContext('2d')
    this.enableAnimating = false
    this.animating = false
    this.particles = []
    this.options = options
    CanvasParticles.canvasIntersectionObserver.observe(this.canvas)
    this.resizeCanvas = this.resizeCanvas.bind(this)
    this.updateMousePos = this.updateMousePos.bind(this)
    window.addEventListener('resize', this.resizeCanvas)
    this.resizeCanvas()
    window.addEventListener('mousemove', this.updateMousePos)
    window.addEventListener('scroll', this.updateMousePos)
  }
  resizeCanvas() {
    this.canvas.width = this.canvas.offsetWidth
    this.canvas.height = this.canvas.offsetHeight
    this.mouseX = Infinity
    this.mouseY = Infinity
    this.updateCount = Infinity
    this.width = Math.max(this.canvas.width + this.option.particles.connectDist * 2, 1)
    this.height = Math.max(this.canvas.height + this.option.particles.connectDist * 2, 1)
    this.offX = (this.canvas.width - this.width) / 2
    this.offY = (this.canvas.height - this.height) / 2
    if (this.option.particles.regenerateOnResize || this.particles.length === 0) this.newParticles()
    else
      this.matchParticleCount({
        updateBounds: true,
      })
  }
  updateMousePos(event) {
    if (!this.enableAnimating) return
    if (event instanceof MouseEvent) {
      this.clientX = event.clientX
      this.clientY = event.clientY
    }
    const { left: left, top: top } = this.canvas.getBoundingClientRect()
    this.mouseX = this.clientX - left
    this.mouseY = this.clientY - top
  }
  #updateParticleCount() {
    const particleCount = ((this.option.particles.ppm * this.width * this.height) / 1e6) | 0
    this.particleCount = Math.min(this.option.particles.max, particleCount)
    if (!isFinite(this.particleCount))
      throw new RangeError('number of particles must be finite. (options.particles.ppm)')
  }
  newParticles() {
    this.#updateParticleCount()
    this.particles = []
    for (let i = 0; i < this.particleCount; i++) this.createParticle()
  }
  matchParticleCount({ updateBounds: updateBounds = false } = {}) {
    this.#updateParticleCount()
    this.particles = this.particles.slice(0, this.particleCount)
    if (updateBounds) this.particles.forEach((particle) => this.#updateParticleBounds(particle))
    while (this.particleCount > this.particles.length) this.createParticle()
  }
  createParticle(posX, posY, dir, speed, size) {
    posX = typeof posX === 'number' ? posX - this.offX : Math.random() * this.width
    posY = typeof posY === 'number' ? posY - this.offY : Math.random() * this.height
    const particle = {
      posX: posX,
      posY: posY,
      x: posX,
      y: posY,
      velX: 0,
      velY: 0,
      offX: 0,
      offY: 0,
      dir: dir || Math.random() * 2 * Math.PI,
      speed: speed || (0.5 + Math.random() * 0.5) * this.option.particles.relSpeed,
      size: size || (0.5 + Math.random() ** 5 * 2) * this.option.particles.relSize,
      gridPos: {
        x: 1,
        y: 1,
      },
      isVisible: false,
    }
    this.#updateParticleBounds(particle)
    this.particles.push(particle)
  }
  #updateParticleBounds(particle) {
    particle.bounds = {
      top: -particle.size,
      right: this.canvas.width + particle.size,
      bottom: this.canvas.height + particle.size,
      left: -particle.size,
    }
  }
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
          const particleA = this.particles[i]
          const particleB = this.particles[j]
          const distX = particleA.posX - particleB.posX
          const distY = particleA.posY - particleB.posY
          const dist = Math.sqrt(distX * distX + distY * distY)
          let angle
          let grav = 1
          if (dist < maxRepulsiveDist) {
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
  #updateParticles() {
    if (this.width <= 0 || this.height <= 0) this.resizeCanvas()
    for (let particle of this.particles) {
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
      particle.x = particle.posX + particle.offX
      particle.y = particle.posY + particle.offY
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
  #gridPos(particle) {
    return {
      x: +(particle.x >= particle.bounds.left) + +(particle.x > particle.bounds.right),
      y: +(particle.y >= particle.bounds.top) + +(particle.y > particle.bounds.bottom),
    }
  }
  #isLineVisible(particleA, particleB) {
    if (particleA.isVisible || particleB.isVisible) return true
    return !(
      (particleA.gridPos.x === particleB.gridPos.x && particleA.gridPos.x !== 1) ||
      (particleA.gridPos.y === particleB.gridPos.y && particleA.gridPos.y !== 1)
    )
  }
  #generateHexAlphaTable(color) {
    const table = {}
    for (let alpha = 0; alpha < 256; alpha++) {
      table[alpha] = color + alpha.toString(16).padStart(2, '0')
    }
    return table
  }
  #renderParticles() {
    for (let particle of this.particles) {
      if (particle.isVisible) {
        if (particle.size > 1) {
          this.ctx.beginPath()
          this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI)
          this.ctx.fill()
          this.ctx.closePath()
        } else {
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
  #renderConnections() {
    const len = this.particleCount
    const drawAll = this.option.particles.connectDist >= Math.min(this.canvas.width, this.canvas.height)
    const maxWorkPerParticle = this.option.particles.connectDist * this.option.particles.maxWork
    for (let i = 0; i < len; i++) {
      let particleWork = 0
      for (let j = i + 1; j < len; j++) {
        const particleA = this.particles[i]
        const particleB = this.particles[j]
        if (!(drawAll || this.#isLineVisible(particleA, particleB))) continue
        const distX = particleA.x - particleB.x
        const distY = particleA.y - particleB.y
        const dist = Math.sqrt(distX * distX + distY * distY)
        if (dist > this.option.particles.connectDist) continue
        if (dist > this.option.particles.connectDist / 2) {
          const alpha = (Math.min(this.option.particles.connectDist / dist - 1, 1) * this.option.particles.opacity) | 0
          this.ctx.strokeStyle = this.strokeStyleTable[alpha]
        } else {
          this.ctx.strokeStyle = this.option.particles.colorWithAlpha
        }
        this.ctx.beginPath()
        this.ctx.moveTo(particleA.x, particleA.y)
        this.ctx.lineTo(particleB.x, particleB.y)
        this.ctx.stroke()
        if ((particleWork += dist) >= maxWorkPerParticle) break
      }
    }
  }
  #render() {
    this.canvas.width = this.canvas.width
    this.ctx.fillStyle = this.option.particles.colorWithAlpha
    this.ctx.lineWidth = 1
    this.#renderParticles()
    this.#renderConnections()
  }
  #animation({ reflow: reflow = false } = {}) {
    if (reflow) this.resizeCanvas()
    if (!this.animating) return
    requestAnimationFrame(() => this.#animation())
    if (++this.updateCount >= this.option.framesPerUpdate) {
      this.updateCount = 0
      this.#updateGravity()
      this.#updateParticles()
      this.#render()
    }
  }
  start({ auto: auto = false, reflow: reflow = false } = {}) {
    if (!this.animating && (!auto || this.enableAnimating)) {
      this.enableAnimating = true
      this.animating = true
      requestAnimationFrame(() =>
        this.#animation({
          reflow: reflow,
        })
      )
    }
    if (!this.canvas.inViewbox && this.option.animation.startOnEnter) this.animating = false
    return this
  }
  stop({ auto: auto = false, clear: clear = true } = {}) {
    if (!auto) this.enableAnimating = false
    this.animating = false
    if (clear !== false) this.canvas.width = this.canvas.width
    return true
  }
  destroy() {
    this.stop()
    CanvasParticles.canvasIntersectionObserver.unobserve(this.canvas)
    window.removeEventListener('resize', this.resizeCanvas)
    window.removeEventListener('mousemove', this.updateMousePos)
    window.removeEventListener('scroll', this.updateMousePos)
    this.canvas?.remove()
    Object.keys(this).forEach((key) => delete this[key])
  }
  set options(options) {
    const defaultIfNaN = (value, defaultValue) => (isNaN(+value) ? defaultValue : +value)
    const parseNumericOption = (value, defaultValue, clamp) => {
      const { min: min = -Infinity, max: max = Infinity } = clamp ?? {}
      return defaultIfNaN(Math.min(Math.max(value ?? defaultValue, min), max), defaultValue)
    }
    this.option = {
      background: options.background ?? false,
      framesPerUpdate: parseNumericOption(options.framesPerUpdate, 1, {
        min: 1,
      }),
      animation: {
        startOnEnter: !!(options.animation?.startOnEnter ?? true),
        stopOnLeave: !!(options.animation?.stopOnLeave ?? true),
      },
      mouse: {
        interactionType: parseNumericOption(options.mouse?.interactionType, 1),
        connectDistMult: parseNumericOption(options.mouse?.connectDistMult, 2 / 3),
        connectDist: 1,
        distRatio: parseNumericOption(options.mouse?.distRatio, 2 / 3),
      },
      particles: {
        regenerateOnResize: !!options.particles?.regenerateOnResize,
        color: options.particles?.color ?? 'black',
        colorWithAlpha: '#00000000',
        ppm: parseNumericOption(options.particles?.ppm, 100),
        max: parseNumericOption(options.particles?.max, 500),
        maxWork: parseNumericOption(options.particles?.maxWork, Infinity, {
          min: 0,
        }),
        connectDist: parseNumericOption(options.particles?.connectDistance, 150, {
          min: 1,
        }),
        relSpeed: parseNumericOption(options.particles?.relSpeed, 1, {
          min: 0,
        }),
        relSize: parseNumericOption(options.particles?.relSize, 1, {
          min: 1,
        }),
        rotationSpeed:
          parseNumericOption(options.particles?.rotationSpeed, 2, {
            min: 0,
          }) / 100,
        opacity: 0,
      },
      gravity: {
        repulsive: parseNumericOption(options.gravity?.repulsive, 0),
        pulling: parseNumericOption(options.gravity?.pulling, 0),
        friction: parseNumericOption(options.gravity?.friction, 0.8, {
          min: 0,
          max: 1,
        }),
      },
    }
    this.setBackground(this.option.background)
    this.setMouseConnectDistMult(this.option.mouse.connectDistMult)
    this.setParticleColor(this.option.particles.color)
  }
  get options() {
    return this.option
  }
  setBackground(background) {
    if (!background) return
    if (typeof background !== 'string') throw new TypeError('background is not a string')
    this.canvas.style.background = this.option.background = background
  }
  setMouseConnectDistMult(connectDistMult) {
    this.option.mouse.connectDist =
      this.option.particles.connectDist * (isNaN(connectDistMult) ? 2 / 3 : connectDistMult)
  }
  setParticleColor(color) {
    this.ctx.fillStyle = color
    if (String(this.ctx.fillStyle)[0] === '#') this.option.particles.opacity = 255
    else {
      this.option.particles.opacity =
        (parseFloat(String(this.ctx.fillStyle).split(',').at(-1)?.slice(1, -1) ?? '1') * 255) | 0
      this.ctx.fillStyle = String(this.ctx.fillStyle).split(',').slice(0, -1).join(',') + ', 1)'
    }
    this.option.particles.color = this.ctx.fillStyle
    this.option.particles.colorWithAlpha = this.option.particles.color + this.option.particles.opacity.toString(16)
    this.strokeStyleTable = this.#generateHexAlphaTable(this.option.particles.color)
  }
}

export { CanvasParticles as default }
