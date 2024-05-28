function checkIfValidRecipe(recipe) {
  let hasRequired = requiredIngredients.every((requirement) =>
    recipe.ingredients.some((ingredient) =>
      ingredient.text.includes(requirement)
    )
  );

  let hasExcluded = recipe.ingredients.some((ingredient) =>
    excludedIngredients.some((exclusion) => ingredient.text.includes(exclusion))
  );

  return hasRequired && !hasExcluded;
}
