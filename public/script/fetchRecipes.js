async function getRecipes(query) {
  const url = `/get_search_query/${query}`;
  const response = await fetch(url);
  const data = await response.json();

  updateRecipeList(data.hits);
}

function updateRecipeList(hits) {
  const recipeList = document.getElementById("recipe-list");
  recipeList.innerHTML = "";

  hits.forEach((result) => {
    let recipe = result.recipe;
    if (checkIfValidRecipe(recipe)) {
      createRecipeCard(recipe);
    }
  });

  if (hits.length === 0) {
    displayNoRecipesFound(recipeList);
  }
}

function displayNoRecipesFound(recipeList) {
  const errorMessage = document.createElement("div");
  errorMessage.className = "flex justify-center p-1";
  errorMessage.innerHTML = `
        <div class="flex w-11/12 justify-center text-center bg-sky-100 p-3">
            <div class="flex flex-col content-center">
                <p>No recipes found!</p>
            </div>
        </div>
    `;
  recipeList.appendChild(errorMessage);
}
