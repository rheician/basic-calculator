const display = document.getElementById('display');
let currentInput = '';
let previousInput = '';
let currentOperator = null;

document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.action;
        const value = button.dataset.val;

        if (!action) {
            if (value === '.' && currentInput.includes('.')) return;
            currentInput += value;
            updateDisplay(currentInput);
        } else if (action === 'clear') {
            currentInput = '';
            previousInput = '';
            currentOperator = null;
            updateDisplay('0');
        } else if (action === 'operator') {
            if (currentInput === '' && previousInput === '') return;
            if (currentInput !== '' && previousInput !== '') {
                calculate();
            }
            currentOperator = value;
            if (currentInput !== '') {
                previousInput = currentInput;
                currentInput = '';
            }
        } else if (action === 'calculate') {
            calculate();
        }
    });
});

function updateDisplay(value) {
    display.innerText = value || '0';
}

async function calculate() {
    if (currentInput === '' || previousInput === '' || !currentOperator) return;

    try {
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                num1: parseFloat(previousInput),
                num2: parseFloat(currentInput),
                operator: currentOperator
            })
        });

        const data = await response.json();

        if (response.ok) {
            currentInput = data.result.toString();
            currentOperator = null;
            previousInput = '';
            updateDisplay(currentInput);
        } else {
            updateDisplay(data.error);
            currentInput = '';
        }
    } catch (error) {
        updateDisplay('Error');
        currentInput = '';
    }
}