// https://stackoverflow.com/questions/39993676/code-inside-domcontentloaded-event-not-working
if(document.readyState !== 'loading') {
  myInitCode()
} else {
  document.addEventListener('DOMContentLoaded', myInitCode)
}

function myInitCode() {
  const LOGO_URL = '/'
  const LOGOUT_URL = '/logout'

  const listedArticles = document.querySelectorAll('.cursor-change')
  const logo = document.querySelector('.header__logo-wrapper')
  const logoutButton = document.getElementById('logout-button')
  const deleteArticleButton = document.getElementById('article-delete-button')
  const hamburger = document.getElementById('hamburger-menu')
  const articleEditBox = document.getElementById('article-edit-box')
  const uploadArticleImageButton = document.getElementById('upload-image')
  const showArticleBody = document.getElementById("article-show-read-body")

  if(typeof browserSignature !== 'undefined') {
      analyticsFingerprintSender()
    }
  if(logo) logo.addEventListener('click', () => clickHandler(LOGO_URL))
  if(listedArticles) { 
    listedArticles.forEach(listedArticle => {
          const data = listedArticle.getAttribute("__data") || null
          if(!data) return
          const url =  (window.location.pathname.includes('approve') ? "/articles/approve/": "/articles/") + data
          listedArticle.addEventListener("click", () => clickHandler(url))
      })
  }
  if(showArticleBody) showArticleBody.innerHTML = marked(showArticleBody.innerText)
  if(logoutButton) logoutButton.addEventListener('click', () => clickHandler(LOGOUT_URL))
  if(deleteArticleButton) deleteArticleButton.addEventListener('click', deleteHandler)
  if (hamburger) hamburger.addEventListener('click', openHamburgerMenu)
  if(uploadArticleImageButton) uploadArticleImageButton.addEventListener('click', uploadImage)
  if(articleEditBox) {
      articleEditBox.addEventListener('keyup', onTextChange)
      articleEditBox.addEventListener('change', onTextChange)
  }
  setTimeout(carouselInitializer, 1000)
  cacheField()
  ellipsizeTextBoxes()
  setupArticleSearch()
  installLoadMoreButton()
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

function openHamburgerMenu() {
  const hamburgerMenu = document.getElementById('header__menu')
  hamburgerMenu.classList.toggle('hidden')
  const root = document.querySelector(':root')
  root.classList.toggle('no-scroll')
  
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

function setupArticleSearch() {

  const searchPanels = [
    {
      input: document.querySelector('#article-search-input'),
      form: document.querySelector('#article-search-form'),
      icon: document.querySelector('#article-search-icon')
    },
    {
      input: document.querySelector('#article-search-input--hamburger'),
      form: document.querySelector('#article-search-form--hamburger'),
      icon: document.querySelector('#article-search-icon--hamburger')
    }
  ]

  searchPanels.forEach(({input, form, icon}) => {
    input.addEventListener('focusout', () => {
      form.classList.toggle('hidden')
      input.value = ''
    })
  
    icon.addEventListener('click', () => {
      form.classList.toggle('hidden')
      input.focus()
    })
  
    form.addEventListener('submit', event => {
      event.preventDefault()
      articleSearch(input.value, '')
    })
  })



}

function articleSearch(query, category, page = 0) {
  const searchUrl = new URL(window.location.origin)
  searchUrl.searchParams.set('query', query)
  searchUrl.searchParams.set('category', category)
  searchUrl.searchParams.set('page', page)
  window.location.href = searchUrl
}


function onTextChange(event) {
    const rawBody = event.target.value
    if(!rawBody) return
    const markdownBody = marked(rawBody)

    const previewDiv = document.getElementById('preview-div')
    if(!previewDiv) return

    previewDiv.innerHTML = markdownBody
}

function uploadImage(event) {
  event.preventDefault()
  const input = document.querySelector('input[name="image"]')
  const files = input.files
  const formData = new FormData()
  if(!files[0]) return

  formData.append('image', files[0])

  return fetch('/articles/images', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(json => {
    document.getElementById('article-edit-box').value += `![image](${json.url})`
  })
  .catch(err => console.error(err))

}

function ellipsizeTextBoxes() {
  var elements = [...document.querySelectorAll('[ellipsize]')]
  
  elements.forEach(element => {
    const wordArray = element.innerHTML.split(' ');
    while(element.scrollHeight > element.offsetHeight) {
        wordArray.pop();
        element.innerHTML = wordArray.join(' ') + '...';
    }
  })

}

function analyticsFingerprintSender() {
  const currentUrl = window.location.pathname
  const fingerprint = browserSignature()

  fetch('/analytics/fingerprint', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json'},
    cache: 'no-cache',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify({ currentUrl, fingerprint })
  })
}

function installLoadMoreButton() {
  const loadMoreLink = document.querySelector('#load-more-link')
  const targetPage = parseInt(loadMoreLink.dataset.page)
  const route = location.pathname
  const params = new URLSearchParams(location.search)
  params.set('page', targetPage)
  loadMoreLink.href = route + '?' + params.toString()
}