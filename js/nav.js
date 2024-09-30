// Version
const version = document.getElementById('version')
version.innerText = CanvasParticles.version ?? '3.2.x'

// Populate sidenav
const sections = [...document.querySelectorAll('main section')]
const sidenav = document.getElementById('sidenav')
const sidenavList = sidenav.querySelector('ul')

for (let section of sections) {
  const name = section.id.replace(/[_-]+/g, ' ')
  sidenavList.innerHTML += `<li><a href="#${section.id}">${name}</a></li>`
}

// Sidenav location
const computeSectionOffsets = sections => {
  let titles = []
  let i = 0

  for (let section of sections) {
    titles.unshift({
      navButton: sidenavList.children[i],
      offsetTop: section.offsetTop - ~~(window.innerHeight * 0.25), // Select next section when its scrolled past 25% of the container
    })
    i++
  }
  return titles
}

const header = document.querySelector('header')
const title = document.querySelector('#title h1')
let sectionOffsets = computeSectionOffsets(sections)
let debounceUpdateHash

const scrollEventHandler = container => {
  // Small nav
  const scrolledPastTitle = container.scrollTop > window.innerHeight
  const op = scrolledPastTitle ? 'add' : 'remove'
  header.classList[op]('small')

  // Update active sidenav link and url hash
  for (let section of sectionOffsets) {
    if (section.offsetTop <= container.scrollTop) {
      sidenav.querySelector('.active')?.removeAttribute('class')
      section.navButton.classList.add('active')

      clearTimeout(debounceUpdateHash)
      debounceUpdateHash = setTimeout(() => history?.pushState(null, null, section.navButton.children[0].hash), 500)
      break
    }
  }

  // Title effect
  title.style.opacity = 1 - (2 * container.scrollTop) / window.innerHeight
  title.style.transform = 'translateX(' + (-100 * container.scrollTop) / window.innerHeight + 'px)'
}
document.addEventListener('scroll', () => scrollEventHandler(document.documentElement))
scrollEventHandler(document.documentElement)
