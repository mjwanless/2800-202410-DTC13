

function favoritesToggleInfoPage() {
    iconClassList = document.querySelector('.fa-heart').classList
    isFavorite = iconClassList.contains('fas')
    iconClassList.toggle('fas')
    iconClassList.toggle('far')
    url = window.location.pathname
    segment = url.split('/')
    console.log("sfsdf")
    id = segment[segment.length - 1]
    requestURL = isFavorite ? '/favorites/remove/' : '/favorites/add/'
    fetch(requestURL + id, {method: 'POST'})
    .then(response => {
        if (response.ok) {
            console.log('Favorite toggled')
        }
    })
    
}

function favoritesToggle(id) {
    iconClassList = document.getElementById(`fav_${id}`).classList
    console.log(iconClassList)
    isFavorite = iconClassList.contains('fas')
    iconClassList.toggle('fas')
    iconClassList.toggle('far')
    requestURL = isFavorite ? '/favorites/remove/' : '/favorites/add/'
    fetch(requestURL + id, {method: 'POST'})
    .then(response => {
        if (response.ok) {
            console.log('Favorite toggled')
        }
    })
}