// Redirect to the GitHub Pages URL if not running on the correct domain (ignore localhost)
const host = location.hostname
const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.localhost')

if (!isLocalhost && host !== 'khoeckman.github.io') {
  window.location.replace('https://khoeckman.github.io/canvasparticles-js/')
}
