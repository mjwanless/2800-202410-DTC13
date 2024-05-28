// get the amount and hide it in the form
function addHiddenInput() {
  if (confirm("Are you sure you want to proceed with the payment?")) {
    const form = document.getElementById("payment-form");
    const amount = document.getElementById("total-amount").innerText;
    const hiddenInput = document.createElement("input");
    hiddenInput.setAttribute("type", "hidden");
    hiddenInput.setAttribute("name", "amount");
    hiddenInput.value = amount;
    form.appendChild(hiddenInput);
    return true;
  } else {
    return false;
  }
}
