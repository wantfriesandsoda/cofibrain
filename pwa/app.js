// (c) 2026 Cofibrain
// Category config
const CATEGORIES = {
    english: { file: 'words_english.csv', label: 'English' },
    math:    { file: 'words_math.csv',    label: 'Mathematics' },
    ml:      { file: 'words_ml.csv',      label: 'Machine Learning' },
    cs:      { file: 'words_cs.csv',      label: 'Computer Science' },
    eng:     { file: 'words_eng.csv',     label: 'Engineering (Signal Processing)' },
    cuda:    { file: 'words_cuda.csv',   label: 'CUDA' }
};
let currentCategory = 'english';

// Quiz Variables
let wordList = [];
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let quizCompleted = false;
let feedbackActive = false;

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    if (sectionId === 'quiz') {
        renderQuestion();
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

async function clearCache() {
    const status = document.getElementById('cache-status');
    if (!('caches' in window)) {
        status.textContent = 'Cache API not supported in this browser.';
        return;
    }
    try {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
        status.textContent = 'Cache cleared — reloading…';
        setTimeout(() => location.reload(), 1000);
    } catch (err) {
        status.textContent = 'Failed to clear cache.';
    }
}

function updateNetworkStatus() {
    const statusEl = document.getElementById('status');
    const netStatus = document.getElementById('networkStatus');
    const isOnline = navigator.onLine;

    if (isOnline) {
        statusEl.textContent = 'Online';
        statusEl.className = 'status online';
        netStatus.textContent = 'Connected';
    } else {
        statusEl.textContent = 'Offline';
        statusEl.className = 'status offline';
        netStatus.textContent = 'Air-Gapped';
    }
}

// ====================== CSV + QUIZ GENERATION ======================

function parseCSVorig(text) {
    const lines = text.trim().split('\n');
    const words = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const commaIndex = line.indexOf(',');
        if (commaIndex === -1) continue;
        const word = line.slice(0, commaIndex).trim().replace(/"/g, '');
        const definition = line.slice(commaIndex + 1).trim().replace(/^"|"$/g, '');
        if (word && definition) words.push({ word, definition });
    }
    return words;
}


function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const words = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split("|||");

        // Must have at least word and definition
        if (parts.length < 2) continue;

        const word = parts[0].trim().replace(/^"|"$/g, "");
        const definition = parts.slice(1).join("|||").trim().replace(/^"|"$/g, "");

        if (word && definition) {
            words.push({
                word,
                definition
            });
        }
    }

    return words;
}











function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function generateQuestions(words, count = 10) {
    if (words.length < 4) return [];
    const selected = shuffle(words).slice(0, Math.min(count, words.length));
    return selected.map(entry => {
        const distractors = shuffle(words.filter(w => w.word !== entry.word))
            .slice(0, 3)
            .map(w => w.definition);
        const options = shuffle([entry.definition, ...distractors]);
        return {
            question: `What does "${entry.word}" mean?`,
            options,
            answer: entry.definition
        };
    });
}

async function loadQuestions() {
    wordList = [];
    questions = [];
    userAnswers = [];
    try {
        const csvFile = CATEGORIES[currentCategory].file;
        const response = await fetch(csvFile);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        wordList = parseCSV(text);
        questions = generateQuestions(wordList);
        userAnswers = new Array(questions.length).fill(null);
    } catch (error) {
        console.error('Failed to load CSV:', error);
    }
}

async function selectCategory(category) {
    currentCategory = category;
    localStorage.setItem('category', category);
    await loadQuestions();

    // Reset quiz state
    clearFeedback();
    document.getElementById('next-btn').textContent = 'Next';
    document.getElementById('submit-btn').textContent = 'Submit Quiz';
    currentQuestionIndex = 0;
    quizCompleted = false;
    document.getElementById('question-container').style.display = 'block';
    document.getElementById('quiz-controls').style.display = 'block';
    document.getElementById('results').style.display = 'none';

    const status = document.getElementById('category-status');
    status.textContent = `Category set to ${CATEGORIES[category].label} — quiz reset.`;
    setTimeout(() => { status.textContent = ''; }, 3000);

    if (document.getElementById('quiz').classList.contains('active')) {
        renderQuestion();
    }
}

// ====================== QUIZ DISPLAY ======================

function renderQuestion() {
    if (!questions.length) return;

    const q = questions[currentQuestionIndex];
    document.getElementById('question-text').textContent = `${currentQuestionIndex + 1}. ${q.question}`;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    q.options.forEach((option) => {
        const isSelected = userAnswers[currentQuestionIndex] === option;
        const label = document.createElement('label');
        label.className = 'option-label';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'answer';
        input.value = option;
        input.checked = isSelected;
        input.addEventListener('change', () => selectAnswer(option));
        label.appendChild(input);
        label.appendChild(document.createTextNode(' ' + option));
        optionsContainer.appendChild(label);
    });

    updateProgress();
    updateButtons();
}

function selectAnswer(answer) {
    userAnswers[currentQuestionIndex] = answer;
}

function updateProgress() {
    document.getElementById('progress').textContent =
        `Question ${currentQuestionIndex + 1} of ${questions.length}`;
}

function updateButtons() {
    document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    if (currentQuestionIndex === questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
}

// ====================== FEEDBACK ======================

function showAnswerFeedback() {
    feedbackActive = true;
    const q = questions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];
    const isCorrect = userAnswer === q.answer;

    document.querySelectorAll('#options-container input').forEach(i => i.disabled = true);
    document.getElementById('prev-btn').disabled = true;

    document.querySelectorAll('#options-container .option-label').forEach(label => {
        const input = label.querySelector('input');
        if (input.value === q.answer) {
            label.classList.add('option-correct');
        } else if (input.value === userAnswer && !isCorrect) {
            label.classList.add('option-incorrect');
        }
    });

    const feedback = document.getElementById('feedback');
    if (!userAnswer) {
        feedback.className = 'feedback feedback-wrong';
        feedback.innerHTML = `Skipped — the correct answer was: <strong>${q.answer}</strong>`;
    } else if (isCorrect) {
        feedback.className = 'feedback feedback-right';
        feedback.textContent = '✓ Correct!';
    } else {
        feedback.className = 'feedback feedback-wrong';
        feedback.innerHTML = `✗ Incorrect — the correct answer was: <strong>${q.answer}</strong>`;
    }
}

function clearFeedback() {
    feedbackActive = false;
    const feedback = document.getElementById('feedback');
    feedback.className = 'feedback';
    feedback.innerHTML = '';
}

function nextQuestion() {
    if (feedbackActive) {
        clearFeedback();
        document.getElementById('next-btn').textContent = 'Next';
        currentQuestionIndex++;
        renderQuestion();
        return;
    }
    showAnswerFeedback();
    document.getElementById('next-btn').textContent = 'Continue →';
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function submitQuiz() {
    if (feedbackActive) {
        clearFeedback();
        document.getElementById('submit-btn').textContent = 'Submit Quiz';
        quizCompleted = true;
        showResults();
        return;
    }
    if (userAnswers.some(answer => answer === null)) {
        if (!confirm('You have unanswered questions. Submit anyway?')) return;
    }
    showAnswerFeedback();
    document.getElementById('submit-btn').textContent = 'See Results →';
}

function calculateScore() {
    let score = 0;
    questions.forEach((q, index) => {
        if (userAnswers[index] === q.answer) score++;
    });
    return score;
}

function showResults() {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);

    document.getElementById('question-container').style.display = 'none';
    document.getElementById('quiz-controls').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    document.getElementById('score').innerHTML = `${score} / ${questions.length} (${percentage}%)`;

    const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    history.push({ date: new Date().toLocaleString(), score, total: questions.length, percentage });
    localStorage.setItem('quizHistory', JSON.stringify(history.slice(-5)));
}

function restartQuiz() {
    clearFeedback();
    document.getElementById('next-btn').textContent = 'Next';
    document.getElementById('submit-btn').textContent = 'Submit Quiz';

    questions = generateQuestions(wordList);
    currentQuestionIndex = 0;
    userAnswers = new Array(questions.length).fill(null);
    quizCompleted = false;

    document.getElementById('question-container').style.display = 'block';
    document.getElementById('quiz-controls').style.display = 'block';
    document.getElementById('results').style.display = 'none';

    renderQuestion();
}

// ====================== INITIALIZATION ======================
window.onload = function() {
    const savedDark = localStorage.getItem('darkMode') === 'true';
    if (savedDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkMode').checked = true;
    }

    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker failed', err));
    }

    currentCategory = localStorage.getItem('category') || 'english';



const list = document.getElementById("categoryList");

if (list)
    list.value = currentCategory;










    loadQuestions().then(() => {
        showSection('home');
    });
};
