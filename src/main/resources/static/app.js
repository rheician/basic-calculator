const display = document.getElementById('display');
const expressionDisplay = document.getElementById('expression');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');
const historyToggle = document.getElementById('history-toggle');
const clearHistoryBtn = document.getElementById('clear-history');
const closeHistoryBtn = document.getElementById('close-history');
const rickrollVid = document.getElementById('rickroll-vid');

const decimalSound = new Audio('https://www.myinstants.com/media/sounds/fahhh.mp3');
decimalSound.volume = 1.0;
let audioUnlocked = false;

const platinumWords = {
    '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
    '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine'
};

function playSpokenNumber(num) {
    if (!('speechSynthesis' in window)) return;
    const word = platinumWords[num];
    if (!word) return;

    if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    }

    const utter = new SpeechSynthesisUtterance(word);
    utter.rate = 1.7;
    utter.pitch = 1.25;
    utter.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v =>
        v.lang && v.lang.startsWith('en') &&
        (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google US English'))
    );
    if (voice) utter.voice = voice;

    window.speechSynthesis.speak(utter);
}

function getKaraokeRemarks(scoreNum) {
    if (scoreNum < 50) return { speech: `${scoreNum} points! Practice more!`, label: "PRACTICE PA MORE!", color: "text-rose-500", sub: "MASAKIT SA TENGA!" };
    if (scoreNum < 80) return { speech: `${scoreNum} points! Good try!`, label: "PWEDE NA! NOT BAD!", color: "text-amber-400", sub: "TRY AGAIN NEXT TIME!" };
    if (scoreNum < 100) return { speech: `${scoreNum} points! You're a great singer!`, label: "YOU'RE A GREAT SINGER!", color: "text-sky-400", sub: "GALING KUMANTA!" };
    return { speech: `${scoreNum} points! Perfect score! You're a superstar!`, label: "PERFECT! YOU'RE A SUPERSTAR!", color: "text-yellow-400", sub: "IDOL! PANG CONCERT ANG BOSES!" };
}

function playKaraokeApplauseCheer(scoreStr) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const numericScore = parseFloat(scoreStr) || 0;
    const remark = getKaraokeRemarks(numericScore);

    const utter = new SpeechSynthesisUtterance(remark.speech);
    utter.rate = 1.05;
    utter.pitch = 1.3;
    utter.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v =>
        v.lang && v.lang.startsWith('en') &&
        (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha'))
    );
    if (voice) utter.voice = voice;

    window.speechSynthesis.speak(utter);
}

if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

document.addEventListener('click', (e) => {
    if (!rickrollVid.classList.contains('hidden')) {
        if (e.target !== rickrollVid && !e.target.closest('[data-val="rickroll"]')) {
            rickrollVid.pause();
            rickrollVid.classList.add('hidden');
        }
    }
});

let currentInput = '';
let expressionChain = '';
let shouldResetInput = false;
let calculationHistory = [];

const karaokeSongs = [
    { title: "Miss Flawless", artist: "Grin Department", lyrics: ["Miss Flawless, kay ganda mong dalaga...", "Lahat ng lalaki sa'yo ay napapanganga!"] },
    { title: "Otso-Otso", artist: "Bayani Agbayani", lyrics: ["Itaas ang kamay, igalaw ang baywang...", "Mag-otso-otso tayo hanggang umaga!"] },
    { title: "Pamela One", artist: "Vhong Navarro", lyrics: ["Pamela-mela one, Pamela-mela two...", "Pamela-mela three, sumayaw ka ng boogie!"] },
    { title: "Totoy Bibo", artist: "Vhong Navarro", lyrics: ["Ako si Totoy Bibo, sumasayaw ng todo...", "Bata't matanda napapaindak sa kanta!"] },
    { title: "The Spaghetti Song", artist: "SexBomb Girls ft. Joey de Leon", lyrics: ["Spaghetti pababa, pababa nang pababa...", "Spaghetti pataas, pataas nang pataas!"] },
    { title: "Jumbo Hotdog", artist: "Masculados", lyrics: ["Jumbo hotdog, kaya mo ba 'to?...", "Kaya mo ba 'tong ubusin nang buo?"] },
    { title: "Boom Tarat Tarat", artist: "Willie Revillame", lyrics: ["Boom tarat tarat, boom tarat tarat...", "Tararat tararat, boom boom boom!"] },
    { title: "Sasakyan Kita", artist: "Gladys and the Boxers with K", lyrics: ["Sasakyan kita kahit saan magpunta...", "Basta ikaw ang driver, libre ang gasolina!"] },
    { title: "Letter to Angelina", artist: "Giniling Festival", lyrics: ["Angelina, pakinggan mo aking pagsinta...", "Kahit mukhang ketchup ang aking mga luha!"] },
    { title: "Manok Na Pula", artist: "Vic Desucatan", lyrics: ["Ang manok na pula, naipusta ang pera...", "Uwi sa bahay sermon ang napala!"] },
    { title: "Neneng B", artist: "Nik Makino", lyrics: ["Gusto ko lang naman makatabi si Neneng B...", "Sumasayaw sa tugtugan buong gabi!"] },
    { title: "Pauwi Nako", artist: "PDL, Flow G, Bosx1ne, Skusta Clee, Yuri Dope", lyrics: ["Pauwi na 'ko baby, sabik na sa'yo...", "Kahit trapik pa yan, dadating ako!"] },
    { title: "Amakabogera", artist: "Maymay Entrata", lyrics: ["Di pakakabog, laging standout...", "Kabogera ang datingan, walang kokontra!"] },
    { title: "Demonyo (Red Ollero Live Theme)", artist: "Tanya Markova", lyrics: ["Wag kang matakot sa demonyong kasama...", "Tawanan mo lang, magiging masaya ka!"] },
    { title: "Itabi Mo, Ako Na", artist: "Tanya Markova", lyrics: ["Itabi mo ako na, ako nang bahala...", "Wag mo nang pahirapan pa ang sarili mo!"] },
    { title: "Pabili Po", artist: "Banda Ni Kleggy ft. Chito Miranda", lyrics: ["Pabili po ng pag-ibig at ligaya...", "Magkano ba ang puso mong kay ganda?"] },
    { title: "Bawal Lumabas (The Classroom Song)", artist: "Kim Chiu", lyrics: ["Bawal lumabas, bawal lumabas...", "Pag nag-comply ka sa batas, may karapatan ka!"] },
    { title: "Chinito Problems", artist: "Enchong Dee", lyrics: ["Bakit ba chinito laging hinahanap?...", "Dahil sa singkit mong mga mata na kay sarap!"] },
    { title: "Walang Basagan ng Trip", artist: "Jugs & Teddy", lyrics: ["Walang basagan ng trip, kanya-kanya tayo...", "Basta masaya, walang pakialamanan dito!"] },
    { title: "Kanta Para Sa Mga T*nga", artist: "Mayonnaise", lyrics: ["Kanta para sa pusong patuloy na umaasa...", "Kahit alam namang wala na talagang pag-asa!"] },
    { title: "Tito Vibes", artist: "Itchyworms", lyrics: ["Kape sa hapon, sumasakit ang likod...", "Ito na ang buhay ng isang ganap na tito!"] },
    { title: "Gento", artist: "SB19", lyrics: ["Gento, gento, hindi 'to basta-basta...", "Pinaghirapan bago naging ginto!"] },
    { title: "Sining", artist: "Dionela ft. Jay R", lyrics: ["Ikaw ang sining na walang kapantay...", "Ganda mong hindi kumukupas sa buhay!"] },
    { title: "Uhaw (Tayong Lahat)", artist: "Dilaw", lyrics: ["Bakit parang sa 'yo lang ako uhaw?...", "Ikaw lang ang laging hanap-tanaw!"] },
    { title: "Panalo", artist: "Ez Mil", lyrics: ["Panalo tayo, wag nang magduda pa...", "Lahi nating matatag saan man magpunta!"] },
    { title: "Kahit Ayaw Mo Na", artist: "This Band", lyrics: ["Kahit ayaw mo na, tatakbo pa rin ako...", "Pipilitin kong bumalik sa tabi mo!"] },
    { title: "Ikaw Lamang", artist: "Silent Sanctuary", lyrics: ["Ikaw lamang ang tangi kong minamahal...", "Pangako sa'yo pag-ibig ay magtatagal!"] },
    { title: "Di Ka Sayang", artist: "Ben&Ben", lyrics: ["Di ka sayang, sadyang nagkamali ka lang...", "Bumangon ka't ituloy ang iyong laban!"] },
    { title: "Pagtingin", artist: "Ben&Ben", lyrics: ["Iibig ba o hindi? Nalilito ang isip...", "Kung aaminin ko ba ang aking pagtingin?"] },
    { title: "Leaves", artist: "Ben&Ben", lyrics: ["Leaves will soon grow from the bareness of trees...", "And all will be alright in time!"] },
    { title: "Sa Susunod Na Habang Buhay", artist: "Ben&Ben", lyrics: ["Kahit di naging tayo hanggang dulo...", "Sa susunod na habang buhay na lang!"] },
    { title: "Araw-Araw", artist: "Ben&Ben", lyrics: ["Mahiwaga ang bawat sandali...", "Pipiliin ka sa araw-araw!"] },
    { title: "Mundo", artist: "IV of Spades", lyrics: ["Aking sinta, ikaw na ang tahanan at mundo...", "Sa pagbalik, mananatili na sa'yo!"] },
    { title: "Come Inside Of My Heart", artist: "IV of Spades", lyrics: ["Come inside of my heart...", "If you're looking for answers!"] },
    { title: "Drown", artist: "IV of Spades", lyrics: ["Help me before I drown in memories...", "Looking for solace in the pouring rain!"] },
    { title: "Binhi", artist: "Arthur Nery", lyrics: ["Nandito lang ako, naghihintay sa binhi...", "Sana'y mamukadkad ang ating pagtangi!"] },
    { title: "Isa Lang", artist: "Arthur Nery", lyrics: ["Isa lang ang tanging nais makasama...", "Sa hirap at ginhawa ikaw lang sinta!"] },
    { title: "Paraluman", artist: "Adie", lyrics: ["Sa bawat ngiti mo paraluman...", "Mundo ko'y agad nagkakakulay!"] },
    { title: "Mahika", artist: "Adie ft. Janine Berdin", lyrics: ["May kakaibang mahika ang 'yong mata...", "Bumibilis ang tibok ng puso kapag kasama ka!"] },
    { title: "Tahanan", artist: "Adie", lyrics: ["Sa'yo lang natagpuan ang tunay na tahanan...", "Pahinga sa magulong sanlibutan!"] },
    { title: "Kathang Isip", artist: "Ben&Ben", lyrics: ["Pasensya ka na sa mga kathang isip kong ito...", "Wala pala talagang tayo sa dulo!"] },
    { title: "Kung 'Di Rin Lang Ikaw", artist: "December Avenue ft. Moira Dela Torre", lyrics: ["Kung di rin lang ikaw ang kasama sa buhay...", "Wag na lang, pipiliin kong mag-isa!"] },
    { title: "Malaya", artist: "Moira Dela Torre", lyrics: ["Pasensya na, kung ako ay bibitaw na...", "Malaya ka na, malaya ka na!"] },
    { title: "Huling Sandali", artist: "December Avenue", lyrics: ["Hindi mapigil ang luha sa pag-alis...", "Ito na ba ang ating huling sandali?"] },
    { title: "Buwan", artist: "Juan Karlos", lyrics: ["Sa ilalim ng puting ilaw, sa dilaw na buwan...", "Pakinggan mo ang aking sigaw!"] },
    { title: "Dungaw", artist: "Adie", lyrics: ["Dumungaw ka sa bintana ng iyong puso...", "Nandito lang ako, naghihintay sa'yo!"] },
    { title: "Pagsamo", artist: "Arthur Nery", lyrics: ["Kahit di mo pansin ang aking pagsamo...", "Hihintayin pa rin ang muling pagtingin mo!"] },
    { title: "Sana", artist: "I Belong to the Zoo", lyrics: ["Sana sinabi mo para di na umasa...", "Sana sinabi mo nang di nasaktan!"] },
    { title: "Balang Araw", artist: "I Belong to the Zoo", lyrics: ["Balang araw makakahanap ka rin...", "Ng taong tunay na magmamahal sa'yo!"] },
    { title: "Paubaya", artist: "Moira Dela Torre", lyrics: ["Pinapalaya na kita sa sakit at luha...", "Ipaubaya na lang natin sa tadhana!"] }
];

async function playKaraokeLyrics(exprStr, resultScoreStr) {
    const vis = document.getElementById('visualizer');
    const song = karaokeSongs[Math.floor(Math.random() * karaokeSongs.length)];

    vis.innerHTML = `
        <div class="relative w-full h-full flex flex-col justify-between items-center p-6 bg-black/95 select-none font-sans text-center">
            <div class="w-full flex justify-between items-center text-xs sm:text-sm font-mono tracking-widest text-emerald-400 border-b border-zinc-800 pb-3">
                <span class="animate-pulse flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    KARAOKE CHORUS TIME
                </span>
                <span class="bg-zinc-800 px-3 py-1 rounded text-zinc-300 font-bold">SONG NO: ${Math.floor(10000 + Math.random() * 90000)}</span>
            </div>

            <div class="flex flex-col items-center justify-center my-auto px-4 max-w-2xl w-full">
                <p class="text-xs sm:text-sm font-bold tracking-widest text-yellow-400 uppercase mb-2">${song.artist}</p>
                <h1 class="text-2xl sm:text-4xl font-black text-white tracking-wider mb-6 drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]">
                    "${song.title}"
                </h1>

                <div class="bg-zinc-900/90 border-2 border-sky-500/50 rounded-2xl p-6 shadow-2xl w-full">
                    <p id="karaoke-line-1" class="text-lg sm:text-2xl font-bold text-sky-400 transition-all duration-700">
                        ${song.lyrics[0]}
                    </p>
                    <p id="karaoke-line-2" class="text-lg sm:text-2xl font-bold text-zinc-500 mt-4 transition-all duration-700">
                        ${song.lyrics[1]}
                    </p>
                </div>

                <div class="w-full bg-zinc-800 h-2.5 rounded-full mt-6 overflow-hidden border border-zinc-700">
                    <div id="singing-progress" class="bg-gradient-to-r from-sky-400 to-emerald-400 h-full w-0 transition-all ease-linear" style="transition-duration: 6000ms;"></div>
                </div>
                <p class="text-[11px] text-zinc-400 font-mono tracking-wider mt-2 animate-pulse">SING THE CHORUS OUT LOUD...</p>
            </div>

            <div class="text-xs font-mono text-zinc-500 tracking-wider">
                CASIONG ClassWiz fx-991CW • COMPUTING: ${exprStr}
            </div>
        </div>
    `;

    vis.classList.remove('hidden');

    setTimeout(() => {
        const bar = document.getElementById('singing-progress');
        if (bar) bar.style.width = '100%';
    }, 50);

    await new Promise(r => setTimeout(r, 3000));

    const l1 = document.getElementById('karaoke-line-1');
    const l2 = document.getElementById('karaoke-line-2');
    if (l1 && l2) {
        l1.className = 'text-lg sm:text-2xl font-bold text-zinc-500 transition-all duration-700';
        l2.className = 'text-lg sm:text-2xl font-bold text-yellow-300 scale-105 transition-all duration-700 drop-shadow-[0_0_12px_rgba(253,224,71,0.5)]';
    }

    await new Promise(r => setTimeout(r, 3000));

    const numericScore = parseFloat(resultScoreStr) || 0;
    const remark = getKaraokeRemarks(numericScore);

    playKaraokeApplauseCheer(resultScoreStr);

    vis.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8 bg-black/95 w-full h-full text-center">
            <p class="text-sm sm:text-base font-mono tracking-widest text-zinc-400 mb-2">YOUR KARAOKE SCORE IS:</p>
            <h2 class="text-6xl sm:text-8xl font-black ${remark.color} animate-bounce tracking-widest drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
                ${resultScoreStr}!
            </h2>
            <p class="text-2xl sm:text-3xl font-bold text-white mt-4 tracking-wide font-mono">
                "${remark.label}"
            </p>
            <p class="text-sm font-mono tracking-widest mt-2 ${remark.color} animate-pulse">
                ${remark.sub}
            </p>
        </div>
    `;

    await new Promise(r => setTimeout(r, 2000));
    vis.classList.add('hidden');
}

document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', async () => {
        if (!audioUnlocked) {
            decimalSound.play().then(() => {
                decimalSound.pause();
                decimalSound.currentTime = 0;
            }).catch(() => {});
            audioUnlocked = true;
        }

        const action = button.dataset.action;
        const value = button.dataset.val;

        if (!action) {
            handleNumber(value);
        } else if (action === 'clear') {
            resetAll();
        } else if (action === 'delete') {
            handleDelete();
        } else if (action === 'easter-egg') {
            handleEasterEgg(value);
        } else if (action === 'sqrt') {
            handleSquareRoot();
        } else if (action === 'operator') {
            handleOperator(value);
        } else if (action === 'calculate') {
            await handleCalculateButton();
        }
    });
});

function handleNumber(val) {
    if (val !== '.') {
        playSpokenNumber(val);
    }

    if (shouldResetInput) {
        currentInput = val === '.' ? '0.' : '';
        expressionChain = '';
        shouldResetInput = false;
    }

    if (val === '.') {
        if (currentInput === '') currentInput = '0.';
        else if (currentInput.includes('.')) return;
        else currentInput += '.';
    } else {
        if (currentInput === '0') currentInput = val;
        else currentInput += val;
    }
    updateDisplay();
}

function handleDelete() {
    currentInput = currentInput.toString().slice(0, -1);
    updateDisplay();
}

function resetAll() {
    currentInput = '';
    expressionChain = '';
    shouldResetInput = false;
    expressionDisplay.innerText = '';
    display.innerText = '0';
}

function handleEasterEgg(val) {
    if (val === 'rickroll') {
        rickrollVid.classList.remove('hidden');
        rickrollVid.currentTime = 0;
        rickrollVid.play().catch(e => console.log('Video blocked:', e));
    } else if (val === 'orgchem') {
        window.open('https://youtu.be/ZtTO8uUGy2Y?si=3VY-ssfDV-N1ztUS', '_blank');
    }
}

function handleSquareRoot() {
    // If there's already a number typed (e.g. typing 9 then √), treat it as implied multiplication: 9 × √
    if (currentInput !== '') {
        expressionChain += currentInput + ' × ';
        updateDisplay(currentInput);
        currentInput = '';
    }

    // Add the square root symbol to the string and wait for the user to type the inner number
    expressionChain += '√';
    shouldResetInput = false;
    expressionDisplay.innerText = expressionChain + currentInput;
}

function handleOperator(op) {
    if (currentInput !== '') {
        expressionChain += currentInput;
        updateDisplay(currentInput);
        currentInput = '';
    } else if (expressionChain === '') {
        expressionChain = '0';
    }

    const symbol = getSymbol(op);

    if (expressionChain.match(/[+×÷-]\s*$/)) {
        expressionChain = expressionChain.replace(/[+×÷-]\s*$/, `${symbol} `);
    } else {
        expressionChain += ` ${symbol} `;
    }

    shouldResetInput = false;
    expressionDisplay.innerText = expressionChain;
}

async function handleCalculateButton() {
    const isSingleNumber = expressionChain === '' || expressionChain === '√';

    if (currentInput !== '') {
        expressionChain += currentInput;
    }

    expressionChain = expressionChain.replace(/\s*[+×÷-]\s*$/, '');
    if (!expressionChain) return;

    if (historyPanel) {
        historyPanel.classList.add('hidden');
    }

    let result;

    if (isSingleNumber && !expressionChain.includes('√')) {
        result = parseFloat(expressionChain);
    } else {
        try {
            const response = await fetch('http://localhost:8080/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression: expressionChain })
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.result !== undefined && data.result !== null) {
                    result = data.result;
                } else {
                    throw new Error("Java backend returned invalid data format");
                }
            } else {
                throw new Error("Backend connection failed");
            }
        } catch (error) {
            console.warn("Spring Boot unreachable or failed. Safely calculating via JavaScript fallback.");
            try {
                let cleanExpression = expressionChain
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/');

                // Safe JS Math Root Fallback
                cleanExpression = cleanExpression.replace(/√\s*(\d+(?:\.\d+)?)/g, 'Math.sqrt($1)');
                result = Function(`'use strict'; return (${cleanExpression})`)();
            } catch (fallbackError) {
                result = 'Error';
            }
        }
    }

    if (
        result === Infinity ||
        result === -Infinity ||
        Number.isNaN(Number(result)) ||
        result === undefined ||
        result === null ||
        (typeof result === 'string' && result.includes('Error'))
    ) {
        display.innerText = 'Math Error';
        resetAll();
        return;
    }

    const sanitizedResult = Number.isInteger(Number(result)) ? Number(result) : parseFloat(Number(result).toFixed(8));
    const resultStr = sanitizedResult.toString();

    // 1. UPDATE THE UI INSTANTLY
    if (resultStr.includes('.')) {
        decimalSound.currentTime = 0;
        decimalSound.play().catch(() => {});
    }

    expressionDisplay.innerText = `${expressionChain} =`;
    display.innerText = resultStr;
    addHistoryItem(expressionChain, resultStr);

    currentInput = resultStr;
    expressionChain = '';
    shouldResetInput = true;

    // 2. TRIGGER KARAOKE *ONLY* IF IT WAS A REAL CALCULATION
    if (!isSingleNumber) {
        playKaraokeLyrics(expressionDisplay.innerText, resultStr);
    }
}

function getSymbol(op) {
    if (op === '/') return '÷';
    if (op === '*') return '×';
    return op;
}

function updateDisplay(overrideDisplay = null) {
    if (overrideDisplay !== null) {
        display.innerText = overrideDisplay;
    } else if (currentInput !== '') {
        display.innerText = currentInput;
    } else if (expressionChain === '') {
        display.innerText = '0';
    }

    expressionDisplay.innerText = expressionChain + currentInput;

    requestAnimationFrame(() => {
        display.scrollLeft = display.scrollWidth;
        expressionDisplay.scrollLeft = expressionDisplay.scrollWidth;
    });
}

function addHistoryItem(expr, result) {
    calculationHistory.unshift({ expr, result });
    renderHistory();
}

function renderHistory() {
    if (calculationHistory.length === 0) {
        historyList.innerHTML = `<li class="text-zinc-500 italic px-2 py-1">No history yet</li>`;
        return;
    }
    historyList.innerHTML = calculationHistory.map(item => `
        <li class="history-item p-2 flex justify-between items-center hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors" data-val="${item.result}">
            <span class="text-zinc-400 pointer-events-none">${item.expr} =</span>
            <span class="text-emerald-400 font-bold pointer-events-none">${item.result}</span>
        </li>
    `).join('');
}

historyList.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item');
    if (!item) return;

    currentInput = item.dataset.val;
    historyPanel.classList.add('hidden');
    updateDisplay();
    shouldResetInput = false;
});

historyToggle.addEventListener('click', () => historyPanel.classList.toggle('hidden'));
if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', () => historyPanel.classList.add('hidden'));
}
clearHistoryBtn.addEventListener('click', () => {
    calculationHistory = [];
    renderHistory();
});

renderHistory();