document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
    const loader = document.getElementById('loader');
    const inputSection = document.getElementById('input-section');
    const wordInput = document.getElementById('word-input');
    const fileUpload = document.getElementById('file-upload');
    const createGameBtn = document.getElementById('create-game-btn');
    const gameSelection = document.getElementById('game-selection');
    const gameContainer = document.getElementById('game-container');
    const gameTitle = document.getElementById('game-title');
    const gameArea = document.getElementById('game-area');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    const finalStatsContainer = document.getElementById('final-stats-container');
    // REMOVED: characterImg
    const correctSound = document.getElementById('correct-sound');
    const incorrectSound = document.getElementById('incorrect-sound');
    const statsBar = document.getElementById('stats-bar');
    const statsCorrect = document.getElementById('stats-correct').parentElement;
    const statsIncorrect = document.getElementById('stats-incorrect').parentElement;
    const statsProgress = document.getElementById('stats-progress');
    const statsAccuracy = document.getElementById('stats-accuracy').parentElement;
    const backToInputBtn = document.getElementById('back-to-input-btn');

    // === GAME STATE & CONFIG ===
    let wordList = [];
    let currentQuestionIndex = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let incorrectAnswers = { flashcard: [], mc: [], write: [], fill: [], match: [] };
    let completedGames = new Set();
    let isProcessing = false;
    let audioInitialized = false;
    let speechVoice = null;
    // REMOVED: characterGifs
    const congratsMessages = ["Congratulations!", "Excellent!", "Well Done!", "You're a Star!", "Amazing Job!"];
    const fillTemplates = [
        "What is the definition of ______?",
        "The word ______ is very important.",
        "Let's practice spelling ______.",
        "Today, we are learning about ______.",
        "Could you use ______ in a sentence?",
        "Remember to practice the word ______."
    ];

    // === AUDIO & SPEECH INITIALIZATION ===
    const initializeSpeech = () => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                const priorityVoices = ["Google US English", "Samantha", "Daniel", "Microsoft Zira - English (United States)"];
                let foundVoice = null;
                for (const name of priorityVoices) {
                    foundVoice = voices.find(voice => voice.name === name && voice.lang.startsWith('en'));
                    if (foundVoice) break;
                }
                if (!foundVoice) {
                    foundVoice = voices.find(voice => voice.lang === 'en-US');
                }
                speechVoice = foundVoice || voices.find(voice => voice.lang.startsWith('en'));
            }
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    };

    const unlockAudioContext = () => {
        if (audioInitialized) return;
        correctSound.load();
        incorrectSound.load();
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance("");
            window.speechSynthesis.speak(utterance);
        }
        audioInitialized = true;
        console.log("Audio context unlocked.");
    };

    // === EVENT LISTENERS & INITIALIZATION ===
    createGameBtn.addEventListener('click', () => {
        unlockAudioContext();
        createGame();
    });
    
    backToInputBtn.addEventListener('click', () => {
        gameSelection.classList.add('hidden');
        inputSection.classList.remove('hidden');
    });

    fileUpload.addEventListener('change', handleFileUpload);
    document.getElementById('flashcard-game-btn').addEventListener('click', () => startGame('flashcard'));
    document.getElementById('mc-game-btn').addEventListener('click', () => startGame('mc'));
    document.getElementById('match-game-btn').addEventListener('click', () => startGame('match'));
    document.getElementById('write-game-btn').addEventListener('click', () => startGame('write'));
    document.getElementById('fill-game-btn').addEventListener('click', () => startGame('fill'));
    backToMenuBtn.addEventListener('click', showGameSelection);
    
    initializeSpeech();
    // REMOVED: setCharacterState('idle');
    loadFromLocalStorage();

    // === CORE LOGIC ===
    function createGame() {
        const text = wordInput.value.trim();
        if (text === '') { alert('Vui lòng nhập danh sách từ!'); return; }
        wordList = [];
        Object.keys(incorrectAnswers).forEach(key => incorrectAnswers[key] = []);
        completedGames = new Set();
        text.split('\n').forEach(line => {
            const parts = line.split('-').map(part => part.trim());
            if (parts.length === 2 && parts[0] && parts[1]) {
                wordList.push({ english: parts[0], vietnamese: parts[1] });
            }
        });
        if (wordList.length < 1) { alert('Cần ít nhất 1 từ để tạo game!'); return; }
        saveToLocalStorage();
        inputSection.classList.add('hidden');
        finalStatsContainer.classList.add('hidden');
        gameSelection.classList.remove('hidden');
    }

    function startGame(gameType) {
        if (gameType !== 'flashcard' && wordList.length < 4) {
            alert('Cần ít nhất 4 từ để chơi game này!');
            return;
        }
        gameSelection.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        backToMenuBtn.classList.remove('hidden');
        gameArea.innerHTML = '';
        currentQuestionIndex = 0;
        correctCount = 0;
        incorrectCount = 0;
        isProcessing = false;
        incorrectAnswers[gameType] = [];
        if (gameType !== 'flashcard') {
            wordList.sort(() => Math.random() - 0.5);
        }
        
        const gameFunctions = {
            'flashcard': { title: "Game Flashcards", start: startFlashcardGame },
            'mc': { title: "Game Trắc Nghiệm", start: startMultipleChoiceGame },
            'match': { title: "Game Nối Từ", start: startMatchingGame },
            'write': { title: "Game Luyện Viết", start: startWritingGame },
            'fill': { title: "Game Điền Từ", start: startFillGame }
        };
        gameTitle.innerText = gameFunctions[gameType].title;
        updateStatsBar(); 
        gameFunctions[gameType].start();
    }
    
    function showGameSelection() {
        gameContainer.classList.add('hidden');
        gameSelection.classList.remove('hidden');
        backToMenuBtn.classList.add('hidden');
        // REMOVED: setCharacterState('idle');
    }

    // === UI & STATE HANDLERS ===
    const speak = (text) => {
        if (!audioInitialized || !('speechSynthesis' in window) || !text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        if (speechVoice) {
            utterance.voice = speechVoice;
        }
        utterance.lang = 'en-US';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const playSound = (sound) => { 
        if (!audioInitialized) return;
        sound.currentTime = 0; 
        sound.play().catch(error => console.error("Sound effect failed to play:", error)); 
    };
    
    // REMOVED: setCharacterState and triggerCharacterAnimation functions

    function updateStatsBar() {
        const isFlashcard = gameTitle.innerText.includes("Flashcards");
        
        statsCorrect.style.display = isFlashcard ? 'none' : 'block';
        statsIncorrect.style.display = isFlashcard ? 'none' : 'block';
        statsAccuracy.style.display = isFlashcard ? 'none' : 'block';
        
        if (isFlashcard) {
            statsProgress.parentElement.querySelector('.stat-label').textContent = 'Thẻ';
            statsProgress.textContent = wordList.length > 0 ? `${currentQuestionIndex + 1}/${wordList.length}`: '0/0';
        } else {
            statsProgress.parentElement.querySelector('.stat-label').textContent = 'Tiến độ';
            const totalItems = wordList.length;
            const processedItems = gameTitle.innerText.includes("Nối Từ") ? (correctCount) : currentQuestionIndex;
            document.getElementById('stats-correct').textContent = correctCount;
            document.getElementById('stats-incorrect').textContent = incorrectCount;
            statsProgress.textContent = `${processedItems}/${totalItems}`;
            const totalPlayed = correctCount + incorrectCount;
            const accuracy = totalPlayed > 0 ? Math.round((correctCount / totalPlayed) * 100) : 0;
            document.getElementById('stats-accuracy').textContent = `${accuracy}%`;
        }
    }
    
    const handleCorrectAnswer = (wordToSpeak) => {
        correctCount++;
        playSound(correctSound);
        // REMOVED: triggerCharacterAnimation('happy');
        if (wordToSpeak) speak(wordToSpeak);
        updateStatsBar();
    };

    const handleIncorrectAnswer = (data) => {
        incorrectCount++;
        playSound(incorrectSound);
        // REMOVED: triggerCharacterAnimation('sad');
        if (data && data.type && incorrectAnswers[data.type]) {
             incorrectAnswers[data.type].push({ question: data.question, userAnswer: data.userAnswer });
        }
        updateStatsBar();
    };

    // ... (The rest of the game logic functions from the previous response remain unchanged) ...
    // === FLASHCARD GAME LOGIC ===
    function startFlashcardGame() {
        currentQuestionIndex = 0;
        renderFlashcard(currentQuestionIndex);
    }
    
    function renderFlashcard(index) {
        if (wordList.length === 0) {
            gameArea.innerHTML = `<p>Không có từ nào để hiển thị.</p>`;
            return;
        }
        const currentWord = wordList[index];
        if (!currentWord) return;

        gameArea.innerHTML = `
            <div id="flashcard-container">
                <div class="flashcard" id="flashcard">
                    <div class="flashcard-inner">
                        <div class="flashcard-front">${currentWord.english}</div>
                        <div class="flashcard-back">${currentWord.vietnamese}</div>
                    </div>
                </div>
                <div class="flashcard-nav">
                    <button id="flashcard-prev" title="Lùi lại"><i class="fa-solid fa-arrow-left"></i> Lùi</button>
                    <button id="flashcard-speak" title="Nghe lại"><i class="fa-solid fa-volume-high"></i></button>
                    <button id="flashcard-next" title="Tiếp theo">Tiến <i class="fa-solid fa-arrow-right"></i></button>
                </div>
                <p class="flashcard-hint">Chạm vào thẻ để lật thẻ</p>
            </div>
        `;
        
        speak(currentWord.english);
        updateStatsBar();
        
        const card = document.getElementById('flashcard');
        const prevBtn = document.getElementById('flashcard-prev');
        const nextBtn = document.getElementById('flashcard-next');
        const speakBtn = document.getElementById('flashcard-speak');

        card.addEventListener('click', () => card.classList.toggle('flipped'));
        speakBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            speak(currentWord.english);
        });

        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === wordList.length - 1;

        prevBtn.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                renderFlashcard(currentQuestionIndex);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentQuestionIndex < wordList.length - 1) {
                currentQuestionIndex++;
                renderFlashcard(currentQuestionIndex);
            }
        });
    }

    // === OTHER GAMES LOGIC ===
    function startMultipleChoiceGame() {
        if (currentQuestionIndex >= wordList.length) { endGame('mc'); return; }
        updateStatsBar(); 
        const currentWord = wordList[currentQuestionIndex]; 
        speak(currentWord.english); 
        let options = [currentWord, ...wordList.filter(w => w.english !== currentWord.english).sort(() => 0.5 - Math.random()).slice(0, 3)].sort(() => 0.5 - Math.random()); 
        gameArea.innerHTML = `<p class="game-prompt">Từ <strong class="highlight-word">${currentWord.english}</strong> có nghĩa là gì?</p><div class="mc-options">${options.map(opt => `<button class="mc-option" data-answer="${opt.vietnamese}">${opt.vietnamese}</button>`).join('')}</div>`;
        document.querySelectorAll('.mc-option').forEach(btn => btn.addEventListener('click', checkMCAnswer));
    }

    function checkMCAnswer(event) {
        if (isProcessing) return;
        isProcessing = true;
        document.querySelectorAll('.mc-option').forEach(btn => btn.disabled = true);
        const selectedBtn = event.target;
        const selectedAnswer = selectedBtn.dataset.answer;
        const currentWord = wordList[currentQuestionIndex];
        
        if (selectedAnswer === currentWord.vietnamese) {
            selectedBtn.classList.add('correct');
            handleCorrectAnswer();
        } else {
            selectedBtn.classList.add('incorrect');
            const correctBtn = document.querySelector(`.mc-option[data-answer="${currentWord.vietnamese}"]`);
            if(correctBtn) correctBtn.classList.add('correct');
            handleIncorrectAnswer({ type: 'mc', question: currentWord, userAnswer: selectedAnswer });
        }
        currentQuestionIndex++;
        setTimeout(() => {
            try { startMultipleChoiceGame(); } finally { isProcessing = false; }
        }, 1500);
    }
    
    function startMatchingGame() {
        updateStatsBar();
        const words = [...wordList].sort(() => 0.5 - Math.random());
        const meanings = [...wordList].sort(() => 0.5 - Math.random());
        gameArea.innerHTML = `<p class="game-prompt">Chọn một từ và nghĩa tương ứng của nó.</p><div class="match-container"><div class="match-column">${words.map(w => `<div class="match-item" data-word="${w.english}">${w.english}</div>`).join('')}</div><div class="match-column">${meanings.map(m => `<div class="match-item" data-meaning="${m.vietnamese}">${m.vietnamese}</div>`).join('')}</div></div>`;
        
        let selectedWordEl = null;
        gameArea.querySelectorAll('.match-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget;
                if (target.classList.contains('disabled') || isProcessing) return;
    
                if (target.dataset.word) {
                    if (selectedWordEl) selectedWordEl.classList.remove('selected');
                    target.classList.add('selected');
                    selectedWordEl = target;
                } else if (target.dataset.meaning && selectedWordEl) {
                    isProcessing = true;
                    const word = selectedWordEl.dataset.word;
                    const meaning = target.dataset.meaning;
                    const correctWordData = wordList.find(w => w.english === word);
    
                    if (correctWordData && correctWordData.vietnamese === meaning) {
                        handleCorrectAnswer(word);
                        selectedWordEl.classList.add('correct', 'disabled');
                        target.classList.add('correct', 'disabled');
                        if (correctCount === wordList.length) {
                            setTimeout(() => { isProcessing = false; endGame('match'); }, 800);
                        } else {
                            isProcessing = false;
                        }
                    } else {
                        handleIncorrectAnswer({ type: 'match', question: { english: word }, userAnswer: `chose '${meaning}'` });
                        target.classList.add('incorrect');
                        setTimeout(() => {
                           target.classList.remove('incorrect');
                           isProcessing = false;
                        }, 800);
                    }
                    selectedWordEl.classList.remove('selected');
                    selectedWordEl = null;
                }
            });
        });
    }

    function startWritingGame() {
        if (currentQuestionIndex >= wordList.length) { endGame('write'); return; }
        updateStatsBar(); 
        const currentWord = wordList[currentQuestionIndex]; 
        gameArea.innerHTML = `<p class="game-prompt">Viết từ tiếng Anh cho nghĩa: <strong class="highlight-word">${currentWord.vietnamese}</strong></p><div class="write-input-container"><input type="text" id="write-input" autocomplete="off" spellcheck="false"><button id="listen-btn" title="Nghe phát âm"><i class="fa-solid fa-volume-high"></i></button></div><button id="check-write-btn">Kiểm tra</button>`; 
        const input = document.getElementById('write-input');
        input.focus();
        document.getElementById('listen-btn').addEventListener('click', () => speak(currentWord.english));
        document.getElementById('check-write-btn').addEventListener('click', checkWriteAnswer);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkWriteAnswer(); });
    }

    function checkWriteAnswer() {
        if (isProcessing) return;
        isProcessing = true;
        const input = document.getElementById('write-input');
        const userAnswer = input.value.trim();
        const currentWord = wordList[currentQuestionIndex];
        
        if (userAnswer.toLowerCase() === currentWord.english.toLowerCase()) {
            input.style.borderColor = 'var(--success-color)';
            handleCorrectAnswer(currentWord.english);
        } else {
            input.style.borderColor = 'var(--danger-color)';
            handleIncorrectAnswer({ type: 'write', question: currentWord, userAnswer: userAnswer });
        }
        currentQuestionIndex++;
        setTimeout(() => {
            try { startWritingGame(); } finally { isProcessing = false; }
        }, 1200);
    }

    function startFillGame() {
        if (currentQuestionIndex >= wordList.length) { endGame('fill'); return; }
        updateStatsBar(); 
        const currentWord = wordList[currentQuestionIndex]; 
        const template = fillTemplates[Math.floor(Math.random() * fillTemplates.length)]; 
        const sentenceHTML = template.replace('______', `<input type="text" id="fill-input" autocomplete="off" spellcheck="false">`); 
        gameArea.innerHTML = `<p class="game-prompt">Điền từ còn thiếu vào chỗ trống:</p><div class="fill-sentence">${sentenceHTML}</div><div class="fill-clue">(Gợi ý: từ có nghĩa là "<strong>${currentWord.vietnamese}</strong>")</div><button id="check-fill-btn">Kiểm tra</button>`;
        const input = document.getElementById('fill-input');
        input.focus();
        document.getElementById('check-fill-btn').addEventListener('click', checkFillAnswer);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkFillAnswer(); });
    }
    
    function checkFillAnswer() {
        if (isProcessing) return;
        isProcessing = true;
        const input = document.getElementById('fill-input');
        const userAnswer = input.value.trim();
        const currentWord = wordList[currentQuestionIndex];

        if (userAnswer.toLowerCase() === currentWord.english.toLowerCase()) {
            input.style.borderColor = 'var(--success-color)';
            handleCorrectAnswer(currentWord.english);
        } else {
            input.style.borderColor = 'var(--danger-color)';
            handleIncorrectAnswer({ type: 'fill', question: currentWord, userAnswer: userAnswer });
        }
        currentQuestionIndex++;
        setTimeout(() => {
            try { startFillGame(); } finally { isProcessing = false; }
        }, 1200);
    }
    
    // === END GAME & STATS ===
    function endGame(gameType) {
        if(gameType === 'flashcard') {
             showGameSelection();
             return;
        }
        completedGames.add(gameType);
        const randomCongrats = congratsMessages[Math.floor(Math.random() * congratsMessages.length)];
        let resultsHTML = `<p class="end-game-message">${randomCongrats}</p>`;
        
        const incorrectList = incorrectAnswers[gameType] || [];
        const gameDescription = { mc: "Trắc nghiệm", write: "Luyện viết", fill: "Điền từ", match: "Nối từ" }[gameType];
        
        if (incorrectList.length > 0) {
            resultsHTML += `<h3>Các lỗi sai trong game ${gameDescription}:</h3><ul class="results-list">`;
            incorrectList.forEach(item => {
                const qText = (gameType === 'mc' || gameType === 'match') ? item.question.english : item.question.vietnamese;
                const userAns = item.userAnswer || '<i>bỏ trống</i>';
                const correctAns = (gameType === 'mc' || gameType === 'match') ? item.question.vietnamese : item.question.english;
                resultsHTML += `<li><strong>${qText}</strong>: Bạn đã trả lời <span class="user-answer">${userAns}</span>. Đáp án đúng là <span class="correct-answer">${correctAns}</span></li>`;
            });
            resultsHTML += '</ul>';
        } else {
             resultsHTML += `<p>Bạn đã hoàn thành xuất sắc game ${gameDescription}!</p>`;
        }
        
        gameArea.innerHTML = resultsHTML;
    }
    
    function showFinalStats() { 
        const totalErrors = Object.values(incorrectAnswers).reduce((acc, arr) => acc + arr.length, 0);
        if (totalErrors === 0) { 
            finalStatsContainer.innerHTML = '<h2>Báo cáo tổng kết</h2><p style="font-size: 1.2em; color: var(--success-color);"><strong>Thật tuyệt vời! Bạn không mắc lỗi nào trong tất cả các game!</strong></p>'; 
        } else { 
            let statsHTML = '<h2>Báo cáo tổng kết: Các lỗi sai</h2><ul>'; 
            if(incorrectAnswers.mc.length > 0) incorrectAnswers.mc.forEach(item => statsHTML += `<li>[Trắc nghiệm] Từ <strong>${item.question.english}</strong>: Sai nghĩa. Đáp án đúng: <span class="correct-answer">${item.question.vietnamese}</span></li>`); 
            if(incorrectAnswers.write.length > 0) incorrectAnswers.write.forEach(item => statsHTML += `<li>[Luyện viết] Nghĩa <strong>${item.question.vietnamese}</strong>: Gõ sai. Đáp án đúng: <span class="correct-answer">${item.question.english}</span></li>`); 
            if(incorrectAnswers.fill.length > 0) incorrectAnswers.fill.forEach(item => statsHTML += `<li>[Điền từ] Gợi ý <strong>${item.question.vietnamese}</strong>: Điền sai. Đáp án đúng: <span class="correct-answer">${item.question.english}</span></li>`); 
            if(incorrectAnswers.match.length > 0) incorrectAnswers.match.forEach(item => statsHTML += `<li>[Nối từ] Từ <strong>${item.question.english}</strong>: Bạn đã nối sai.</li>`); 
            statsHTML += '</ul><p>Hãy ôn lại các từ này và thử lại nhé!</p>'; 
            finalStatsContainer.innerHTML = statsHTML; 
        } 
        finalStatsContainer.classList.remove('hidden'); 
    }
    
    // === LOCAL STORAGE & FILE HANDLING ===
    function saveToLocalStorage() { if (wordList.length > 0) localStorage.setItem('savedWordList', JSON.stringify(wordList)); }
    function loadFromLocalStorage() { const savedList = localStorage.getItem('savedWordList'); if (savedList) { try { const parsedList = JSON.parse(savedList); if (Array.isArray(parsedList) && parsedList.length > 0) { const text = parsedList.map(item => `${item.english} - ${item.vietnamese}`).join('\n'); wordInput.value = text; } } catch (e) { localStorage.removeItem('savedWordList'); } } }
    async function handleFileUpload(event) { const file = event.target.files[0]; if (!file) return; document.getElementById('file-name').textContent = file.name; loader.classList.remove('hidden'); try { let text = ''; if (file.name.endsWith('.docx')) { const arrayBuffer = await file.arrayBuffer(); const result = await mammoth.extractRawText({ arrayBuffer }); text = result.value; } else if (file.name.endsWith('.pdf')) { const fileReader = new FileReader(); fileReader.onload = async (e) => { const typedarray = new Uint8Array(e.target.result); const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise; let fullText = ''; for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const textContent = await page.getTextContent(); fullText += textContent.items.map(item => item.str).join(' ') + '\n'; } wordInput.value = fullText; loader.classList.add('hidden'); }; fileReader.readAsArrayBuffer(file); return; } wordInput.value = text; } catch (error) { console.error('Error reading file:', error); alert('Đã xảy ra lỗi khi đọc file.'); } finally { if (!file.name.endsWith('.pdf')) { loader.classList.add('hidden'); } } }
});
