window.onload = () => {
    const LOGO_URL = '/'
    const LOGOUT_URL = '/logout'
    const elements = document.querySelectorAll('.cursor-change')
    const logo = document.querySelector('.header__logo-wrapper')
    const logoutButton = document.getElementById('logout-button')

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
    setTimeout(carouselInitializer, 1000)
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

function convertToMarkdown() {
    const article = document.getElementById("articlebody")
    const preview = document.getElementById('preview')
    preview.innerHTML = marked(article.textContent)
}

//FOR LATER
function articleSearch() { /* ... */ }