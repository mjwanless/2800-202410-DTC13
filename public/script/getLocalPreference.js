let preferences = [];
let selectedPreferences = [];

document.addEventListener("DOMContentLoaded", () => {
  // Initialize preferences from server-rendered data
  const prefElements = document.querySelectorAll(".preference-bubble");
  prefElements.forEach((element) => {
    preferences.push(element.getAttribute("data-name").trim());
    element.addEventListener("click", () => toggleSelection(element));
  });
});

function addPreference() {
  const input = document.getElementById("preferenceInput");
  const value = input.value.trim();
  const validPreference = /^[a-zA-Z0-9\s]+$/.test(value);

  if (value && validPreference && !preferences.includes(value)) {
    if (confirm(`Are you sure you want to add the preference "${value}"?`)) {
      preferences.push(value);
      updatePreferenceList();
      input.value = "";
      savePreferences();
    }
  } else {
    alert(
      "Please enter a valid preference (no special characters or empty input)."
    );
  }
}

function toggleSelection(element) {
  const preference = element.getAttribute("data-name");
  if (selectedPreferences.includes(preference)) {
    selectedPreferences = selectedPreferences.filter((p) => p !== preference);
    element.classList.remove("selected");
  } else {
    selectedPreferences.push(preference);
    element.classList.add("selected");
  }
}

function deleteSelectedPreferences() {
  if (confirm(`Are you sure you want to delete the selected preferences?`)) {
    preferences = preferences.filter((p) => !selectedPreferences.includes(p));
    selectedPreferences = [];
    updatePreferenceList();
    savePreferences();
  }
}

function updatePreferenceList() {
  const list = document.getElementById("preferenceList");
  list.innerHTML = "";
  preferences.forEach((pref) => {
    const chip = document.createElement("div");
    chip.className =
      "relative bg-indigo-50 text-blue-950 px-3 py-1 rounded-full preference-bubble";
    chip.dataset.name = pref;
    chip.textContent = pref;
    chip.addEventListener("click", () => toggleSelection(chip));
    list.appendChild(chip);
  });
}

function savePreferences() {
  axios
    .post("/save_preferences", { preferences })
    .then((response) => {
      console.log("Preferences saved successfully.");
    })
    .catch((error) => {
      console.error("Error saving preferences:", error);
    });
}