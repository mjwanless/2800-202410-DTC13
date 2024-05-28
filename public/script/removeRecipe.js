function removeRecipe(recipeId) {
  const confirmed = confirm(
    "Are you sure you want to remove this recipe from your cart?"
  );
  if (!confirmed) {
    return;
  }
  fetch(`/deleteRecipe/${recipeId}`, {
    method: "POST",
  }).then((response) => {
    if (response.ok) {
      window.location.reload();
    }
  });
}