
async function getSecurityQuestion() {
  let email = document.getElementById("email").value;

  const result = await fetch(`/getSecurityQuestion/${email}`);
  let value = await result.json(result);

  // This is not a good approach, but it probably isn't worth it to reset all current acounts
  // just to store the actual question
  let securityQuestion = null;
  if (value == "Favourite food")
    securityQuestion = "What is your favourite food?";
  else if (value == "First pet")
    securityQuestion = "What was the name of your first pet?";
  else if (value == "Mother maiden name")
    securityQuestion = "What is your mother's maiden name ?";

  if (securityQuestion) {
    document.getElementById("emailErrorDiv").classList.add("hidden");
    document.getElementById("email-div").classList = "hidden";
    document.getElementById("continue_button").classList = "hidden";
    document.getElementById("second_half").classList = "";

    document.getElementById("security_question").innerText = securityQuestion;
  } else {
    document.getElementById("email").value = "";

    errorMessage = document.getElementById("emailErrorDiv");
    errorMessage.classList.remove("hidden");
    errorMessage.classList.remove("fadeOut");
    await setTimeout(() => {
      errorMessage.classList.add("fadeOut");
    }, 3000);
  }
}
