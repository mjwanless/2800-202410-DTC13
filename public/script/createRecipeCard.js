function createRecipeCard(recipe) {
  const recipeCard = document.createElement("a");
  recipeCard.className = "flex justify-center p-1 rounded-md";
  recipeCard.href = `/recipeInfo/${recipe.uri.split("#recipe_")[1]}`;

  const tagList = generateTagList(recipe);
  recipeCard.innerHTML = `
        <div class="flex w-11/12 justify-center text-center bg-indigo-50 p-3 rounded-md">
            <div class="w-1/3 flex flex-col content-center">
                <div>
                    <img class="" src=${recipe.image}>
                </div>
            </div>
            <div class="flex flex-col justify-center p-1 w-2/3">
                <p class="font-bold text-blue-950 text-left ml-2">${recipe.label}</p>
                <div class='flex flex-wrap text-center'>${tagList}</div>
            </div>
        </div>
    `;

  document.getElementById("recipe-list").appendChild(recipeCard);
}

function generateTagList(recipe) {
  let tagList = "";
  const tagLimit = 12;
  const lettersPerColumn = 4;
  const columnsPerRow = 6;
  let tagCount = 0;
  let currentColumnsInRow = 0;

  function addTag(tagText) {
    if (tagCount >= tagLimit) return;

    let columnWidth = Math.ceil(tagText.length / lettersPerColumn);
    if (tagCount + columnWidth > tagLimit) {
      tagText = "...";
      columnWidth = 1;
    }

    tagCount += columnWidth;
    currentColumnsInRow += columnWidth;
    if (currentColumnsInRow >= columnsPerRow) {
      tagCount += currentColumnsInRow - columnsPerRow;
      currentColumnsInRow = 0;
    }

    tagList += `
            <p class="m-1 py-1 px-2 col bg-orange-500 text-sm text-white font-semibold rounded-md">${tagText}</p>
        `;
  }

  addTag(recipe.cuisineType[0]);
  recipe.mealType.forEach((tag) => addTag(tag));
  recipe.dishType.forEach((tag) => addTag(tag));

  return tagList;
}
