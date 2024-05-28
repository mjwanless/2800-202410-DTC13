document.addEventListener("DOMContentLoaded", function () {
  fetch("/user_orders")
    .then((response) => response.json())
    .then((orders) => {
      const orderHistory = document.getElementById("orderHistory");
      orders.forEach((order) => {
        const orderCard = document.createElement("div");
        orderCard.className = "bg-orange-50 p-4 rounded-md shadow-md";
        orderCard.innerHTML = `
                    <div class="flex items-center">
                        <img src="/orderimg.jpg" alt="Order Image" class="w-16 h-16 rounded-md mr-4">
                        <div>
                            <h2 class="text-md font-semibold text-blue-950">${
                              order.info.recipeTitle
                            }</h2>
                            <p class="text-sm text-gray-600">${new Date(
                              order.orderDate
                            ).toLocaleString()}</p>
                        </div>
                    </div>
                    <a href="/order/${
                      order.orderId
                    }" class="text-orange-500 hover:underline text-sm font-bold mt-2 block">View Details</a>
                `;
        orderHistory.appendChild(orderCard);
      });
    })
    .catch((error) => {
      console.error("Error fetching order history:", error);
    });
});
