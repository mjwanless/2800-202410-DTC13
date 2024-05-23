
    document.addEventListener("DOMContentLoaded", function() {
        const counterInput = document.querySelectorAll('[data-input-counter]');
    const decrementButtons = document.querySelectorAll('#decrement-button');
    const incrementButtons = document.getElementById('increment-button');


    for(let i = 0; i < counterInput.length; i++) {
        const decrementButton = document.getElementById(`decrement-button${i}`);
        decrementButton.addEventListener('click', function () {
            let value = parseInt(counterInput[i].value);
            value = isNaN(value) ? 0 : value;
            counterInput[i].value = value > 0 ? value - 1 : 0;
        });

        const incrementButton = document.getElementById(`increment-button${i}`);
        incrementButton.addEventListener('click', function() {
            let value = parseInt(counterInput[i].value);
            value = isNaN(value) ? 0 : value;
            counterInput[i].value = value + 1;
        });
    }
    });
