// Version
document.getElementById('version').innerText = CanvasParticles.version ?? 'unknown'

// Populate sidenav
const sections = [...document.querySelectorAll('main section')]
const sidenav = document.getElementById('sidenav')
const sidenavList = sidenav.querySelector('ul')

for (let section of sections) {
  const name = section.id.replace(/[_-]+/g, ' ')
  sidenavList.innerHTML += `<li><a href="#${section.id}">${name}</a></li>`
}
sidenavList.innerHTML += `
<li id="scroll-to-top" hidden>
  <a href="#${sections[0].id}" aria-label="Top">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 407.437 407.437">
      <g xmlns="http://www.w3.org/2000/svg" transform="matrix(-1 0 0 -1 407.437 407.437)">
        <polygon
          points="386.258,91.567 203.718,273.512 21.179,91.567 0,112.815 203.718,315.87 407.437,112.815 " />
      </g>
    </svg>
  </a>
</li>`

// Section offsets
let sectionOffsets

const computeSectionOffsets = () => {
  let titles = []
  let i = 0

  for (let section of sections) {
    titles.unshift({
      navButton: sidenavList.children[i],
      offsetTop: section.offsetTop - ~~(window.innerHeight * 0.25), // Select next section when its scrolled past 25% of the container
    })
    i++
  }
  sectionOffsets = titles
}

window.addEventListener('resize', computeSectionOffsets)
computeSectionOffsets()

// Sidenav on scroll

const header = document.querySelector('header')
const scrollToTop = document.getElementById('scroll-to-top')
const title = document.querySelector('#title h1')
const subtitle = document.querySelector('#title h2')
let debounceUpdateHash

const scrollEventHandler = container => {
  // Small nav
  const scrolledPastTitle = container.scrollTop >= window.innerHeight - 128 /* Large header height */
  const op = scrolledPastTitle ? 'add' : 'remove'
  header.classList[op]('small')

  // Update active sidenav link and url hash
  for (let section of sectionOffsets) {
    if (section.offsetTop <= container.scrollTop) {
      sidenav.querySelector('.active')?.removeAttribute('class')
      section.navButton.classList.add('active')

      clearTimeout(debounceUpdateHash)
      debounceUpdateHash = setTimeout(() => history?.replaceState(null, '', section.navButton.children[0].hash), 500)
      break
    }
  }

  // Scroll to top link
  scrollToTop.hidden = !scrolledPastTitle

  // Title effect on scroll
  title.querySelector('h1 .text-gradient').style.opacity = 1 - (2 * container.scrollTop) / window.innerHeight
  title.querySelector('h1 .invert').style.opacity = 1 - (2 * container.scrollTop) / window.innerHeight
  title.style.transform = 'translateX(' + (-100 * container.scrollTop) / window.innerHeight + 'px)'

  subtitle.style.opacity = 1 - (2 * (container.scrollTop - 187)) / window.innerHeight
  subtitle.style.transform = 'translateX(' + (100 * container.scrollTop) / window.innerHeight + 'px)'
}
document.addEventListener('scroll', () => scrollEventHandler(document.documentElement))
scrollEventHandler(document.documentElement)
