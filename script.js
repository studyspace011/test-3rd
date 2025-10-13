class MCQTestApp {
    constructor() {
        this.storagePrefix = '12th_mcq_app_'; // seprate storage ke liye he ye.
        // --- Properties ---
        this.questions = [];
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.startTime = null;
        this.endTime = null;
        this.totalTimeLimit = 0;
        this.timeLeft = 0;
        this.timerInterval = null;
        this.subjectName = '';
        this.chapterName = '';
        this.userName = '';
        this.subjectsData = [];
        this.subjectChartInstance = null;
        this.scoreChartInstance = null;
        this.deferredInstallPrompt = null;

        this.isAnalyticsPage = document.getElementById('analytics-screen-body') !== null;
        
        if (this.isAnalyticsPage) {
            // If on analytics.html, only initialize analytics logic
            this.initializeAnalytics();
        } else {
            // Full initialization for index.html
            this.initializeElements();
            this.bindEvents();
            this.loadInitialData();
            this.registerServiceWorker();
            this.setupInstallPrompt();
        }
    }

    initializeElements() {
        // --- Screen elements ---
        this.screens = {
            home: document.getElementById('home-screen'),
            test: document.getElementById('test-screen'),
            results: document.getElementById('results-screen'),
            history: document.getElementById('history-screen')
        };
        
        // --- Home screen elements ---
        this.welcomeMessage = document.getElementById('welcome-message');
        this.nameInputSection = document.getElementById('name-input-section');
        this.userNameInput = document.getElementById('user-name-input');
        this.setNameBtn = document.getElementById('set-name-btn');
        this.testMainSection = document.getElementById('test-main-section');
        this.subjectSelect = document.getElementById('subject-select');
        this.chapterSelect = document.getElementById('chapter-select');
        this.questionCount = document.getElementById('question-count');
        this.testSetup = document.getElementById('test-setup');
        this.numQuestions = document.getElementById('num-questions');
        this.totalTimeLimitInput = document.getElementById('total-time-limit');
        this.shuffleQuestions = document.getElementById('shuffle-questions');
        this.shuffleOptions = document.getElementById('shuffle-options');
        this.startTestBtn = document.getElementById('start-test');
        this.viewHistoryBtn = document.getElementById('view-history');
        this.viewAnalyticsBtn = document.getElementById('view-analytics');
        this.installAppBtn = document.getElementById('install-app-btn');

        // --- Test screen elements ---
        this.timeLeftElement = document.getElementById('time-left');
        this.currentQuestion = document.getElementById('current-question');
        this.totalQuestions = document.getElementById('total-questions');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.submitTestBtn = document.getElementById('submit-test');

        // --- Results screen elements ---
        this.scoreElement = document.getElementById('score');
        this.totalScoreElement = document.getElementById('total-score');
        this.percentageElement = document.getElementById('percentage');
        this.percentageContainer = document.querySelector('.percentage');
        this.timeTakenElement = document.getElementById('time-taken');
        this.resultSubject = document.getElementById('result-subject');
        this.resultChapter = document.getElementById('result-chapter');
        this.questionsReview = document.getElementById('questions-review');
        this.newTestBtn = document.getElementById('new-test');
        this.exportResultsBtn = document.getElementById('export-results');

        // --- History screen elements ---
        this.historyList = document.getElementById('history-list');
        this.backToHomeBtn = document.getElementById('back-to-home');
        this.clearHistoryBtn = document.getElementById('clear-history');
    }

    bindEvents() {
        this.setNameBtn.addEventListener('click', () => this.setUserName());
        this.userNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setUserName();
        });

        this.subjectSelect.addEventListener('change', () => this.handleSubjectChange());
        this.chapterSelect.addEventListener('change', () => this.handleChapterChange());

        this.startTestBtn.addEventListener('click', () => this.startTest());
        this.prevBtn.addEventListener('click', () => this.previousQuestion());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.submitTestBtn.addEventListener('click', () => this.submitTest());
        this.newTestBtn.addEventListener('click', () => this.resetApp());
        
        this.viewHistoryBtn.addEventListener('click', () => this.showHistoryScreen());
        this.viewAnalyticsBtn.addEventListener('click', () => this.navigateToAnalytics());
        this.backToHomeBtn.addEventListener('click', () => this.showHomeScreen());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.exportResultsBtn.addEventListener('click', () => this.exportResults());
        this.installAppBtn.addEventListener('click', () => this.promptInstall());
    }
    
    // --- PWA Installation Logic ---
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredInstallPrompt = e;
            this.installAppBtn.classList.remove('hidden');
        });
    }

    promptInstall() {
        if (this.deferredInstallPrompt) {
            this.deferredInstallPrompt.prompt();
            this.deferredInstallPrompt.userChoice.then(choiceResult => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                this.deferredInstallPrompt = null;
                this.installAppBtn.classList.add('hidden');
            });
        }
    }
    
    // --- User & Initial Data ---
    setUserName() {
        const name = this.userNameInput.value.trim();
        if (name) {
            this.userName = name;
            localStorage.setItem(this.storagePrefix + 'user_name', name);
            this.updateWelcomeMessage();
            this.nameInputSection.classList.add('hidden');
            this.testMainSection.classList.remove('hidden');
        } else {
            alert('Please enter your name.');
        }
    }

    updateWelcomeMessage() {
        if (this.userName) {
            this.welcomeMessage.innerHTML = `👋 Hlw, <span style="color: #f1c40f;">${this.userName}</span>`;
        } else {
            this.welcomeMessage.textContent = '📝 Class 12th Self MCQ Test';
        }
    }

    async loadInitialData() {
        this.userName = localStorage.getItem(this.storagePrefix + 'user_name') || '';
        this.updateWelcomeMessage();

        if (this.userName) {
            this.nameInputSection.classList.add('hidden');
            this.testMainSection.classList.remove('hidden');
        }
        
        try {
            const response = await fetch('subjects.json');
            if (!response.ok) throw new Error('subjects.json not found.');
            const data = await response.json();
            this.subjectsData = data.विषय || [];
            this.populateSubjects();
        } catch (error) {
            console.error(error);
            alert('Error loading subjects: ' + error.message);
        }
    }
    
    // --- Subject/Chapter Handling ---
    populateSubjects() {
        this.subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
        this.subjectsData.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.नाम;
            option.textContent = subject.नाम;
            this.subjectSelect.appendChild(option);
        });
    }

    handleSubjectChange() {
        const selectedSubjectName = this.subjectSelect.value;

        // Toggle Urdu mode based on selection
        if (selectedSubjectName === 'Urdu') {
            document.body.classList.add('urdu-mode');
        } else {
            document.body.classList.remove('urdu-mode');
        }
        
        this.populateChapters();
    }
    
    populateChapters() {
        const selectedSubjectName = this.subjectSelect.value;
        this.chapterSelect.innerHTML = '<option value="">-- Select Chapter --</option>';
        this.chapterSelect.disabled = true;
        this.testSetup.classList.add('hidden');
        this.questionCount.textContent = '0';
        this.questions = [];
        
        if (selectedSubjectName) {
            const subject = this.subjectsData.find(s => s.नाम === selectedSubjectName);
            if (subject) {
                subject.अध्याय.forEach(chapter => {
                    const option = document.createElement('option');
                    option.value = chapter.csv_path;
                    option.textContent = chapter.नाम;
                    this.chapterSelect.appendChild(option);
                });
                this.chapterSelect.disabled = false;
            }
        }
    }

    async handleChapterChange() {
        const csvPath = this.chapterSelect.value;
        if (!csvPath) {
            this.testSetup.classList.add('hidden');
            this.questionCount.textContent = '0';
            this.questions = [];
            return;
        }

        try {
            const response = await fetch(csvPath);
            if (!response.ok) throw new Error(`CSV file (${csvPath}) could not be loaded.`);
            const csvText = await response.text();
            this.parseCSV(csvText);
            
            this.subjectName = this.subjectSelect.value;
            this.chapterName = this.chapterSelect.options[this.chapterSelect.selectedIndex].text;
            
            this.updateQuestionCount();
            this.testSetup.classList.remove('hidden');
        } catch (error) {
            console.error('CSV Loading Error:', error);
            alert('Error loading questions: ' + error.message);
        }
    }

    parseCSV(csvText) {
        // BUG FIX: Loop starts from 0 to include the first question.
        // README confirms no header row.
        const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
        this.questions = lines.map((line, index) => {
            const values = line.split('|').map(v => v.trim());
            if (values.length < 7) return null;

            return {
                id: values[0] || index + 1,
                question: values[1],
                options: [values[2], values[3], values[4], values[5]].filter(Boolean),
                answer: values[6],
                tags: values[7] || '',
                timeLimit: parseInt(values[8]) || 30
            };
        }).filter(q => q && q.question && q.options.length >= 2 && q.answer);
        
        if (this.questions.length === 0) {
            throw new Error('No valid questions found in the CSV file.');
        }
    }

    updateQuestionCount() {
        const count = this.questions.length;
        this.questionCount.textContent = count;
        this.numQuestions.max = count;
        this.numQuestions.value = Math.min(count, 10);
    }
    
    // --- Test Logic ---
    startTest() {
        if (this.questions.length === 0) {
            alert('Please select a chapter with questions.');
            return;
        }
        const numQs = parseInt(this.numQuestions.value);
        if (numQs < 1 || numQs > this.questions.length) {
            alert('Please select a valid number of questions.');
            return;
        }

        this.totalTimeLimit = parseInt(this.totalTimeLimitInput.value) * 60;
        this.timeLeft = this.totalTimeLimit;

        let selectedQuestions = [...this.questions];
        if (this.shuffleQuestions.checked) {
            this.shuffleArray(selectedQuestions);
        }
        selectedQuestions = selectedQuestions.slice(0, numQs);

        if (this.shuffleOptions.checked) {
            selectedQuestions.forEach(q => {
                this.shuffleArray(q.options);
            });
        }

        this.currentTest = selectedQuestions;
        this.userAnswers = new Array(numQs).fill(null);
        this.currentQuestionIndex = 0;
        this.startTime = new Date();

        this.showScreen('test');
        this.displayQuestion();
        this.updateProgress();
        this.startTimer();
    }

    displayQuestion() {
        const question = this.currentTest[this.currentQuestionIndex];
        this.questionText.textContent = question.question;
        this.optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            if (this.userAnswers[this.currentQuestionIndex] === option) {
                optionElement.classList.add('selected');
            }
            optionElement.addEventListener('click', () => this.selectOption(option));
            this.optionsContainer.appendChild(optionElement);
        });

        this.updateNavigationButtons();
    }

    selectOption(optionText) {
        this.userAnswers[this.currentQuestionIndex] = optionText;
        this.displayQuestion(); // Re-render to show selection
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
            this.updateProgress();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentTest.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
            this.updateProgress();
        }
    }
    
    submitTest() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.endTime = new Date();
        this.calculateResults();
        this.saveTestResult();
        this.showResultsScreen();
    }
    
    // --- Results & Celebration ---
    calculateResults() {
        let correct = 0;
        this.currentTest.forEach((q, index) => {
            if (this.userAnswers[index] === q.answer) {
                correct++;
            }
        });
        const total = this.currentTest.length;
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
        const timeTaken = Math.floor((this.endTime - this.startTime) / 1000);

        this.currentResult = {
            score: correct,
            total: total,
            percentage: percentage,
            timeTaken: timeTaken,
            questions: this.currentTest,
            answers: this.userAnswers,
            date: new Date().toISOString(),
            subject: this.subjectName,
            chapter: this.chapterName,
            userName: this.userName
        };
    }

    showResultsScreen() {
        this.showScreen('results');
        const result = this.currentResult;
        
        this.scoreElement.textContent = result.score;
        this.totalScoreElement.textContent = result.total;
        this.percentageElement.textContent = result.percentage;
        this.timeTakenElement.textContent = this.formatTime(result.timeTaken);
        this.resultSubject.textContent = result.subject;
        this.resultChapter.textContent = result.chapter;

        // Dynamic coloring for percentage
        this.percentageContainer.className = 'percentage'; // Reset classes
        if (result.percentage >= 80) {
            this.percentageContainer.classList.add('excellent');
            this.triggerConfetti();
        } else if (result.percentage >= 50) {
            this.percentageContainer.classList.add('good');
        } else {
            this.percentageContainer.classList.add('poor');
        }
        
        this.displayQuestionsReview();
    }
    
    triggerConfetti() {
        if (window.confetti) {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
        }
    }

    displayQuestionsReview() {
        this.questionsReview.innerHTML = '';
        this.currentResult.questions.forEach((question, index) => {
            const userAnswer = this.currentResult.answers[index] || 'Not Answered';
            const isCorrect = userAnswer === question.answer;

            const reviewElement = document.createElement('div');
            reviewElement.className = `question-review ${isCorrect ? 'correct' : 'incorrect'}`;
            reviewElement.innerHTML = `
                <h4>Q ${index + 1}: ${question.question}</h4>
                <div class="user-answer">Your Answer: ${userAnswer}</div>
                ${!isCorrect ? `<div class="correct-answer">Correct Answer: ${question.answer}</div>` : ''}
            `;
            this.questionsReview.appendChild(reviewElement);
        });
    }

    // --- History Management ---
    saveTestResult() {
        let history = JSON.parse(localStorage.getItem(this.storagePrefix + 'test_history') || '[]');
        history.unshift(this.currentResult); // Add to the beginning
        if (history.length > 50) history = history.slice(0, 50);
        localStorage.setItem(this.storagePrefix + 'test_history', JSON.stringify(history));
    }

    showHistoryScreen() {
        this.showScreen('history');
        this.displayHistory();
    }

    displayHistory() {
        const history = JSON.parse(localStorage.getItem('test_history') || '[]');
        this.historyList.innerHTML = '';
        if (history.length === 0) {
            this.historyList.innerHTML = '<p style="color:white; text-align:center;">No attempts recorded yet.</p>';
            return;
        }

        history.forEach((result, index) => {
            const date = new Date(result.date);
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <h4>${result.subject} - ${result.chapter}</h4>
                <div class="history-stats">
                    <span>Score: <strong>${result.score}/${result.total}</strong></span>
                    <span style="color: ${result.percentage >= 80 ? '#27ae60' : (result.percentage >= 50 ? '#3498db' : '#e74c3c')};">
                        <strong>${result.percentage}%</strong>
                    </span>
                </div>
                <div class="history-date">${date.toLocaleString('en-IN')}</div>
                <div class="history-item-actions">
                    <button class="secondary-btn view-details-btn" data-index="${index}">👁️ Review</button>
                    <button class="danger-btn delete-test-btn" data-index="${index}">🗑️ Delete</button>
                </div>
            `;
            this.historyList.appendChild(historyItem);
        });
        
        // Add event listeners after creation
        this.historyList.querySelectorAll('.view-details-btn').forEach(btn => 
            btn.addEventListener('click', (e) => this.viewTestDetails(e.target.dataset.index))
        );
        this.historyList.querySelectorAll('.delete-test-btn').forEach(btn => 
            btn.addEventListener('click', (e) => this.deleteTest(e.target.dataset.index))
        );
    }
    
    viewTestDetails(index) {
        const history = JSON.parse(localStorage.getItem('test_history') || '[]');
        if (history[index]) {
            this.currentResult = history[index];
            this.showResultsScreen();
        }
    }

    deleteTest(index) {
        if (confirm('Are you sure you want to delete this test record?')) {
            let history = JSON.parse(localStorage.getItem('test_history') || '[]');
            history.splice(index, 1);
            localStorage.setItem('test_history', JSON.stringify(history));
            this.displayHistory();
        }
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear ALL test history? This cannot be undone.')) {
            localStorage.removeItem(this.storagePrefix + 'test_history');
            this.displayHistory();
        }
    }

    // --- Analytics (for analytics.html) ---
    initializeAnalytics() {
        document.getElementById('back-from-analytics').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        // Use storage helper to get history
        const history = JSON.parse(this.getStorageItem('test_history') || '[]'); 
        if (history.length === 0) {
            document.getElementById('analytics-data-content').classList.add('hidden');
            document.getElementById('no-history-message').classList.remove('hidden');
            return;
        }

        const totalTests = history.length;
        const avgScore = Math.round(history.reduce((sum, r) => sum + r.percentage, 0) / totalTests);
        const bestScore = Math.max(...history.map(r => r.percentage));
        document.getElementById('total-tests').textContent = totalTests;
        document.getElementById('average-score').textContent = `${avgScore}%`;
        document.getElementById('best-score').textContent = `${bestScore}%`;

        // Subject Performance Chart (Bar Chart)
        const subjectStats = history.reduce((acc, { subject, percentage }) => {
            acc[subject] = acc[subject] || { total: 0, count: 0 };
            acc[subject].total += percentage;
            acc[subject].count++;
            return acc;
        }, {});
        
        // FIX 1: Change backgroundColor from #fff to a vibrant theme color
        new Chart(document.getElementById('subjectPerformanceChart'), {
            type: 'bar',
            data: {
                labels: Object.keys(subjectStats),
                datasets: [{
                    label: 'Average Score %',
                    data: Object.values(subjectStats).map(s => Math.round(s.total / s.count)),
                    backgroundColor: '#2ecc71', // Vibrant Green for bars
                    borderColor: '#27ae60',
                    borderWidth: 1
                }]
            },
            options: { 
                scales: { 
                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255, 255, 255, 0.2)' } }, // Added grid color fix
                    x: { grid: { color: 'rgba(255, 255, 255, 0.2)' } }
                } 
            }
        });

        // Score Trend Chart (Line Chart)
        const recentHistory = history.slice(0, 10).reverse();
        
        // FIX 2: Change borderColor and backgroundColor to theme colors
        new Chart(document.getElementById('scoreDistributionChart'), {
            type: 'line',
            data: {
                labels: recentHistory.map((_, i) => `Test ${totalTests - i}`),
                datasets: [{
                    label: 'Score %',
                    data: recentHistory.map(r => r.percentage),
                    borderColor: '#3498db', // Vibrant Blue for the line
                    backgroundColor: 'rgba(52, 152, 219, 0.4)', // Transparent Blue fill
                    fill: true,
                    tension: 0.2
                }]
            },
            options: { 
                scales: { 
                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255, 255, 255, 0.2)' } }, // Added grid color fix
                    x: { grid: { color: 'rgba(255, 255, 255, 0.2)' } }
                } 
            }
        });

        // Display Recent Tests Summary (No chart color change needed here)
        const list = document.getElementById('recent-tests-list');
        list.innerHTML = '';
        history.slice(0, 5).forEach(result => {
             list.innerHTML += `<div class="history-item"><h4>${result.subject} - ${result.chapter}</h4><div class="history-stats"><span>Score: <strong>${result.score}/${result.total}</strong></span><span><strong>${result.percentage}%</strong></span></div><div class="history-date">${new Date(result.date).toLocaleDateString()}</div></div>`;
        });

    // --- Navigation & Helpers ---
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
    }

    showHomeScreen() { this.showScreen('home'); }
    resetApp() { window.location.reload(); }
    navigateToAnalytics() { window.location.href = 'analytics.html'; }
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    updateTimerDisplay() { this.timeLeftElement.textContent = this.formatTime(this.timeLeft); }
    updateProgress() { this.currentQuestion.textContent = this.currentQuestionIndex + 1; }
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.totalQuestions.textContent = this.currentTest.length;
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) this.submitTest();
        }, 1000);
    }
    updateNavigationButtons() {
        this.prevBtn.disabled = this.currentQuestionIndex === 0;
        this.nextBtn.classList.toggle('hidden', this.currentQuestionIndex === this.currentTest.length - 1);
        this.submitTestBtn.classList.toggle('hidden', this.currentQuestionIndex !== this.currentTest.length - 1);
    }
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registered:', reg))
                .catch(err => console.log('Service Worker registration failed:', err));
        }
    }
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
    new MCQTestApp();

});

