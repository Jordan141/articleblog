window.onload = () => {
    document.getElementById('articlebody').addEventListener('input', () => convertToMarkdown())
}

function convertToMarkdown() {
    const article = document.getElementById("articlebody")
    const preview = document.getElementById('preview')
    console.log(article.value)
    preview.innerHTML = marked(article.value)
}