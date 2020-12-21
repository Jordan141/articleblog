window.onload = () => {
    const LOGO_URL = '/'
    const LOGOUT_URL = '/logout'

    const elements = document.querySelectorAll('.cursor-change')
    const logo = document.querySelector('.header__logo-wrapper')
    const logoutButton = document.getElementById('logout-button')
    const deleteArticleButton = document.getElementById('article-delete-button')
    const hamburger = document.getElementById('hamburger-menu')

    if(logo) logo.addEventListener('click', () => clickHandler(LOGO_URL))
    if(elements) { 
            elements.forEach(element => {
            const data = element.getAttribute("__data") || null
            if(!data) return
            const url =  "/articles/" + data
            element.addEventListener("click", () => clickHandler(url))
        })
    }
    if(logoutButton) logoutButton.addEventListener('click', () => clickHandler(LOGOUT_URL))
    if(deleteArticleButton) deleteArticleButton.addEventListener('click', deleteHandler)
    if (hamburger) hamburger.addEventListener('click', openHamburgerMenu)
    setTimeout(carouselInitializer, 1000)
    cacheField()
}

function carouselInitializer() {
   // Glide init, this should be in PROD
   const carousels = document.querySelectorAll('.glide') || [];
   Object.values(carousels).forEach((carousel) => {
     new Glide(carousel, {
       type: 'carousel',
       startAt: 0,
       perView: 3,
       breakpoints: {
         1023: {
           perView: 1
         },
         800: {
           perView: 1
         }
       }
     }).mount()
   })
}
function clickHandler(url) {
    window.location.href = url
}

function deleteHandler(event) {
  event.preventDefault()
  const deleteURL = '/articles/' + event.target.getAttribute('__article-id') + '?_method=DELETE'
  fetch(deleteURL, {method: 'POST'}).then(res => { window.location.href="/"}).catch(console.log)
}

function convertToMarkdown() {
    const article = document.getElementById("articlebody")
    const preview = document.getElementById('preview')
    preview.innerHTML = marked(article.textContent)
}

function openHamburgerMenu() {
  const hamburgerMenu = document.getElementById('header__menu')
  hamburgerMenu.classList.toggle('hidden')
}

function cacheField() {
  const inputsToCache = document.querySelectorAll('[cache-content]')
  inputsToCache.forEach(element => {
    const propertyKey = 'value'
    const cacheKey = element.attributes['cache-content'].value
    const lastValue = localStorage.getItem(cacheKey)
    element[propertyKey] = lastValue
    setupSavingToCacheListener(element, cacheKey, propertyKey)
  })
}

function setupSavingToCacheListener(element, cacheKey, propertyKey) {
  element.addEventListener('input', () => {
    localStorage.setItem(cacheKey, element[propertyKey])
  })
}

//FOR LATER
function articleSearch() { /* ... */ }