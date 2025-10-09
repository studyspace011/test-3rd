class MCQTestApp {
    constructor() {
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
        this.chapterNumber = '';
        this.userName = '';
        this.subjectsData = []; 
        this.subjectChartInstance = null; // For Chart.js instance management
        this.scoreChartInstance = null;
        
        this.isAnalyticsPage = document.getElementById('analytics-screen-body') !== null;
        
        if (!this.isAnalyticsPage) {
            this.initializeElements();
            this.bindEvents();
            this.loadInitialData();
            this.registerServiceWorker();
        }
    }

    initializeElements() {
        // Screen elements
        this.screens = {
            home: document.getElementById('home-screen'),
            test: document.getElementById('test-screen'),
            results: document.getElementById('results-screen'),
            history: document.getElementById('history-screen')
        };
        
        // Home screen elements
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
        this.totalTimeLimitInput = document.getElementById('total-time-limit'); // Renamed to avoid clash
        this.shuffleQuestions = document.getElementById('shuffle-questions');
        this.shuffleOptions = document.getElementById('shuffle-options');
        this.startTestBtn = document.getElementById('start-test');
        this.viewHistoryBtn = document.getElementById('view-history');
        this.viewAnalyticsBtn = document.getElementById('view-analytics');

        // Test screen elements
        this.timeLeftElement = document.getElementById('time-left');
        this.currentQuestion = document.getElementById('current-question');
        this.totalQuestions = document.getElementById('total-questions');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.submitTestBtn = document.getElementById('submit-test');

        // Results screen elements
        this.scoreElement = document.getElementById('score');
        this.totalScoreElement = document.getElementById('total-score');
        this.percentageElement = document.getElementById('percentage');
        this.timeTakenElement = document.getElementById('time-taken');
        this.resultSubject = document.getElementById('result-subject');
        this.resultChapter = document.getElementById('result-chapter');
        this.questionsReview = document.getElementById('questions-review');
        this.newTestBtn = document.getElementById('new-test');
        this.exportResultsBtn = document.getElementById('export-results');

        // History screen elements
        this.historyList = document.getElementById('history-list');
        this.backToHomeBtn = document.getElementById('back-to-home');
        this.clearHistoryBtn = document.getElementById('clear-history');
    }

    bindEvents() {
        this.setNameBtn.addEventListener('click', () => this.setUserName());
        this.userNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setUserName();
        });

        this.subjectSelect.addEventListener('change', () => this.populateChapters());
        this.chapterSelect.addEventListener('change', () => this.handleChapterChange());

        this.startTestBtn.addEventListener('click', () => this.loadCSVAndStartTest());
        this.prevBtn.addEventListener('click', () => this.previousQuestion());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.submitTestBtn.addEventListener('click', () => this.submitTest());
        this.newTestBtn.addEventListener('click', () => this.showHomeScreen());
        
        this.viewHistoryBtn.addEventListener('click', () => this.showHistoryScreen());
        this.viewAnalyticsBtn.addEventListener('click', () => this.navigateToAnalytics());
        this.backToHomeBtn.addEventListener('click', () => this.showHomeScreen());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.exportResultsBtn.addEventListener('click', () => this.exportResults());
    }
    
    // --- User Name Logic ---

    setUserName() {
        const name = this.userNameInput.value.trim();
        if (name) {
            this.userName = name;
            localStorage.setItem('user_name', name);
            this.updateWelcomeMessage();
            
            // Animate transition
            this.nameInputSection.classList.add('hidden');
            this.testMainSection.classList.remove('hidden');
            this.testMainSection.style.opacity = '0';
            this.testMainSection.style.transform = 'translateY(20px)';
            setTimeout(() => {
                this.testMainSection.style.opacity = '1';
                this.testMainSection.style.transform = 'translateY(0)';
            }, 50);
        } else {
            alert('Please enter your name.');
        }
    }

    updateWelcomeMessage() {
        if (this.userName) {
            this.welcomeMessage.innerHTML = `👋 Hello, <span style="color: #f1c40f;">${this.userName}</span>`;
        } else {
            this.welcomeMessage.textContent = '📝 Firoz Self Objective Test';
        }
    }

    // --- Data Loading and Subject Selection ---

    async loadInitialData() {
        this.userName = localStorage.getItem('user_name') || '';
        this.updateWelcomeMessage();

        if (this.userName) {
            this.nameInputSection.classList.add('hidden');
            this.testMainSection.classList.remove('hidden');
        } else {
            this.nameInputSection.classList.remove('hidden');
            this.testMainSection.classList.add('hidden');
        }
        
        try {
            const response = await fetch('subjects.json');
            if (!response.ok) {
                throw new Error('subjects.json could not be loaded. Please ensure the file exists.');
            }
            const data = await response.json();
            this.subjectsData = data.विषय || [];
            this.populateSubjects();
        } catch (error) {
            console.error(error);
            alert('Error loading subject list: ' + error.message);
        }
    }
    
    populateSubjects() {
        this.subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';
        this.subjectsData.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.नाम;
            option.textContent = subject.नाम;
            this.subjectSelect.appendChild(option);
        });
    }

    populateChapters() {
        const selectedSubjectName = this.subjectSelect.value;
        this.chapterSelect.innerHTML = '<option value="">-- Select Chapter --</option>';
        this.chapterSelect.disabled = true;
        this.testSetup.classList.add('hidden');
        this.questionCount.textContent = '0';
        this.questions = []; // Clear current questions
        
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
            if (!response.ok) {
                throw new Error(`CSV file (${csvPath}) could not be loaded. Check your subjects.json paths.`);
            }
            const csvText = await response.text();
            this.parseCSV(csvText);
            
            // Set test metadata
            this.subjectName = this.subjectSelect.value;
            this.chapterNumber = this.chapterSelect.options[this.chapterSelect.selectedIndex].text;
            
            this.updateQuestionCount();
            this.showTestSetup();
        } catch (error) {
            console.error('CSV Loading Error:', error);
            alert('Error loading CSV file: ' + error.message);
            this.testSetup.classList.add('hidden');
            this.questionCount.textContent = '0';
            this.questions = [];
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            throw new Error('Invalid CSV format or empty file.');
        }

        this.questions = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split('|').map(v => v.trim());
            if (values.length >= 8) {
                const question = {
                    id: values[0] || i,
                    question: values[1] || `Question ${i}`,
                    options: [
                        values[2],
                        values[3],
                        values[4],
                        values[5]
                    ].filter(opt => opt.length > 0),
                    answer: values[6],
                    tags: values[7],
                    timeLimit: values[8] ? parseInt(values[8]) : 30
                };
                if (question.options.length >= 2 && question.answer.length > 0) {
                     this.questions.push(question);
                }
            }
        }

        if (this.questions.length === 0) {
            throw new Error('No questions found or CSV format is incorrect.');
        }
    }

    updateQuestionCount() {
        this.questionCount.textContent = this.questions.length;
        this.numQuestions.max = this.questions.length;
        this.numQuestions.value = Math.min(this.questions.length, 10);
    }

    showTestSetup() {
        this.testSetup.classList.remove('hidden');
        this.testSetup.style.opacity = '0';
        this.testSetup.style.transform = 'translateY(20px)';
        setTimeout(() => {
            this.testSetup.style.opacity = '1';
            this.testSetup.style.transform = 'translateY(0)';
        }, 50);
        this.numQuestions.max = this.questions.length;
        this.numQuestions.value = Math.min(this.questions.length, parseInt(this.numQuestions.value || 10));
    }

    // --- Test Logic ---

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    loadCSVAndStartTest() {
        if (this.questions.length === 0) {
            alert('Please select a chapter and ensure it has questions.');
            return;
        }
        this.startTest();
    }

    startTest() {
        const numQs = parseInt(this.numQuestions.value);
        if (numQs < 1 || numQs > this.questions.length) {
            alert('Please select a valid number of questions.');
            return;
        }

        this.totalTimeLimit = parseInt(this.totalTimeLimitInput.value) * 60; 
        this.timeLeft = this.totalTimeLimit;

        let selectedQuestions = [...this.questions];
        if (this.shuffleQuestions.checked) {
            selectedQuestions = this.shuffleArray(selectedQuestions);
        }
        selectedQuestions = selectedQuestions.slice(0, numQs);

        if (this.shuffleOptions.checked) {
            selectedQuestions = selectedQuestions.map(q => {
                const options = [...q.options];
                const answerText = q.answer;
                const shuffledOptions = this.shuffleArray(options);
                
                return { ...q, options: shuffledOptions, originalAnswer: answerText };
            });
        }

        this.currentTest = selectedQuestions;
        this.userAnswers = new Array(selectedQuestions.length).fill(null);
        this.currentQuestionIndex = 0;
        this.startTime = new Date();

        this.showTestScreen();
        this.displayQuestion();
        this.updateProgress();
        this.startTimer();
    }

    showTestScreen() {
        this.hideAllScreens();
        this.screens.test.classList.add('active');
        this.totalQuestions.textContent = this.currentTest.length;
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.submitTest();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeLeftElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    displayQuestion() {
        const question = this.currentTest[this.currentQuestionIndex];
        this.questionText.textContent = question.question;
        
        this.optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            optionElement.dataset.index = index;
            
            if (this.userAnswers[this.currentQuestionIndex] === index) {
                optionElement.classList.add('selected');
            }
            
            optionElement.addEventListener('click', () => {
                this.selectOption(index);
            });
            
            this.optionsContainer.appendChild(optionElement);
        });

        this.updateNavigationButtons();
    }

    selectOption(optionIndex) {
        this.userAnswers[this.currentQuestionIndex] = optionIndex;
        
        const options = this.optionsContainer.querySelectorAll('.option');
        options.forEach((opt, idx) => {
            opt.classList.toggle('selected', idx === optionIndex);
        });
    }

    updateProgress() {
        this.currentQuestion.textContent = this.currentQuestionIndex + 1;
    }

    updateNavigationButtons() {
        this.prevBtn.disabled = this.currentQuestionIndex === 0;
        this.nextBtn.disabled = this.currentQuestionIndex === this.currentTest.length - 1;
        
        if (this.currentQuestionIndex === this.currentTest.length - 1) {
            this.submitTestBtn.classList.remove('hidden');
        } else {
            this.submitTestBtn.classList.add('hidden');
        }
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
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.endTime = new Date();
        this.calculateResults();
        this.saveTestResult();
        this.showResultsScreen();
    }

    calculateResults() {
        let correct = 0;
        this.currentTest.forEach((question, index) => {
            const userAnswerIndex = this.userAnswers[index];
            if (userAnswerIndex !== null) {
                const userAnswer = question.options[userAnswerIndex];
                const correctAnswer = question.originalAnswer || question.answer; 
                if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
                    correct++;
                }
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
            questions: this.currentTest.map(q => ({
                question: q.question,
                options: q.options,
                answer: q.originalAnswer || q.answer, 
            })),
            answers: this.userAnswers,
            date: new Date().toISOString(),
            subject: this.subjectName,
            chapter: this.chapterNumber,
            totalTimeLimit: this.totalTimeLimit,
            userName: this.userName 
        };
    }

    saveTestResult() {
        let history = JSON.parse(localStorage.getItem('test_history') || '[]');
        history.push(this.currentResult);
        if (history.length > 50) {
            history = history.slice(-50);
        }
        localStorage.setItem('test_history', JSON.stringify(history));
    }

    showResultsScreen() {
        this.hideAllScreens();
        this.screens.results.classList.add('active');

        this.scoreElement.textContent = this.currentResult.score;
        this.totalScoreElement.textContent = this.currentResult.total;
        this.percentageElement.textContent = this.currentResult.percentage;
        this.timeTakenElement.textContent = this.formatTime(this.currentResult.timeTaken);
        this.resultSubject.textContent = this.currentResult.subject;
        this.resultChapter.textContent = this.currentResult.chapter;

        this.displayQuestionsReview();
    }

    displayQuestionsReview() {
        this.questionsReview.innerHTML = '';
        
        this.currentResult.questions.forEach((question, index) => {
            const userAnswerIndex = this.currentResult.answers[index];
            const userAnswer = userAnswerIndex !== null ? question.options[userAnswerIndex] : 'Not Answered';
            const isCorrect = userAnswerIndex !== null && 
                userAnswer.toLowerCase() === question.answer.toLowerCase();

            const reviewElement = document.createElement('div');
            reviewElement.className = `question-review ${isCorrect ? 'correct' : 'incorrect'}`;
            
            reviewElement.innerHTML = `
                <h4>Question ${index + 1}: ${question.question}</h4>
                <div class="user-answer">Your Answer: ${userAnswer}</div>
                <div class="correct-answer">Correct Answer: ${question.answer}</div>
            `;

            this.questionsReview.appendChild(reviewElement);
        });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // --- History Screen ---

    showHistoryScreen() {
        this.hideAllScreens();
        this.screens.history.classList.add('active');
        this.displayHistory();
    }

    displayHistory() {
        const history = JSON.parse(localStorage.getItem('test_history') || '[]');
        this.historyList.innerHTML = '';

        if (history.length === 0) {
            this.historyList.innerHTML = '<p>No attempts recorded yet.</p>';
            return;
        }

        const reversedHistory = [...history].reverse();

        reversedHistory.forEach((result, index) => {
            const date = new Date(result.date);
            const formattedDate = date.toLocaleDateString('en-IN') + ' ' + date.toLocaleTimeString('en-IN');
            const originalIndex = history.length - 1 - index; 

            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <h4>Test ${originalIndex + 1}: ${result.subject} - ${result.chapter}</h4>
                <div class="history-stats">
                    <span>Score: <strong style="color: ${result.percentage >= 60 ? '#27ae60' : '#e74c3c'};">${result.score}/${result.total}</strong></span>
                    <span>Percentage: <strong>${result.percentage}%</strong></span>
                </div>
                <div class="history-stats">
                    <span>Time Taken: ${this.formatTime(result.timeTaken)}</span>
                    <span>Questions: ${result.total}</span>
                </div>
                <div class="history-date">${formattedDate}</div>
                <div class="history-item-actions">
                    <button class="secondary-btn view-details-btn" data-index="${originalIndex}">👁️ View Details</button>
                    <button class="danger-btn delete-test-btn" data-index="${originalIndex}">🗑️ Delete</button>
                </div>
            `;

            this.historyList.appendChild(historyItem);
        });

        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.viewTestDetails(index);
            });
        });
        
        document.querySelectorAll('.delete-test-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteTest(index);
            });
        });
    }
    
    viewTestDetails(index) {
        const history = JSON.parse(localStorage.getItem('test_history') || '[]');
        const result = history[index];
        if (result) {
            this.currentResult = result;
            this.currentTest = result.questions; 
            this.userAnswers = result.answers;
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
        if (confirm('Are you sure you want to clear all test history?')) {
            localStorage.setItem('test_history', '[]');
            this.displayHistory();
        }
    }

    showHomeScreen() {
        this.hideAllScreens();
        if (this.userName) {
            this.testMainSection.classList.remove('hidden');
            this.nameInputSection.classList.add('hidden');
        } else {
            this.testMainSection.classList.add('hidden');
            this.nameInputSection.classList.remove('hidden');
        }
        this.screens.home.classList.add('active');
    }

    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
    }

    navigateToAnalytics() {
        window.location.href = 'analytics.html';
    }

    // --- Analytics Logic (Runs on analytics.html) ---
    initializeAnalytics() {
        const history = JSON.parse(localStorage.getItem('test_history') || '[]');
        
        if (history.length === 0) {
            document.getElementById('analytics-data-content').classList.add('hidden');
            document.getElementById('no-history-message').classList.remove('hidden');
            return;
        }

        // General Stats
        const totalTests = history.length;
        const totalPercentage = history.reduce((sum, result) => sum + result.percentage, 0);
        const averageScore = Math.round(totalPercentage / totalTests);
        const bestScore = history.length > 0 ? Math.max(...history.map(result => result.percentage)) : 0;
        
        document.getElementById('total-tests').textContent = totalTests;
        document.getElementById('average-score').textContent = `${averageScore}%`;
        document.getElementById('best-score').textContent = `${bestScore}%`;

        // Subject Performance Data
        const subjectStats = history.reduce((acc, result) => {
            const subject = result.subject || 'Unknown Subject';
            acc[subject] = acc[subject] || { total: 0, count: 0 };
            acc[subject].total += result.percentage;
            acc[subject].count++;
            return acc;
        }, {});

        const subjectLabels = Object.keys(subjectStats);
        const subjectAverages = subjectLabels.map(label => Math.round(subjectStats[label].total / subjectStats[label].count));

        if (this.subjectChartInstance) this.subjectChartInstance.destroy();
        this.subjectChartInstance = new Chart(document.getElementById('subjectPerformanceChart'), {
            type: 'bar',
            data: {
                labels: subjectLabels,
                datasets: [{
                    label: 'Average Percentage Score',
                    data: subjectAverages,
                    backgroundColor: '#3498db',
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
        
        // Score Distribution Data (Last 10 Tests)
        const recentHistory = history.slice(-10);
        const distributionLabels = recentHistory.map((_, i) => `Test ${totalTests - recentHistory.length + i + 1}`);
        const distributionData = recentHistory.map(r => r.percentage);

        if (this.scoreChartInstance) this.scoreChartInstance.destroy();
        this.scoreChartInstance = new Chart(document.getElementById('scoreDistributionChart'), {
            type: 'line',
            data: {
                labels: distributionLabels,
                datasets: [{
                    label: 'Percentage Score',
                    data: distributionData,
                    borderColor: '#27ae60',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
        
        // Recent Tests List 
        this.displayRecentTestsSummary(recentHistory.reverse());
    }
    
    displayRecentTestsSummary(recentHistory) {
        const list = document.getElementById('recent-tests-list');
        list.innerHTML = '';
        recentHistory.forEach(result => {
            const date = new Date(result.date).toLocaleString('en-IN');
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <h4>${result.subject} - ${result.chapter}</h4>
                <div class="history-stats">
                    <span>Score: ${result.score}/${result.total}</span>
                    <span>Percentage: <strong style="color: ${result.percentage >= 60 ? '#27ae60' : '#e74c3c'};">${result.percentage}%</strong></span>
                </div>
                <div class="history-date">${date}</div>
            `;
            list.appendChild(item);
        });
    }

    exportResults() {
        const result = this.currentResult;
        const csvContent = `data:text/csv;charset=utf-8,
Test Results
User Name,${this.userName || 'Unknown'}
Subject,${result.subject}
Chapter,${result.chapter}
Score,${result.score}/${result.total}
Percentage,${result.percentage}%
Time Taken,${this.formatTime(result.timeTaken)}
Total Time Limit,${this.formatTime(result.totalTimeLimit)}
Date,${new Date(result.date).toLocaleString('en-IN')}

Detailed Results
Question,Your Answer,Correct Answer,Status
${result.questions.map((q, i) => {
    const userAnswer = result.answers[i] !== null ? q.options[result.answers[i]] : 'Not Answered';
    const isCorrect = result.answers[i] !== null && 
        q.options[result.answers[i]].toLowerCase() === q.answer.toLowerCase();
    return `"${q.question.replace(/"/g, '""')}","${userAnswer.replace(/"/g, '""')}","${q.answer.replace(/"/g, '""')}","${isCorrect ? 'Correct' : 'Incorrect'}"`;
}).join('\n')}`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `mcq_test_result_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('analytics-screen-body')) {
        // Initialization for analytics.html
        const appInstance = new MCQTestApp();
        appInstance.initializeAnalytics();
        
        document.getElementById('back-from-analytics').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    } else {
        // Main app initialization on index.html, history.html, etc.
        window.mcqApp = new MCQTestApp();
    }
});

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

});
