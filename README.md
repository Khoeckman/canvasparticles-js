# Canvas Particles JS

<span class="badge-npmversion"><a href="https://npmjs.org/package/canvasparticles-js" title="View this project on NPM"><img src="https://img.shields.io/npm/v/canvasparticles-js.svg" alt="NPM version" /></a></span>
<span class="badge-npmversion"><a href="https://npmjs.org/package/canvasparticles-js" title="View this project on NPM"><img src="https://img.shields.io/npm/d18m/canvasparticles-js.svg" alt="NPM downloads" /></a></span>
<span><a href="https://www.jsdelivr.com/package/npm/canvasparticles-js" title="View this project on jsDelivr"><img src="https://data.jsdelivr.com/v1/package/npm/canvasparticles-js/badge?style=rounded" alt="jsDelivr hits" /></a></span>
<span><a href="https://github.com/Khoeckman/canvasparticles-js/actions" title="View GitHub workflows"><img src="https://github.com/Khoeckman/canvasparticles-js/actions/workflows/node.js.yml/badge.svg" alt="GitHub workflows" /></a></span>

## Description

In an HTML canvas, a bunch of floating particles connected with lines when they approach each other.
Creating a fun and interactive background. Colors, interaction and gravity can be customized!

[Showcase](#showcase)<br>
[Implementation](#implementation)<br>
[Class instantiation](#class-instantiation)<br>
[Options](#options)<br>
[One pager example](#one-pager-example)

## Showcase

If you dont like reading documentation this website is for you:<br>
[https://canvasparticleshomepage.onrender.com/](https://canvasparticleshomepage.onrender.com/)

## Implementation

Particles will be drawn onto a `<canvas>` element.

```html
<canvas id="my-canvas"></canvas>
```

<details open>
  <summary><h3>Import with npm</h3></summary>

```batch
npm install canvasparticles-js
```

Add a `<script>` element in the `<head>` to import _initParticles.js_.

```html
<head>
  <script src="./initParticles.js" type="module"></script>
</head>
```

Inside _initParticles.js_:

```js
import CanvasParticles from 'canvasparticles-js'

const selector = '#my-canvas' // Query Selector for the canvas
const options = { ... } // See #options
new CanvasParticles(selector, options).start()
```

</details>

<details>
  <summary><h3>Import with jsDelivr</h3></summary>

Add a `<script>` element in the `<head>` to import `CanvasParticles`.

```html
<head>
  <script src="https://cdn.jsdelivr.net/npm/canvasparticles-js/canvasParticles.min.js" defer></script>
</head>
```

</details>

<details>
  <summary><h3>Import raw file as ES module</h3></summary>

Be aware that using ES modules is only possible when running the application on a (local) server.<br>
[Same Origin Policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)

Add a `<script>` element in the `<head>` to import _initParticles.js_.

```html
<head>
  <script src="./initParticles.js" type="module"></script>
</head>
```

Inside _initParticles.js_:

```js
import CanvasParticles from './canvasParticles.mjs'

const selector = '#my-canvas' // Query Selector for the canvas
const options = { ... } // See #options
new CanvasParticles(selector, options).start()
```

</details>

<details>
  <summary><h3>Import raw file globally</h3></summary>
  
  Add a `<script>` element in the `<head>` to import the *canvasParticles.js* file.<br>
  ```html
  <head>
    <script src="./canvasParticles.js" defer></script>
  </head>
  ```

Add an inline `<script>` element at the very bottom of the `<body>`.

```html
<body>
  ...

  <script>
    const initParticles = () => {
      const selector = '#my-canvas' // Query Selector for the canvas
      const options = { ... } // See #options
      new CanvasParticles(selector, options).start()
    }
    document.addEventListener('DOMContentLoaded', initParticles)
  </script>
</body>
```

</details>

<br>
<br>

### Start animating

```js
const selector = '#my-canvas' // Query Selector for the canvas
const options = { ... } // See #options
new CanvasParticles(selector, options).start()
```

### Starting and stopping animation

```js
const particles = new CanvasParticles(selector, options)
particles.start()
particles.stop()
```

To keep the last frame visible when stopping the animation:

```js
particles.stop({ clear: false }) // Default: true
```

### Destruction

Gracefully destroy the instance and remove the canvas element.

```js
particles.destroy()
delete particles // Optional
```

## Class instantiation

### Valid ways to instantiate `CanvasParticles`

```js
const selector = '#my-canvas'
const options = {}
const canvasElement = document.querySelector(selector)

let instance, canvas

// Basic instantiation
instance = new CanvasParticles(selector)
instance = new CanvasParticles(canvasElement)

// Instantiation with custom options
instance = new CanvasParticles(selector, options)
instance = new CanvasParticles(canvasElement, options)
```

### Chaining methods

You can chain .start() for a cleaner syntax:

```js
instance = new CanvasParticles(selector).start()

// Access the canvas directly
canvas = new CanvasParticles(selector).canvas
canvas = new CanvasParticles(selector).start().canvas
```

### Without chaining

If you prefer not to chain methods, you can instantiate first and start later:

```js
instance = new CanvasParticles(selector)
instance.start()
canvas = instance.canvas
```

### Incorrect usage

The following will not return the expected value because `CanvasParticles` only supports method chaining for `.start()`:

```js
instance = new CanvasParticles(selector).anyOtherMethod()
canvas = new CanvasParticles(selector).anyOtherMethod().canvas
```

## Options

Configuration options for the particles and their behavior.<br>
Play around with these values: [Sandbox](http://kylehoeckman.great-site.net/canvas-particles/#sandbox)

<details>
  <summary><h3>Options structure</h3></summary>

The default value will be used when an option is assigned an invalid value.<br>
Your screen resolution and refresh rate will directly impact perfomance!

```js
const options = {
  /** @param {string} [options.background=false] - Background of the canvas. Can be any CSS supported value for the background property.
   * @note No background will be set if background is not a string.
   */
  background: 'linear-gradient(115deg, #354089, black)',

  /** @param {integer} [options.framesPerUpdate=1] - How many times the same frame will be shown before an update happens.
   * @example 60 fps / 2 framesPerUpdate = 30 updates/s
   * @example 144 fps / 3 framesPerUpdate = 48 updates/s
   */
  framesPerUpdate: 1, // recommended: 1 - 3

  /** @param {Object} [options.animation] - Animation settings. */
  animation: {
    /** @param {boolean} [options.animation.startOnEnter=true] - Whether to start the animation when the canvas enters the viewport. */
    startOnEnter: true,

    /** @param {boolean} [options.animation.stopOnLeave=true] - Whether to stop the animation when the canvas leaves the viewport. */
    stopOnLeave: true,
  },

  /** @param {Object} [options.mouse] - Mouse interaction settings. */
  mouse: {
    /** @param {0|1|2} [options.mouse.interactionType=1] - The type of interaction the mouse will have with particles.
     *
     * CanvasParticles.interactionType.NONE = 0 = No interaction.
     * CanvasParticles.interactionType.SHIFT = 1 = The mouse can visually shift the particles.
     * CanvasParticles.interactionType.MOVE = 2 = The mouse can move the particles.
     * @note mouse.distRatio should be less than 1 to allow dragging, closer to 0 is easier to drag
     */
    interactionType: 2,

    /** @param {float} [options.mouse.connectDistMult=2÷3] - The maximum distance for the mouse to interact with the particles.
     * The value is multiplied by particles.connectDistance
     * @example 0.8 connectDistMult * 150 particles.connectDistance = 120 pixels
     */
    connectDistMult: 0.8,

    /** @param {number} [options.mouse.distRatio=2÷3] - All particles within set radius from the mouse will be drawn to mouse.connectDistance pixels from the mouse.
     * @example radius = 150 connectDistance / 0.4 distRatio = 375 pixels
     * @note Keep this value above mouse.connectDistMult
     */
    distRatio: 1, // recommended: 0.2 - 1
  },

  /** @param {Object} [options.particles] - Particle settings. */
  particles: {
    /** param {string} [options.particles.color='black'] - The color of the particles and their connections. Can be any CSS supported color format. */
    color: '#88c8ffa0',

    /** @param {number} [options.particles.ppm=100] - Particles per million (ppm).
     * This determines how many particles are created per million pixels of the canvas.
     * @example FHD on Chrome = 1920 width * 937 height = 1799040 pixels; 1799040 pixels * 100 ppm / 1_000_000 = 179.904 = 179 particles
     * @important The amount of particles exponentially reduces performance.
     * People with large screens will have a bad experience with high values.
     * One solution is to increase particles.connectDistance and decrease this value.
     */
    ppm: 100, // recommended: < 120

    /** @param {number} [options.particles.max=500] - The maximum number of particles allowed. */
    max: 200, // recommended: < 500

    /** @param {number} [options.particles.maxWork=Infinity] - The maximum "work" a particle can perform before its connections are no longer drawn.
     * @example 10 maxWork = 10 * 150 connectDistance = max 1500 pixels of lines drawn per particle
     * @important Low values will stabilize performance at the cost of creating an ugly effect where connections may flicker.
     */
    maxWork: 10,

    /** @param {number} [options.particles.connectDistance=150] - The maximum distance for a connection between 2 particles.
     * @note Heavily affects performance. */
    connectDistance: 150,

    /** @param {number} [options.particles.relSpeed=1] - The relative moving speed of the particles.
     * The moving speed is a random value between 0.5 and 1 pixels per update multiplied by this value.
     */
    relSpeed: 0.8,

    /** @param {number} [options.particles.relSize=1] - The relative size of the particles.
     * The ray is a random value between 0.5 and 2.5 pixels multiplied by this value.
     */
    relSize: 1.1,

    /** @param {number} [options.particles.rotationSpeed=2] - The speed at which the particles randomly changes direction.
     * @example 1 rotationSpeed = max direction change of 0.01 radians per update
     */
    rotationSpeed: 1, // recommended: < 10

    /** @param {boolean} [options.particles.regenerateOnResize=false] - Create new particles when the canvas gets resized.
     * @note If false, will instead add or remove a few particles to match particles.ppm
     */
    regenerateOnResize: false,
  },

  /** @param {Object} [options.gravity] - Gravitational force settings.
   * @important Heavily reduces performance if gravity.repulsive or gravity.pulling is not equal to 0
   */
  gravity: {
    /** @param {number} [options.gravity.repulsive=0] - The repulsive force between particles. */
    repulsive: 2, // recommended: 0.50 - 5.00

    /** @param {number} [options.gravity.pulling=0] - The attractive force pulling particles together. Works poorly if `gravity.repulsive` is too low.
     * @note gravity.repulsive should be great enough to prevent forming a singularity.
     */
    pulling: 0.0, // recommended: 0.01 - 0.10

    /** @param {number} [options.gravity.friction=0.9] -  The smoothness of the gravitational forces.
     * The force gets multiplied by the fricion every update.
     * @example force after x updates = force * friction ** x
     */
    friction: 0.8, // recommended: 0.500 - 0.999
  },
}
```

</details>

### Update options on the fly

**Note:** The new option values are not validated, except for the options with a setter. Assigning invalid values will lead to unexpected behavior and system errors.

#### Using the setter

These options require dedicated setters to ensure proper integration.

- options.background
- options.mouse.connectDistMult
- options.particles.color

```js
const particles = new CanvasParticles(selector, options)

// Use the setters to update these specific options
particles.setBackground('red')
particles.setMouseConnectDistMult(0.8)
particles.setParticleColor('hsl(149, 100%, 50%)')
```

#### Changing the particle count

After updating the following options, the number of particles is not automatically adjusted:

- options.particles.ppm
- options.particles.max

```js
particles.options.particles.ppm = 100
particles.options.particles.max = 300

// Apply the changes using one of these methods:
particles.newParticles() // Remove all particles and create the correct amount of new ones
particles.matchParticleCount() // Add or remove some particles to match the count
```

#### Modifying object properties

**All** other options can be updated by modifying the `options` object properties, with changes taking immediate effect.

```js
particles.options.mouse.interactionType = 0
particles.options.particles.connectDist = 200
particles.options.gravity.repulsive = 1
```

#### Updating options object

To update all options for the same class, pass a new options object.

```js
const options = { ... }
particles.setOptions(options)
```

## One pager example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      #canvas-particles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1; /* Place behind other elements to act as background */
      }
    </style>
  </head>

  <body>
    <canvas id="canvas-particles"></canvas>

    <script src="https://cdn.jsdelivr.net/npm/canvasparticles-js/canvasParticles.min.js"></script>
    <script>
      const selector = '#canvas-particles'
      const options = {
        background: 'hsl(125, 42%, 35%)',
        mouse: {
          interactionType: CanvasParticles.interactionType.MOVE, // === 2
        },
        particles: {
          color: 'rgba(150, 255, 105, 0.95)',
          max: 200,
        },
      }
      new CanvasParticles(selector, options).start()
    </script>
  </body>
</html>
```
