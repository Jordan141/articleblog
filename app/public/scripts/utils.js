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
  const articleForm = document.getElementById('article-form')
  const editUserForm = document.getElementById('edit-user-form')
  const deleteUserButton = document.getElementById('edit-profile__delete-account')

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
  if(deleteArticleButton) deleteArticleButton.addEventListener('click', deleteArticleHandler)
  if (hamburger) hamburger.addEventListener('click', openHamburgerMenu)
  if(uploadArticleImageButton) uploadArticleImageButton.addEventListener('click', uploadImage)
  if(articleForm) articleForm.addEventListener('submit', onSubmitListener)
  if(editUserForm) editUserForm.addEventListener('submit', editUserListener)
  if(articleEditBox) {
      articleEditBox.addEventListener('keyup', onTextChange)
      articleEditBox.addEventListener('change', onTextChange)
  }
  if(deleteUserButton) deleteUserButton.addEventListener('click', deleteUsereHandler)
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

async function confirmAction({ phraseToRetype }) {
  const confirmButton = document.getElementById('confirmation-modal__proceed')
  const cancelButton = document.getElementById('confirmation-modal__cancel')
  toggleConfirmationModal()
  if (!phraseToRetype) {
    return new Promise((resolve, reject) => {
      confirmButton.onclick = () => {
        toggleConfirmationModal()
        resolve()
      }
      cancelButton.onclick = () => {
        toggleConfirmationModal()
        reject()
      }
    })
  }
  const passphraseElement = document.getElementById('confirmation-modal__passphrase')
  passphraseElement.innerText = phraseToRetype
  const passphraseRetypeInfo = document.getElementById('confirmation-modal__phrase-retype-info')
  const passphraseInput = document.getElementById('confirmation-modal__passphrase-input')
  passphraseRetypeInfo.classList.remove('hidden')
  passphraseInput.classList.remove('hidden')

  return new Promise((resolve, reject) => {
    confirmButton.onclick = () => {
      if (passphraseInput.value !== phraseToRetype) return
      toggleConfirmationModal()
      passphraseRetypeInfo.classList.add('hidden')
      passphraseInput.classList.add('hidden')
      resolve()
    }
    cancelButton.onclick = () => {
      toggleConfirmationModal()
      passphraseRetypeInfo.classList.add('hidden')
      passphraseInput.classList.add('hidden')
      reject()
    }
  })
}
function toggleConfirmationModal() {
  const modalOverlay = document.getElementById('confirmation-modal__overlay')
  const confimrationModal = document.getElementById('confirmation-modal')
  modalOverlay.classList.toggle('hidden')
  confimrationModal.classList.toggle('hidden')
}

async function deleteArticleHandler(event) {
  event.preventDefault()

  try {
    await confirmAction()
  } catch (err) {
    return
  }
  const deleteURL = '/articles/' + event.target.getAttribute('__article-id') + '?_method=DELETE'
  fetch(deleteURL, {method: 'POST'}).then(res => { window.location.href="/"}).catch(console.log)
}



async function deleteUsereHandler(event) {
  if (!event.target.attributes['data-username']) console.error('Attribute data-username is required on delete user button')
  const username = event.target.attributes['data-username'].value
  event.preventDefault()

  try {
    await confirmAction({ phraseToRetype: username })
  } catch (err) {
    return
  }
  const deleteURL = '/user/delete'
  fetch(deleteURL, {method: 'DELETE'}).then(res => { window.location.href="/"}).catch(console.log)
}

async function openHamburgerMenu() {
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
    if (cacheKey === '' || !cacheKey) return
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
  if(query) searchUrl.searchParams.set('query', query)
  if(category) searchUrl.searchParams.set('category', category)
  if(page) searchUrl.searchParams.set('page', page)
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
  if(!loadMoreLink) return //console error fix
  const targetPage = parseInt(loadMoreLink.dataset.page)
  const route = location.pathname
  const params = new URLSearchParams(location.search)
  params.set('page', targetPage)
  loadMoreLink.href = route + '?' + params.toString()
}

function onSubmitListener() {
  const allInputs = document.getElementsByTagName('input')
  for(let input of allInputs) {
    if(input.name && !input.value) {
      input.name = ''
    }
  }
}

function editUserListener() {
    onSubmitListener()
    const allTextareas = document.getElementsByTagName('textarea')
    for(let input of allTextareas) {
      if(input.name && !input.value) {
        input.name = ''
      }
    }
}