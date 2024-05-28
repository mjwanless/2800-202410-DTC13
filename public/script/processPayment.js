function processPayment() {
  fetch("/mycart", {
    method: "POST",
  }).then((response) => {
    if (response.ok) {
      console.log("start payment");
    }
  });
}
