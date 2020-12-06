window.onload = () => {
    const article = document.getElementById("articlebody")
    article.innerHTML = marked(article.innerHTML)
}