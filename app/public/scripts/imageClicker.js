window.onload = (e) => {
    const elements = document.querySelectorAll('.listed-article__image')
    elements.forEach(element => {
        const data = element.getAttribute("__data") || null
        if(!data) return
        const url =  "/articles/" + data
        element.addEventListener("click", () => {
            window.location.href = url
        })
    })
}