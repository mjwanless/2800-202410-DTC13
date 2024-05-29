const toggleCalculator = document.getElementById("calorimeter");
const calculator = document.getElementById("calculator");

toggleCalculator.addEventListener("click", () => {
  if (calculator.style.display === "none") {
    calculator.style.display = "flex";
  } else {
    calculator.style.display = "none";
  }
});
