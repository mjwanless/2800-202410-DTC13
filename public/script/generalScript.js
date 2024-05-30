async function goToRecipe(id) {
  console.log(id);
  fetch(`/recipe_Info/${id}`, {
    method: "POST",
  }).then((res) => {
    window.location.href = `/recipe_Info/${id}`;
  });
}

function comingSoonNotification() {
  alert("This feature is coming soon!");
}
