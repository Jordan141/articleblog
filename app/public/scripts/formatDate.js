window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[js-format-date]').forEach(element => {
    const dateObject = Date.parse(element.innerText)
    console.log(dateObject)
    element.innerText = dateObject.toLocaleString('en-GB', { timeZone: 'UTC' })
  })
})