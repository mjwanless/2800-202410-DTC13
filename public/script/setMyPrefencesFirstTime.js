let selectedPreferences = JSON.parse(localStorage.getItem("selectedPreferences")) || [];

function selectPreference(preference) {
  const bubble = document.querySelector(
    `.preference-bubble[data-name='${preference}']`
  );
  if (selectedPreferences.includes(preference)) {
    selectedPreferences = selectedPreferences.filter((p) => p !== preference);
    bubble.classList.remove("selected");
  } else {
    selectedPreferences.push(preference);
    bubble.classList.add("selected");
  }
  localStorage.setItem(
    "selectedPreferences",
    JSON.stringify(selectedPreferences)
  );
}

function savePreferences() {
  fetch("/update_preference", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ preferences: selectedPreferences }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        alert("Preferences updated successfully");
        window.location.href = "/home";
      } else {
        alert("Error updating preferences");
      }
    });
}

function skipPreferences() {
  window.location.href = "/home";
}

function refreshPreferences() {
  localStorage.removeItem("selectedPreferences");
  window.location.reload();
}

document.addEventListener("DOMContentLoaded", function () {
  const bubbles = document.querySelectorAll(".preference-bubble");
  bubbles.forEach((bubble) => {
    const preference = bubble.getAttribute("data-name");
    if (selectedPreferences.includes(preference)) {
      bubble.classList.add("selected");
    }
  });
});
