window.onload = () => {
    const logo = document.querySelector('.header__logo-wrapper')
    logo.addEventListener('click', () => {
        window.location.href = '/'
    })
}