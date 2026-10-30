const display = document.getElementById('display');
const expressionDisplay = document.getElementById('expression');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');
const historyToggle = document.getElementById('history-toggle');
const clearHistoryBtn = document.getElementById('clear-history');

let currentInput = '';
let previousInput = '';
let currentOperator = null;
let shouldResetInput = false;
let calculationHistory = [];

// Handle Button Clicks
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', async () => {
        const action = button.dataset.action;
        const value = button.dataset.val;

        if (!action) {
            if (shouldResetInput) {
                currentInput = '';
                shouldResetInput = false;
            }
            if (value === '.' && currentInput.includes('.')) return;
            currentInput += value;
            updateDisplay(currentInput);
        } else if (action === 'clear') {
            currentInput = '';
            previousInput = '';
            currentOperator = null;
            expressionDisplay.innerText = '';
            updateDisplay('0');
        } else if (action === 'operator') {
            if (currentInput === '' && previousInput === '') return;

            if (currentInput !== '' && previousInput !== '') {
                await calculate();
            }

            currentOperator = value;
            if (currentInput !== '') {
                previousInput = currentInput;
                currentInput = '';
            }
            expressionDisplay.innerText = `${previousInput} ${getSymbol(currentOperator)}`;
            shouldResetInput = false;
        } else if (action === 'calculate') {
            await calculate();
            shouldResetInput = true;
        }
    });
});

function updateDisplay(value) {
    display.innerText = value || '0';
}

function getSymbol(op) {
    if (op === '/') return '÷';
    if (op === '*') return '×';
    return op;
}

async function calculate() {
    if (currentInput === '' || previousInput === '' || !currentOperator) return;

    const opSymbol = getSymbol(currentOperator);
    const fullExpression = `${previousInput} ${opSymbol} ${currentInput}`;

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
            const resultStr = data.result.toString();

            // 1. Show the full expression on the top LCD line
            expressionDisplay.innerText = `${fullExpression} =`;

            // 2. Display the result on the main LCD line
            currentInput = resultStr;
            updateDisplay(currentInput);

            // 3. Save to History
            addHistoryItem(fullExpression, resultStr);

            currentOperator = null;
            previousInput = '';
        } else {
            updateDisplay(data.error);
            currentInput = '';
        }
    } catch (error) {
        updateDisplay('Error');
        currentInput = '';
    }
}

// History Management
function addHistoryItem(expr, result) {
    calculationHistory.unshift({ expr, result });
    renderHistory();
}

function renderHistory() {
    if (calculationHistory.length === 0) {
        historyList.innerHTML = `<li class="text-zinc-500 italic">No history yet</li>`;
        return;
    }

    historyList.innerHTML = calculationHistory.map(item => `
        <li class="pt-1 flex justify-between items-center hover:bg-zinc-700/40 p-1 rounded cursor-pointer" onclick="useHistoryResult('${item.result}')">
            <span class="text-zinc-400">${item.expr} =</span>
            <span class="text-emerald-400 font-bold">${item.result}</span>
        </li>
    `).join('');
}

// Click past history item to reuse its result
window.useHistoryResult = function(val) {
    currentInput = val;
    updateDisplay(currentInput);
    shouldResetInput = false;
};

// History Drawer Toggles
historyToggle.addEventListener('click', () => {
    historyPanel.classList.toggle('hidden');
});

clearHistoryBtn.addEventListener('click', () => {
    calculationHistory = [];
    renderHistory();
});