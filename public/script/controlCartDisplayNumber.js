getCartCount = async function () {
  const result = await fetch(`/get_cart_number`);
  cartSize = await result.json(result);

  if (cartSize == 0) return;
  if (cartSize > 9) cartSize = "9+";

  cartCounter.innerText = cartSize;
  document.getElementById("cart-button").append(cartCounter);
};
getCartCount();
