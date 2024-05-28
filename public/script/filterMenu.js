function openFilterMenu() {
  const filterMenu = document.getElementById("filter-menu");
  filterMenu.classList.toggle("hidden");
  filterMenu.innerHTML = "";

  const filtersCard = document.createElement("div");
  filtersCard.className =
    "flex w-fit justify-center rounded-lg bg-blue-950 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm";
  filtersCard.innerHTML = `
        <div class='flex flex-col gap-1'>
            <p>Required ingredients:</p>
            <div class='flex flex-row'>
                <input id="newRequiredInput" type='text' class='rounded-lg px-1 m-1 h-7 text-gray-700'>
                <button class="flex w-fit justify-center rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold leading-6 text-gray-700 shadow-sm hover:bg-orange-500" onclick="addIngredient('required')">Add</button>
            </div>
            <div id='requiredTags' class='flex flex-initial flex-wrap w-64'></div>

            <p>Excluded ingredients:</p>
            <div class='flex flex-row'>
                <input id="newExcludedInput" type='text' class='rounded-lg px-1 m-1 h-7 text-gray-700'>
                <button class="flex w-fit justify-center rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold leading-6 text-gray-700 shadow-sm hover:bg-orange-500" onclick="addIngredient('excluded')">Add</button>
            </div>
            <div id='excludedTags' class='flex flex-initial flex-wrap w-64'></div>
        </div>
    `;

  filterMenu.appendChild(filtersCard);
}

function addIngredient(type) {
  let textField =
    type === "required"
      ? document.getElementById("newRequiredInput")
      : document.getElementById("newExcludedInput");
  let tagText = textField.value.trim();
  textField.value = "";

  if (tagText === "") return;
  if (document.getElementById(`${tagText}-${type}`)) {
    window.alert("tag already added!");
    return;
  }

  const targetDiv =
    type === "required"
      ? document.getElementById("requiredTags")
      : document.getElementById("excludedTags");
  const tag = createTagElement(tagText, type);
  targetDiv.appendChild(tag);

  if (type === "required") {
    requiredIngredients.push(tagText);
  } else {
    excludedIngredients.push(tagText);
  }

  beginQuery();
}

function createTagElement(tagText, type) {
  const tag = document.createElement("div");
  tag.id = `${tagText}-${type}`;
  tag.className = "flex flex-nowrap";
  tag.innerHTML = `
        <p class="flex flex-nowrap m-1 p-1 w-fit bg-orange-500 text-sm text-white font-semibold rounded-lg">
            ${tagText}
            <button class='mx-1' onclick='removeFilter("${tagText}", "${type}")'>X</button>
        </p>
    `;
  return tag;
}

function removeFilter(tagText, type) {
  document.getElementById(`${tagText}-${type}`).remove();
  if (type === "required") {
    requiredIngredients.splice(requiredIngredients.indexOf(tagText), 1);
  } else {
    excludedIngredients.splice(excludedIngredients.indexOf(tagText), 1);
  }
  beginQuery();
}
