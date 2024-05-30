async function goToRecipe(id) {
  console.log(id);
  fetch(`/recipe_Info/${id}`, {
    method: "POST",
  }).then((res) => {
    window.location.href = `/recipe_Info/${id}`;
  });
}

function searchCusine(cusine) {
  window.location.href = `recipe_search_page?user_query=${cusine}`;
  console.log(cusine);
}

function comingSoonNotification() {
  alert(
    "🎉 Exciting new feature on the way! Just a bit more patience, our developers are working around the clock... ⏰😂"
  );
}