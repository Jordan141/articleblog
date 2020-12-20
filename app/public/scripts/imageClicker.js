window.onload = (e) => {
    const elements = document.querySelectorAll('.cursor-change')
    elements.forEach(element => {
        const data = element.getAttribute("__data") || null
        console.log(data)
        if(!data) return
        const url =  "/articles/" + data
        element.addEventListener("click", () => {
            window.location.href = url
        })
    })
}