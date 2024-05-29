function getResults() {
  const query = document.getElementById("query").value;
  if (query === "" || !query) {
    alert("Please enter a valid query");
    return;
  }
  fetch("/calculate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(" Calories burned: ", data);
      // TODO - Display the result
      const modal = document.getElementById("calori-modal");
      const calories = document.getElementById("calories");
      modal.style.display = "block";
      calories.innerText = `${data.result} kcal`;
    })
    .catch((err) => {
      console.error(err);
    });
}

// Close the modal
const close = document.getElementById("close");
close.addEventListener("click", () => {
  const modal = document.getElementById("calori-modal");
  modal.style.display = "none";
});
