const display = document.getElementById('display');
const expressionDisplay = document.getElementById('expression');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');
const historyToggle = document.getElementById('history-toggle');
const clearHistoryBtn = document.getElementById('clear-history');

// Audio Setup
const decimalSound = new Audio('https://www.myinstants.com/media/sounds/fahhh.mp3');
decimalSound.volume = 1.0;
let audioUnlocked = false; // Tracks if we bypassed the browser's audio block

let currentInput = '';
let previousInput = '';
let currentOperator = null;
let shouldResetInput = false;
let calculationHistory = [];

document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', async () => {
        // Unlock browser audio security on the very first click
        if (!audioUnlocked) {
            decimalSound.play().then(() => {
                decimalSound.pause();
                decimalSound.currentTime = 0;
            }).catch(e => console.log("Audio unlock pending"));
            audioUnlocked = true;
        }

        const action = button.dataset.action;
        const value = button.dataset.val;

        if (!action) {
            if (shouldResetInput) {
                currentInput = '';
                shouldResetInput = false;
            }
            if (value === '.' && currentInput.includes('.')) return;
            currentInput += value;
            updateDisplay();

        } else if (action === 'clear') {
            currentInput = '';
            previousInput = '';
            currentOperator = null;
            expressionDisplay.innerText = '';
            updateDisplay();

        } else if (action === 'delete') {
            currentInput = currentInput.toString().slice(0, -1);
            updateDisplay();

        } else if (action === 'easter-egg') {
            if (value === 'rickroll') window.open('https://youtu.be/Aq5WXmQQooo?si=ZdDL1mXw10bxuD0c', '_blank');
            if (value === 'orgchem') window.open('https://youtu.be/ZtTO8uUGy2Y?si=3VY-ssfDV-N1ztUS', '_blank');

        } else if (action === 'sqrt') {
            if (currentInput === '' && previousInput === '') return;
            currentOperator = 'sqrt';
            previousInput = '0';
            await calculate();

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
            shouldResetInput = false;
            updateDisplay();

        } else if (action === 'calculate') {
            await calculate();
            shouldResetInput = true;
        }
    });
});

function updateDisplay() {
    display.innerText = currentInput || '0';
    if (currentOperator && currentOperator !== 'sqrt') {
        expressionDisplay.innerText = `${previousInput} ${getSymbol(currentOperator)} ${currentInput}`;
    } else if (currentOperator === 'sqrt') {
        expressionDisplay.innerText = `√(${currentInput})`;
    }
}

function getSymbol(op) {
    if (op === '/') return '÷';
    if (op === '*') return '×';
    return op;
}

async function calculate() {
    if ((currentInput === '' && currentOperator !== 'sqrt') || previousInput === '' || !currentOperator) return;

    const opSymbol = getSymbol(currentOperator);
    const fullExpression = currentOperator === 'sqrt'
        ? `√(${currentInput})`
        : `${previousInput} ${opSymbol} ${currentInput}`;

    const n1 = parseFloat(previousInput);
    const n2 = parseFloat(currentInput);
    const op = currentOperator;

    try {
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ num1: n1, num2: n2, operator: op })
        });

        const data = await response.json();

        if (response.ok) {
            const resultStr = data.result.toString();

            // Audio Trigger for Decimals
            if (resultStr.includes('.')) {
                decimalSound.currentTime = 0;
                decimalSound.play().catch(e => console.log("Audio blocked:", e));
            }

            if (op !== 'sqrt') {
                playVisualization(n1, n2, op, data.result);
            }

            expressionDisplay.innerText = `${fullExpression} =`;
            currentInput = resultStr;
            updateDisplay();

            addHistoryItem(fullExpression, resultStr);

            currentOperator = null;
            previousInput = '';
        } else {
            display.innerText = data.error;
            currentInput = '';
        }
    } catch (error) {
        display.innerText = 'Error';
    }
}

// ---------------------------------------------------
// Visualization Engine
// ---------------------------------------------------
async function playVisualization(n1, n2, op, result) {
    if (!Number.isInteger(n1) || !Number.isInteger(n2) || n1 < 0 || n2 < 0 || n1 > 50 || n2 > 50) return;

    const vis = document.getElementById('visualizer');
    const container = document.getElementById('vis-blocks');
    const text = document.getElementById('vis-text');

    vis.classList.remove('hidden');
    container.innerHTML = '';
    text.innerText = `${n1} ${getSymbol(op)} ${n2} = ${result}`;

    for(let i=0; i<n1; i++) {
        let b = document.createElement('div');
        b.className = 'w-10 h-10 bg-sky-500 rounded-md m-1 shadow-lg block-item';
        container.appendChild(b);
    }

    await new Promise(r => setTimeout(r, 800));

    if (op === '+') {
        for(let i=0; i<n2; i++) {
            let b = document.createElement('div');
            b.className = 'w-10 h-10 bg-emerald-500 rounded-md m-1 scale-0 block-item shadow-lg';
            container.appendChild(b);
            setTimeout(() => b.classList.remove('scale-0'), 100 + (i * 50));
        }
    }
    else if (op === '-') {
        const blocks = document.querySelectorAll('.block-item');
        for(let i=0; i<n2 && i<blocks.length; i++) {
            let b = blocks[blocks.length - 1 - i];
            setTimeout(() => b.classList.replace('bg-sky-500', 'bg-rose-500'), i * 150);
            setTimeout(() => { b.style.transform = 'scale(0)'; b.style.opacity = '0'; }, 1000 + (i * 150));
        }
    }
    else if (op === '*') {
        container.innerHTML = '';
        for(let i=0; i<n1; i++) {
            let group = document.createElement('div');
            group.className = 'p-3 m-2 border-2 border-dashed border-sky-400 rounded-lg flex flex-wrap gap-2 opacity-0 block-item';
            for(let j=0; j<n2; j++) {
                let b = document.createElement('div');
                b.className = 'w-8 h-8 bg-purple-500 rounded shadow';
                group.appendChild(b);
            }
            container.appendChild(group);
            setTimeout(() => group.classList.remove('opacity-0'), i * 400);
        }
    }
    else if (op === '/') {
        if (n2 === 0) return;
        container.innerHTML = '';
        let groupCount = Math.floor(n1 / n2);

        for(let i=0; i<groupCount; i++) {
            let group = document.createElement('div');
            group.className = 'p-3 m-2 border-2 border-emerald-400 rounded-lg flex flex-wrap gap-2 scale-0 block-item';
            for(let j=0; j<n2; j++) {
                let b = document.createElement('div');
                b.className = 'w-8 h-8 bg-sky-500 rounded shadow';
                group.appendChild(b);
            }
            container.appendChild(group);
            setTimeout(() => group.classList.remove('scale-0'), i * 400);
        }

        if (n1 % n2 !== 0) {
            let remGroup = document.createElement('div');
            remGroup.className = 'p-3 m-2 border-2 border-rose-400 border-dashed rounded-lg flex flex-wrap gap-2 scale-0 block-item';
            for(let i=0; i<(n1%n2); i++) {
                let b = document.createElement('div');
                b.className = 'w-8 h-8 bg-slate-500 rounded shadow';
                remGroup.appendChild(b);
            }
            container.appendChild(remGroup);
            setTimeout(() => remGroup.classList.remove('scale-0'), groupCount * 400);
        }
    }

    setTimeout(() => { vis.classList.add('hidden'); }, 4500);
}

// ---------------------------------------------------
// History Drawer Logic
// ---------------------------------------------------
function addHistoryItem(expr, result) {
    calculationHistory.unshift({ expr, result });
    renderHistory();
}

function renderHistory() {
    if (calculationHistory.length === 0) {
        historyList.innerHTML = `<li class="text-zinc-500 italic px-2 py-1">No history yet</li>`;
        return;
    }
    // Added data-val attributes to securely store the result
    historyList.innerHTML = calculationHistory.map(item => `
        <li class="history-item p-2 flex justify-between items-center hover:bg-zinc-700/80 rounded cursor-pointer transition-colors" data-val="${item.result}">
            <span class="text-zinc-400 pointer-events-none">${item.expr} =</span>
            <span class="text-emerald-400 font-bold pointer-events-none">${item.result}</span>
        </li>
    `).join('');
}

// Secure Event Listener for History Clicks
historyList.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item');
    if (!item) return;

    currentInput = item.dataset.val;
    historyPanel.classList.add('hidden');
    updateDisplay();
    shouldResetInput = false;
});

historyToggle.addEventListener('click', () => historyPanel.classList.toggle('hidden'));
clearHistoryBtn.addEventListener('click', () => {
    calculationHistory = [];
    renderHistory();
});

renderHistory();