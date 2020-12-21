window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[js-format-date]').forEach(element => {
    const date = moment(parseInt(element.innerText))
    const dateToDisplay = mapDateToDisplay(date)
    element.innerText = dateToDisplay
  })

  function mapDateToDisplay(date) {
    if (isToday(date)) return date.format('[Today] hh:mm')
    if (isYesterday(date)) return date.format('[Yesterday] hh:mm')
    return date.local().format('DD MMMM YYYY')
  }

  function isToday(momentDate) {
    const reference = moment(); 
    const today = reference.clone().startOf('day');
      return momentDate.isSame(today, 'd');
  }
  function isYesterday(momentDate) {
    const reference = moment(); 
    const yesterday = reference.clone().subtract(1, 'days').startOf('day');
      return momentDate.isSame(yesterday, 'd');
  }
})

