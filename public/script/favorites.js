

function favoritesToggle(id, button) {
    iconClassList = button.children[0].classList
    isFavorite = iconClassList.contains('fas')
    iconClassList.toggle('fas')
    iconClassList.toggle('far')
    url = isFavorite ? '/favorites/remove/' : '/favorites/add/'
    fetch(url + id, {method: 'POST'})
    .then(response => {
        if (response.ok) {
            console.log('Favorite toggled')
        }
    })
}
