document.addEventListener("DOMContentLoaded", beginQuery);

function beginQuery() {
  let params = new URL(window.location.href);
  let query = params.searchParams.get("user_query");
  document.getElementById("search-dropdown").value = query;
  getRecipes(query);
}
