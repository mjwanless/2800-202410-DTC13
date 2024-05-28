async function goToRecipe(id) {
    console.log(id);
    fetch(`/recipeInfo/${id}`, {
        method: "POST",
    }).then((res) => {
        window.location.href = `/recipeInfo/${id}`;
    });
}

function comingSoonNotification() {
    alert("This feature is coming soon!");
}