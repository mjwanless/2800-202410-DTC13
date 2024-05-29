
document.addEventListener("DOMContentLoaded", function () {
    const counterInput = document.querySelectorAll('[data-input-counter]');
    const decrementButtons = document.getElementById('decrement-button');
    const incrementButtons = document.getElementById('increment-button');


    for (let i = 0; i < counterInput.length; i++) {
        const decrementButton = document.getElementById(`decrement-button${i}`);
        decrementButton.addEventListener('click', function () {
            let value = parseInt(counterInput[i].value);
            value = isNaN(value) ? 0 : value;

            if (value > 0) {
                counterInput[i].value = value - 1;
                if (value === 1) {
                    this.closest(".ingredient").classList.add("line-through");
                }
            }
        });

        const incrementButton = document.getElementById(`increment-button${i}`);
        incrementButton.addEventListener('click', function () {

            let value = parseInt(counterInput[i].value);
            value = isNaN(value) ? 0 : value;
            if (value === 0) {
                this.closest(".ingredient").classList.remove("line-through");
            }

            counterInput[i].value = value + 1;
        });
    }
});


