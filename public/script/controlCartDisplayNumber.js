let cartSize;
const cartCounter = document.createElement("span");
cartCounter.className =
  "w-5 p-0.5 z-10 absolute bottom-4 left-4 bg-orange-500 text-xs text-white font-semibold rounded-full";
getCartCount = async function () {
  const result = await fetch(`/getCartNumber`);
  cartSize = await result.json(result);

  if (cartSize == 0) return;
  if (cartSize > 9) cartSize = "9+";

  cartCounter.innerText = cartSize;
  document.getElementById("cart-button").append(cartCounter);
};
getCartCount();
