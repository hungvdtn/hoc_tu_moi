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
    const characterImg = document.getElementById('character-img');
    const correctSound = document.getElementById('correct-sound');
    const incorrectSound = document.getElementById('incorrect-sound');
    const statsCorrect = document.getElementById('stats-correct');
    const statsIncorrect = document.getElementById('stats-incorrect');
    const statsProgress = document.getElementById('stats-progress');
    const statsAccuracy = document.getElementById('stats-accuracy');

    // === GAME STATE & CONFIG ===
    let wordList = [];
    let currentQuestionIndex = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let incorrectAnswers = { mc: [], write: [], fill: [], match: [] };
    let completedGames = new Set();
    let isProcessing = false;
    let audioInitialized = false;
    let speechVoice = null; // To store the selected high-quality voice

    const characterGifs = {
        idle: 'data:image/gif;base64,R0lGODlhZABkAPQAAAAAAP///5aWlmtra21tbZmZmc3NzePj4+vr6/39/f7+/v///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJKAAPACwAAAAAZABkAAAF/6AnjmRpnmiqrmzrvnAsz3Rt33iu73zv/8CgcEgsGo/IpHLJbDqf0Kh0Sq1ar9isdsvter/gsHhMLpvP6LR6zW673/C4fE6v2+/4vH7P7/v/gIFxgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wADChxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJkyhTqlzJsqXLlzBjypxJs6bNmzhz6tzJs6fPn0CDCh1KtKjRo0iTKl3KtKnTp1CjSp1KtarVq1izat3KtavXr2DDih1LtqzZs2jTql3Ltq3bt3Djyp1Lt67du3jz6t3Lt6/fv4ADCx5MuLDhw4gTK17MuLHjx5AjS55MubLly5gza97MubPnz6BDix5NurTp06hTq17NurXr17Bjy55Nu7bt27hz697Nu7fv38CDCx9OvLjx48iTK1/OvLnz59CjS59Ovbr169iza9/Ovbv37+DDix9Pvrz58+jTq1/Pvr379/Djy59Pv779+/jz69/Pv7///wAGKOAADEBQQIMNzoFghBVeaOGFGGao4YYcghjiiCSWaOKJKKao4oostujiizDGKOOMNNYoIgAAIfkECQoADwAsAAAAAGQAZAAABf+gJ45kaZ5oqq5s675wLM93bd94ru987//AoHCIFAqPyKRyyWw6n9CodEqtWq/YrHbL7Xq/4LA4rJbM5/Raj8xu+57wsNlPr9vv+Lx+z+/7/4CBgH+ChYeGf4iJiouMjY6PkJF+k5SVlpeYmZqbnJ12n6ChoqOkpaanqKmqq6ytrq94sbKztLW2t7i5uru8vb58v8HCw8TFxsfIycrLzM3OvL/P0NHS09TV1tfY2drb3N22xt/g4eLj5OXm5+jp6uvs7e5yu/Hy8/T19vf4+fr7/P17/P8AAwocSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZs4c+rcybOnz59AgwodSrSo0aNIkypdyrSp06dQo0qdSrWq1atYs2rdyrWr169gw4odS7as2bNo06pdy7at27dw48qdS7eu3bt48+rdy7ev37+AAwseTLiw4cOIEytezLix48eQI0ueTLiY5cuYM2vezLmz58+gQ4seTbq06dOoU6tezbq169ewY8ueTbu27du4c+vezbu379/AgwsfTry48ePIkytfzry58+fQo0ufTr269evYs2vfzr279+/gw4sfT768+fPo06tfz769+/fw48ufT7++/fv48+vfz7+///8ABijggAQWaOCBCCao4IIMNujggxBGKOGEFFZo4YUYZqjhhhx26OGHIIYo4ogklmgiAAA7',
        happy: 'data:image/gif;base64,R0lGODlhZABkAPQAAAAAAP///5aWlmtra21tbZmZmc3NzePj4+vr6/39/f7+/v///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJKAAPACwAAAAAZABkAAAF/6AnjmRpnmiqrmzrvnAsz3Rt33iu73zv/8CgcEgsGo/IpHLJbDqf0Kh0Sq1ar9isdsvter/gsHhMLpvP6LR6zW673/C4fE6v2+/4vH7P7/v/gIFxgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wADChxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJkyhTqlzJsqXLlzBjypxJs6bNmzhz6tzJs6fPn0CDCh1KtKjRo0iTKl3KtKnTp1CjSp1KtarVq1izat3KtavXr2DDih1LtqzZs2jTql3Ltq3bt3Djyp1Lt67du3jz6t3Lt6/fv4ADCx5MuLDhw4gTK17MuLHjx5AjS55MubLly5gza97MubPnz6BDix5NurTp06hTq17NurXr17Bjy55Nu7bt27hz697Nu7fv38CDCx9OvLjx48iTK1/OvLnz59CjS59Ovbr169iza9/Ovbv37+DDix9Pvrz58+jTq1/Pvr379/Djy59Pv779+/jz69/Pv7///wAGKOAADEBQQIMNzoFghBVeaOGFGGao4YYcghjiiCSWaOKJKKao4oostujiizDGKOOMNNYoIgAAIfkECQoADwAsAAAAAGQAZAAABf+gJ45kaZ5oqq5s675wLM93bd94ru987//AoHCIFAqPyKRyyWw6n9CodEqtWq/YrHbL7Xq/4LA4rJbM5/Raj8xu+57wsNlPr9vv+Lx+z+/7/4CBgH+ChYeGf4iJiouMjY6PkJF+k5SVlpeYmZqbnJ12n6ChoqOkpaanqKmqq6ytrq94sbKztLW2t7i5uru8vb58v8HCw8TFxsfIycrLzM3OvL/P0NHS09TV1tfY2drb3N22xt/g4eLj5OXm5+jp6uvs7e5yu/Hy8/T19vf4+fr7/P17/P8AAwocSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZs4c+rcybOnz59AgwodSrSo0aNIkypdyrSp06dQo0qdSrWq1atYs2rdyrWr169gw4odS7as2bNo06pdy7at27dw48qdS7eu3bt48+rdy7ev37+AAwseTLiw4cOIEytezLix48eQI0ueTLiY5cuYM2vezLmz58+gQ4seTbq06dOoU6tezbq169ewY8ueTbu27du4c+vezbu379/AgwsfTry48ePIkytfzry58+fQo0ufTr269evYs2vfzr279+/gw4sfT768+fPo06tfz769+/fw48ufT7++/fv48+vfz7+///8ABijggAQWaOCBCCao4IIMNujggxBGKOGEFFZo4YUYZqjhhhx26OGHIIYo4ogklmgiAAA7',
        sad: 'data:image/gif;base64,R0lGODlhZABkAPQAAAAAAP///5aWlpubm8PDw8zMzLCwsOPj4+3t7f///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJKAAPACwAAAAAZABkAAAF/6AnjmRpnmiqrmzrvnAsz3Rt33iu73zv/8CgcEgsGo/IpHLJbDqf0Kh0Sq1ar9isdsvter/gsHhMLpvP6LR6zW673/C4fE6v2+/4vH7P7/v/gIFxgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/wADChxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJkyhTqlzJsqXLlzBjypxJs6bNmzhz6tzJs6fPn0CDCh1KtKjRo0iTKl3KtKnTp1CjSp1KtarVq1izat3KtavXr2DDih1LtqzZs2jTql3Ltq3bt3Djyp1Lt67du3jz6t3Lt6/fv4ADCx5MuLDhw4gTK17MuLHjx5AjS55MubLly5gza97MubPnz6BDix5NurTp06hTq17NurXr17Bjy55Nu7bt27hz697Nu7fv38CDCx9OvLjx48iTK1/OvLnz59CjS59Ovbr169iza9/Ovbv37+DDix9Pvrz58+jTq1/Pvr379/Djy59Pv779+/jz69/Pv7///wAGKOAADEBQQIMNzoFghBVeaOGFGGao4YYcghjiiCSWaOKJKKao4oostujiizDGKOOMNNYoIgAAIfkECQoADwAsAAAAAGQAZAAABf+gJ45kaZ5oqq5s675wLM93bd94ru987//AoHCIFAqPyKRyyWw6n9CodEqtWq/YrHbL7Xq/4LA4rJbM5/Raj8xu+57wsNlPr9vv+Lx+z+/7/4CBgH+ChYeGf4iJiouMjY6PkJF+k5SVlpeYmZqbnJ12n6ChoqOkpaanqKmqq6ytrq94sbKztLW2t7i5uru8vb58v8HCw8TFxsfIycrLzM3OvL/P0NHS09TV1tfY2drb3N22xt/g4eLj5OXm5+jp6uvs7e5yu/Hy8/T19vf4+fr7/P17/P8AAwocSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZs4c+rcybOnz59AgwodSrSo0aNIkypdyrSp06dQo0qdSrWq1atYs2rdyrWr169gw4odS7as2bNo06pdy7at27dw48qdS7eu3bt48+rdy7ev37+AAwseTLiw4cOIEytezLix48eQI0ueTLiY5cuYM2vezLmz58+gQ4seTbq06dOoU6tezbq169ewY8ueTbu27du4c+vezbu379/AgwsfTry48ePIkytfzry58+fQo0ufTr269evYs2vfzr279+/gw4sfT768+fPo06tfz769+/fw48ufT7++/fv48+vfz7+///8ABijggAQWaOCBCCao4IIMNujggxBGKOGEFFZo4YUYZqjhhhx26OGHIIYo4ogklmgiAAA7'
    };
    const congratsMessages = ["Congratulations!", "Excellent!", "Well Done!", "You're a Star!", "Amazing Job!"];
    const fillTemplates = [
        "What is the definition of ______?",
        "The word ______ is very important.",
        "Let's practice spelling ______.",
        "Today, we are learning about ______.",
        "Could you use ______ in a sentence?",
        "Remember to practice the word ______."
    ];

    // === NEW: AUDIO & SPEECH INITIALIZATION ===
    
    // This function finds and sets the best available English voice.
    const initializeSpeech = () => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                // Prioritize high-quality voices
                const priorityVoices = [
                    "Google US English", // High quality on Chrome/Android
                    "Samantha", // Default high quality on iOS/macOS
                    "Daniel", // High quality on iOS/macOS
                    "Microsoft Zira - English (United States)", // High quality on Windows
                ];
                let foundVoice = null;
                for (const name of priorityVoices) {
                    foundVoice = voices.find(voice => voice.name === name && voice.lang.startsWith('en'));
                    if (foundVoice) break;
                }
                
                // Fallback to any 'en-US' voice
                if (!foundVoice) {
                    foundVoice = voices.find(voice => voice.lang === 'en-US');
                }
                speechVoice = foundVoice || voices.find(voice => voice.lang.startsWith('en'));
            }
        };

        loadVoices();
        // The list of voices is loaded asynchronously.
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    };

    // This function unlocks all audio functionalities. Must be called by a user action.
    const unlockAudioContext = () => {
        if (audioInitialized) return;

        // Unlock <audio> elements for sound effects
        correctSound.load();
        incorrectSound.load();

        // Prime the speech synthesis engine
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance("");
            window.speechSynthesis.speak(utterance);
        }

        audioInitialized = true;
        console.log("Audio context unlocked.");
    };


    // === EVENT LISTENERS & INITIALIZATION ===
    createGameBtn.addEventListener('click', () => {
        unlockAudioContext(); // Unlock audio on the first user interaction
        createGame();
    });

    fileUpload.addEventListener('change', handleFileUpload);
    document.getElementById('mc-game-btn').addEventListener('click', () => startGame('mc'));
    document.getElementById('match-game-btn').addEventListener('click', () => startGame('match'));
    document.getElementById('write-game-btn').addEventListener('click', () => startGame('write'));
    document.getElementById('fill-game-btn').addEventListener('click', () => startGame('fill'));
    backToMenuBtn.addEventListener('click', showGameSelection);
    
    initializeSpeech();
    setCharacterState('idle');
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
        if (wordList.length < 4) { alert('Cần ít nhất 4 từ để tạo game!'); return; }
        saveToLocalStorage();
        inputSection.classList.add('hidden');
        finalStatsContainer.classList.add('hidden');
        gameSelection.classList.remove('hidden');
    }

    function startGame(gameType) {
        gameSelection.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        gameArea.innerHTML = '';
        currentQuestionIndex = 0;
        correctCount = 0;
        incorrectCount = 0;
        isProcessing = false;
        incorrectAnswers[gameType] = [];
        updateStatsBar();
        wordList.sort(() => Math.random() - 0.5);
        const gameFunctions = {
            'mc': { title: "Game Trắc Nghiệm", start: startMultipleChoiceGame },
            'match': { title: "Game Nối Từ", start: startMatchingGame },
            'write': { title: "Game Luyện Viết", start: startWritingGame },
            'fill': { title: "Game Điền Từ", start: startFillGame }
        };
        gameTitle.innerText = gameFunctions[gameType].title;
        gameFunctions[gameType].start();
    }
    
    function showGameSelection() {
        gameContainer.classList.add('hidden');
        gameSelection.classList.remove('hidden');
        backToMenuBtn.classList.add('hidden');
        setCharacterState('idle');
        if (completedGames.size === 4) showFinalStats();
    }

    // === UI & STATE HANDLERS ===
    
    // ** NEW & IMPROVED ** Speech function using the best available voice
    const speak = (text) => {
        if (!audioInitialized || !('speechSynthesis' in window) || !text) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        if (speechVoice) {
            utterance.voice = speechVoice;
        }
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        window.speechSynthesis.cancel(); // Stop any previous speech
        window.speechSynthesis.speak(utterance);
    };

    const playSound = (sound) => { 
        if (!audioInitialized) return;
        sound.currentTime = 0; 
        sound.play().catch(error => console.error("Sound effect failed to play:", error)); 
    };
    
    function setCharacterState(state) {
        characterImg.src = characterGifs[state];
        characterImg.classList.remove('happy-animation', 'sad-animation');
    }
    
    const triggerCharacterAnimation = (state) => {
        setCharacterState(state);
        characterImg.classList.add(state === 'happy' ? 'happy-animation' : 'sad-animation');
        setTimeout(() => setCharacterState('idle'), 800);
    };

    function updateStatsBar() {
        const totalItems = wordList.length;
        const processedItems = gameTitle.innerText.includes("Nối Từ") ? (correctCount) : currentQuestionIndex;
        statsCorrect.textContent = correctCount;
        statsIncorrect.textContent = incorrectCount;
        statsProgress.textContent = `${processedItems}/${totalItems}`;
        const totalPlayed = correctCount + incorrectCount;
        const accuracy = totalPlayed > 0 ? Math.round((correctCount / totalPlayed) * 100) : 0;
        statsAccuracy.textContent = `${accuracy}%`;
    }
    
    const handleCorrectAnswer = (wordToSpeak) => {
        correctCount++;
        playSound(correctSound);
        triggerCharacterAnimation('happy');
        if (wordToSpeak) speak(wordToSpeak);
        updateStatsBar();
    };

    const handleIncorrectAnswer = (data) => {
        incorrectCount++;
        playSound(incorrectSound);
        triggerCharacterAnimation('sad');
        if (data && data.type && incorrectAnswers[data.type]) {
             incorrectAnswers[data.type].push({ question: data.question, userAnswer: data.userAnswer });
        }
        updateStatsBar();
    };

    // The rest of the file (game logic, etc.) remains largely the same, but I've re-pasted it all
    // for completeness and to ensure the robust `setTimeout` logic from the first fix is retained.

    // === GAME QUESTION GENERATORS & EVENT BINDING ===
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
            try {
                startMultipleChoiceGame();
            } catch (error) {
                console.error("Error starting next MC question:", error);
                alert("Đã xảy ra lỗi, không thể tiếp tục game. Vui lòng thử lại.");
            } finally {
                isProcessing = false;
            }
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
            try {
                startWritingGame();
            } finally {
                isProcessing = false;
            }
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
            try {
                startFillGame();
            } finally {
                isProcessing = false;
            }
        }, 1200);
    }
    
    // === END GAME & STATS ===
    function endGame(gameType) {
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
        backToMenuBtn.classList.remove('hidden');
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
