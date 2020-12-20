window.onload = (e) => {
    const logo = document.querySelector('.header__logo')
    console.log(logo)
    logo.addEventListener('click', () => {
        window.location.href = '/'
    })
}