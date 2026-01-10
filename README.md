# Canvas Particles JS

<span class="badge-npmversion"><a href="https://npmjs.org/package/canvasparticles-js" title="View this project on NPM"><img src="https://img.shields.io/npm/v/canvasparticles-js.svg" alt="NPM version" /></a></span>
<span class="badge-npmversion"><a href="https://npmjs.org/package/canvasparticles-js" title="View this project on NPM"><img src="https://img.shields.io/npm/d18m/canvasparticles-js.svg" alt="NPM downloads" /></a></span>
<span><a href="https://www.jsdelivr.com/package/npm/canvasparticles-js" title="View this project on jsDelivr"><img src="https://data.jsdelivr.com/v1/package/npm/canvasparticles-js/badge?style=rounded" alt="jsDelivr hits" /></a></span>
<span><a href="https://github.com/Khoeckman/canvasparticles-js/actions" title="View GitHub workflows"><img src="https://github.com/Khoeckman/canvasparticles-js/actions/workflows/node.js.yml/badge.svg" alt="GitHub workflows" /></a></span>

## Description

In an HTML canvas, a bunch of floating particles connected with lines when they approach each other.
Creating a fun and interactive background. Colors, interaction and gravity can be customized!

[Showcase](#showcase)<br>
[Import](#import)<br>
[Implementation](#implementation)<br>
[Class Instantiation](#class-instantiation)<br>
[Options](#options)<br>
[Manually creating particles](#manually-creating-particles)<br>
[One Pager Example](#one-pager-example)

---

## Showcase

If you dont like reading documentation this website is for you:<br>

[https://khoeckman.github.io/canvasparticles-js/](https://khoeckman.github.io/canvasparticles-js/)

[![Banner with particles and title: Canvas Particles](./demo/banner.webp)](https://khoeckman.github.io/canvasparticles-js/)

---

## Import

Particles will be drawn onto a `<canvas>` element.

```html
<canvas id="my-canvas"></canvas>
```

### npm

```bash
npm install canvasparticles-js
# or
pnpm add canvasparticles-js
```

**ES Module import**

```js
import CanvasParticles from 'canvasparticles-js'
```

If you don't have a bundler:

```js
import CanvasParticles from './node_modules/canvasparticles-js/dist/index.mjs'
```

**Global import**

```html
<script src="./node_modules/canvasparticles-js/dist/index.umd.js" defer></script>
```

No import required in each JavaScript file!

### Import with jsDelivr

**ES Module import**

```js
import CanvasParticles from 'https://cdn.jsdelivr.net/npm/canvasparticles-js/dist/index.min.mjs'
```

**Global import**

```html
<script src="https://cdn.jsdelivr.net/npm/canvasparticles-js/dist/index.umd.min.js" defer></script>
```

---

## Implementation

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

---

## Class Instantiation

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

You can chain `.start()` for a cleaner syntax:

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

Options to change the particles and their behavior aswell as what happens on `MouseMove` or `Resize` events.<br>
Play around with these values in the [Sandbox](https://khoeckman.github.io/canvasparticles-js/#sandbox).

### Options Object

The default value will be used when an option is assigned an invalid value.<br>
Your screen resolution and refresh rate will directly impact perfomance!

### Root options

| Option       | Type              | Default | Description                                                                   |
| ------------ | ----------------- | ------- | ----------------------------------------------------------------------------- |
| `background` | `string \| false` | `false` | Canvas background. Any valid CSS `background` value. Ignored if not a string. |

---

### `animation`

| Option                   | Type      | Default | Description                                          |
| ------------------------ | --------- | ------- | ---------------------------------------------------- |
| `animation.startOnEnter` | `boolean` | `true`  | Start animation when the canvas enters the viewport. |
| `animation.stopOnLeave`  | `boolean` | `true`  | Stop animation when the canvas leaves the viewport.  |

---

### `mouse`

| Option                  | Type          | Default | Description                                                                                                  |
| ----------------------- | ------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `mouse.interactionType` | `0 \| 1 \| 2` | `2`     | Mouse interaction mode.<br>`0 = NONE`, `1 = SHIFT`, `2 = MOVE`.                                              |
| `mouse.connectDistMult` | `float`       | `2/3`   | Multiplier applied to `particles.connectDistance` to compute mouse interaction distance.                     |
| `mouse.distRatio`       | `float`       | `2/3`   | Controls how strongly particles are pulled toward the mouse. Keep equal to or above `mouse.connectDistMult`. |

**Interaction types** (enum)

- `NONE (0)` – No interaction
- `SHIFT (1)` – Visual displacement only
- `MOVE (2)` – Actual particle movement

---

### `particles`

| Option                      | Type          | Default    | Description                                                                                              |
| --------------------------- | ------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `particles.generationType`  | `0 \| 1 \| 2` | `false`    | Auto-generate particles on initialization and when the canvas resizes. `0 = OFF`, `1 = NEW`, `2 = MATCH` |
| `particles.color`           | `string`      | `'black'`  | Particle and connection color. Any CSS color format.                                                     |
| `particles.ppm`             | `integer`     | `100`      | Particles per million pixels. _Heavily impacts performance_                                              |
| `particles.max`             | `integer`     | `Infinity` | Maximum number of particles allowed.                                                                     |
| `particles.maxWork`         | `integer`     | `Infinity` | Maximum total connection length per particle. Lower values stabilize performance but may flicker.        |
| `particles.connectDistance` | `integer`     | `150`      | Maximum distance for particle connections (px). _Heavily impacts performance_                            |
| `particles.relSpeed`        | `float`       | `1`        | Relative particle speed multiplier.                                                                      |
| `particles.relSize`         | `float`       | `1`        | Relative particle size multiplier.                                                                       |
| `particles.rotationSpeed`   | `float`       | `2`        | Direction change speed.                                                                                  |
| `particles.drawLines`       | `boolean`     | `true`     | Whether to draw lines between particles.                                                                 |

---

### `gravity`

Enabling gravity (`repulsive` or `pulling` > 0) performs an extra **O(n²)** gravity computations per frame.

| Option              | Type    | Default | Description                                                                            |
| ------------------- | ------- | ------- | -------------------------------------------------------------------------------------- |
| `gravity.repulsive` | `float` | `0`     | Repulsive force between particles. Strongly impacts performance.                       |
| `gravity.pulling`   | `float` | `0`     | Attractive force between particles. Requires sufficient repulsion to avoid clustering. |
| `gravity.friction`  | `float` | `0.8`   | Damping factor applied to gravitational velocity each update (`0.0 – 1.0`).            |

---

### Update options on the fly

You can update every option while an instance is animating and it works great; but some options require an extra step.

#### Using the available setter

These options are the only ones that have and require a dedicated setter to ensure proper integration:

- `background`
- `mouse.connectDistMult`
- `particles.color`

```js
const instance = new CanvasParticles(selector, options)

// Use the setters to update these specific options
instance.setBackground('red')
instance.setMouseConnectDistMult(0.8)
instance.setParticleColor('hsl(149, 100%, 50%)')
```

#### Changing the particle count

After updating the following options, the number of particles is **not automatically adjusted**:

- `particles.ppm`
- `particles.max`

```js
// Note: the backing field is called `option` not `options`!
instance.option.particles.ppm = 100
instance.option.particles.max = 300
```

The changes are only applied when one of the following methods is called:

```js
instance.newParticles() // Remove all particles and create the correct amount of new ones
instance.matchParticleCount() // Add or remove some particles to match the count
```

### Changing particle properties

After updating the following options, the particles are **not automatically updated**:

- `particles.relSize`
- `particles.relSpeed`

```js
// Note: the backing field is called `option` not `options`!
instance.option.particles.relSize = 2
instance.option.particles.relSpeed = 3
```

The changes are only applied when the following method is called:

```js
instance.updateParticles() // Updates the particle.speed and particle.size properties without regenerating any particles
```

#### Modifying object properties

**All** other options can be updated by only modifying the `option` internal field properties, with changes taking effect immediately.

> The new option values are not validated. Assigning invalid values will lead to unexpected behavior. It is therefore recommended to use the [options setter](#updating-entire-options-object).

```js
// Note: the backing field is called `option` not `options`!
instance.option.mouse.interactionType = 0
instance.option.particles.connectDist = 200
instance.option.gravity.repulsive = 1
```

#### Updating entire options object

To reinitialize all options, pass a new options object to the `options` setter.

> Existing particles their properties will not be updated automatically. [Changing particle properties](#changing-particle-properties)

```js
instance.options = { ... }
```

---

## Manually creating particles

```ts
createParticle(posX?: number, posY?: number, dir?: number, speed?: number, size?: number)
```

By default `particles.ppm` and `particles.max` are used to auto-generate random particles. This might destroy manually created particles. To fix this, set `particles.generationType` to `MANUAL (0)`.

```js
const canvas = '#my-canvas'
const options = {
  particles: {
    max: 0,
    rotationSpeed: 0,
  },
}
const instance = new CanvasParticles(canvas, options).start()

// Create a horizontal line of particles moving down
for (let x = 0; x < instance.width; x += 4) {
  instance.createParticle(x, 100, 0, 1, 5)
}

// Keep automatically generated particles and remove manually created ones
instance.newParticles({ keepAuto: true, keepManual: false })
```

---

## One Pager Example

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

    <script src="https://cdn.jsdelivr.net/npm/canvasparticles-js/dist/index.umd.js"></script>
    <script>
      const selector = '#canvas-particles'
      const options = {
        background: 'hsl(125, 42%, 35%)',
        mouse: {
          interactionType: CanvasParticles.interactionType.MOVE, // = 2
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
