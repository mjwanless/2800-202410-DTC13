/* jshint esversion: 8 */

/*
* Hash function to hash recipe price
* getPrice function is generated by ChatGPT OpenAI and Fresh Plate team studied
* it and modified it to fit the project
*/
function getPrice(recipeId, minVal = 10, maxVal = 30) {
  let hash = 0;
  for (let i = 0; i < recipeId.length; i++) {
    let char = recipeId.charCodeAt(i);
    hash = (hash << 5) - hash + char; // Multiply by 31 and add the char code
    hash |= 0; // Make sure it's a 32-bit integer
  }

  // Convert hash to a positive value
  let decimalValue = Math.abs(hash);

  // Map the decimal value to the desired range
  let mappedValue = (decimalValue % ((maxVal - minVal) * 100)) / 100 + minVal;

  // Ensure it has exactly two decimal places
  let finalValue = Math.round(mappedValue * 100) / 100;

  return finalValue;
}
module.exports = getPrice;