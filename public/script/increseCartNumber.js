document
  .getElementById("add-to-cart-form")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    const formData = new FormData(this);
    const recipeId = formData.get("recipeId");
    const recipePrice = formData.get("recipePrice");

    fetch("/add_to_cart", {
      method: "POST",
      body: JSON.stringify({ recipeId, recipePrice }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          increaseCartNumber();
          console.log("Item added to cart");
        } else {
          console.log("Error:", response.status);
        }
      })
      .catch((error) => console.error("Error:", error));
  });

// Increase cart number
function increaseCartNumber() {
  cartSize++;
  if (cartSize > 9) cartSize = "9+";
  cartCounter.innerText = cartSize;
  return true;
}
