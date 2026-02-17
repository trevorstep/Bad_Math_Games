
document.querySelectorAll("[data-include]").forEach(async el => {
  const file = el.getAttribute("data-include")
  const html = await fetch(file).then(res => res.text())
  el.innerHTML = html
})
