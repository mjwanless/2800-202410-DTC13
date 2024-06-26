function decreaseQuantity(product_id, price) {
    
    decreaseBtn = document.getElementById("text_" + product_id)
    if (decreaseBtn.innerText == 1) return
    decreaseBtn.innerText--
    
    cartSize--;
    if (cartSize == 0) return;
    cartCounter.innerText = cartSize;
    
    let priceElem = document.getElementById("price_" + product_id);
    let priceValue = parseFloat(priceElem.innerText.substring(1));
    priceElem.innerText = "$" + (priceValue - parseFloat(price)).toFixed(2);
    

    fetch('/quantity/decrease/' + product_id, {
        method: 'POST',
    }).then(response => {
        if (response.ok) {
            console.log('Quantity reduced');
        }
    }
    )

}
function increaseQuantity(product_id, price) {
    cartSize++;
    if (cartSize > 9) cartSize = "9+";
    cartCounter.innerText = cartSize;

    increaseBtn = document.getElementById("text_" + product_id)
    increaseBtn.innerText++

    let priceElem = document.getElementById("price_" + product_id);
    let priceValue = parseFloat(priceElem.innerText.substring(1));
    priceElem.innerText = "$" + (priceValue + parseFloat(price)).toFixed(2);
    fetch('/quantity/increase/'+product_id, {
        method: 'POST',
    }).then(response => {
        if (response.ok) {
            console.log('Quantity added');
        }
    }
)
}