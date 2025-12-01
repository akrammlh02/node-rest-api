// Global variables
let currentSession = null;
let currentQuestion = null;
let selectedAnswer = null;
let currentStreak = 0;
let maxStreak = 0;
let quizStartTime = null;

// Get data from DOM
const isLoggedIn = document.getElementById('userLoggedIn').value === 'true';
let languages = [];
try {
    const languagesData = document.getElementById('languagesData').getAttribute('data-languages');
    languages = JSON.parse(languagesData || '[]');
} catch (e) {
    console.error('Error parsing languages data:', e);
}

// Check for resume opportunities on load
document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn) {
        checkResumeOpportunities();
    }
});

async function checkResumeOpportunities() {
    if (!languages || languages.length === 0) return;

    for (const lang of languages) {
        try {
            const response = await fetch(`/quiz/api/progress?language=${lang.language}`);
            const data = await response.json();

            if (data.success && data.progress && data.progress.length > 0) {
                const badge = document.getElementById(`resume-badge-${lang.language}`);
                if (badge) {
                    badge.innerHTML = '<span class="resume-badge">📊 Continue</span>';
                }
            }
        } catch (error) {
            console.error('Error checking resume for', lang.language, error);
        }
    }
}

async function selectLanguage(language) {
    if (!isLoggedIn) {
        if (confirm('You need to login to take quizzes and save your progress. Go to login page?')) {
            location.href = '/login';
        }
        return;
    }

    showLoading();

    try {
        const response = await fetch('/quiz/api/session/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language })
        });

        const data = await response.json();

        if (data.success) {
            currentSession = data.session;
            currentStreak = 0;
            maxStreak = 0;
            quizStartTime = new Date();

            document.getElementById('quizLanguage').textContent = `${language} Quiz`;
            updateLiveStats();

            if (data.resumed) {
                showMessage('Resuming your previous quiz session!', 'info');
            }

            hideLoading();
            showScreen('quizScreen');
            loadNextQuestion();
        } else {
            alert(data.message || 'Failed to start quiz');
            hideLoading();
        }
    } catch (error) {
        console.error('Error starting quiz:', error);
        alert('Error connecting to server');
        hideLoading();
    }
}

async function loadNextQuestion() {
    if (!currentSession) return;

    showLoading();

    try {
        const response = await fetch(`/quiz/api/session/${currentSession.id}/question`);
        const data = await response.json();

        hideLoading();

        if (data.completed) {
            showResults();
            return;
        }

        if (data.success && data.question) {
            currentQuestion = data.question;
            selectedAnswer = null;
            displayQuestion(data.question, data.session);
            updateLiveStats();
        } else {
            alert(data.message || 'No more questions');
        }
    } catch (error) {
        console.error('Error loading question:', error);
        alert('Error loading question');
        hideLoading();
    }
}

function displayQuestion(question, sessionData) {
    const wrapper = document.getElementById('questionWrapper');

    const currentIndex = sessionData.current_index + 1;
    const total = sessionData.total;
    const progress = (currentIndex / total) * 100;

    // Update progress
    document.getElementById('progressText').textContent = `Question ${currentIndex}/${total}`;
    document.getElementById('progressBar').style.width = `${progress}%`;

    wrapper.innerHTML = `
    <div class="question-number">Question ${currentIndex} of ${total}</div>
    <div class="question-text">${question.question}</div>
    
    <div class="options-grid">
      <button class="option-button" onclick="selectOption('A')">
        <span class="option-letter">A</span>
        <span>${question.option_a}</span>
      </button>
      <button class="option-button" onclick="selectOption('B')">
        <span class="option-letter">B</span>
        <span>${question.option_b}</span>
      </button>
      <button class="option-button" onclick="selectOption('C')">
        <span class="option-letter">C</span>
        <span>${question.option_c}</span>
      </button>
      <button class="option-button" onclick="selectOption('D')">
        <span class="option-letter">D</span>
        <span>${question.option_d}</span>
      </button>
    </div>

    <div class="feedback-message" id="feedbackMessage"></div>

    <div class="action-buttons">
      <button class="btn-primary-custom" id="nextBtn" onclick="loadNextQuestion()" style="display: none;">
        <span class="material-symbols-outlined">arrow_forward</span>
        Next Question
      </button>
    </div>
  `;
}

function selectOption(option) {
    // Prevent multiple clicks
    if (document.querySelector('.option-button.disabled')) return;

    // Remove previous selection
    document.querySelectorAll('.option-button').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Select this option
    event.currentTarget.classList.add('selected');
    selectedAnswer = option;

    // Submit immediately
    submitAnswer();
}

async function submitAnswer() {
    if (!selectedAnswer || !currentQuestion || !currentSession) return;

    try {
        const response = await fetch(`/quiz/api/session/${currentSession.id}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question_id: currentQuestion.id,
                selected_answer: selectedAnswer
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update streak
            if (data.is_correct) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }

            showFeedback(data.is_correct, data.correct_answer);

            // Disable all option buttons
            document.querySelectorAll('.option-button').forEach(btn => {
                btn.classList.add('disabled');
                btn.onclick = null;
            });

            // Show next button
            document.getElementById('nextBtn').style.display = 'flex';

            // Update live stats
            currentSession.correct_count = data.is_correct ? (currentSession.correct_count || 0) + 1 : (currentSession.correct_count || 0);
            currentSession.incorrect_count = !data.is_correct ? (currentSession.incorrect_count || 0) + 1 : (currentSession.incorrect_count || 0);
            updateLiveStats();
        } else {
            alert(data.message || 'Error submitting answer');
        }
    } catch (error) {
        console.error('Error submitting answer:', error);
        alert('Error submitting answer');
    }
}

function showFeedback(isCorrect, correctAnswer) {
    const feedback = document.getElementById('feedbackMessage');
    const options = document.querySelectorAll('.option-button');

    options.forEach(btn => {
        const letter = btn.querySelector('.option-letter').textContent;

        if (letter === correctAnswer) {
            btn.classList.add('correct');
        }

        if (letter === selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    const streakText = currentStreak > 1 ? ` 🔥 ${currentStreak} streak!` : '';
    feedback.className = `feedback-message show ${isCorrect ? 'correct' : 'incorrect'}`;
    feedback.innerHTML = `
    <span class="material-symbols-outlined">${isCorrect ? 'check_circle' : 'cancel'}</span>
    <span>${isCorrect ? `Correct! Well done!${streakText}` : `Incorrect. The correct answer is ${correctAnswer}.`}</span>
  `;
}

function updateLiveStats() {
    const statsEl = document.getElementById('liveStats');
    if (!statsEl || !currentSession) return;

    const answered = (currentSession.correct_count || 0) + (currentSession.incorrect_count || 0);
    const score = answered > 0 ? Math.round(((currentSession.correct_count || 0) / answered) * 100) : 0;

    statsEl.innerHTML = `
    <div class="live-stat">
      <span class="stat-label">Score:</span>
      <span class="stat-value">${score}%</span>
    </div>
    <div class="live-stat">
      <span class="stat-label">Correct:</span>
      <span class="stat-value" style="color: #28a745;">${currentSession.correct_count || 0}</span>
    </div>
    <div class="live-stat">
      <span class="stat-label">Streak:</span>
      <span class="stat-value" style="color: #ff6b6b;">${currentStreak > 0 ? '🔥 ' + currentStreak : '-'}</span>
    </div>
  `;
}

async function showResults() {
    showLoading();

    try {
        const response = await fetch(`/quiz/api/session/${currentSession.id}/summary`);
        const data = await response.json();

        if (data.success) {
            const stats = data.stats;
            const timeSpent = quizStartTime ? Math.round((new Date() - quizStartTime) / 1000 / 60) : 0;

            document.getElementById('resultsLanguage').textContent = `${currentSession.language} Quiz Results`;
            document.getElementById('finalScore').textContent = `${Math.round(stats.score)}%`;
            document.getElementById('totalAnswered').textContent = stats.answered;
            document.getElementById('correctAnswers').textContent = stats.correct;
            document.getElementById('incorrectAnswers').textContent = stats.incorrect;

            // Add additional stats
            const additionalStats = document.getElementById('additionalStats');
            if (additionalStats) {
                additionalStats.innerHTML = `
          <div class="stat-box">
            <div class="stat-number" style="color: #ff6b6b;">🔥 ${maxStreak}</div>
            <div class="stat-label">Best Streak</div>
          </div>
          <div class="stat-box">
            <div class="stat-number" style="color: #667eea;">⏱️ ${timeSpent}</div>
            <div class="stat-label">Minutes</div>
          </div>
        `;
            }

            hideLoading();
            showScreen('resultsScreen');
        }
    } catch (error) {
        console.error('Error loading results:', error);
        hideLoading();
        alert('Error loading results');
    }
}

async function resetQuiz() {
    if (!currentSession) return;

    if (!confirm('Are you sure you want to restart this quiz from scratch? Your current progress will be saved as completed.')) {
        return;
    }

    showLoading();

    try {
        const response = await fetch(`/quiz/api/session/${currentSession.id}/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            currentSession = data.session;
            currentStreak = 0;
            maxStreak = 0;
            quizStartTime = new Date();

            updateLiveStats();
            hideLoading();
            loadNextQuestion();

            showMessage('Quiz reset! Starting from question 1...', 'success');
        } else {
            alert(data.message || 'Failed to reset quiz');
            hideLoading();
        }
    } catch (error) {
        console.error('Error resetting quiz:', error);
        alert('Error resetting quiz');
        hideLoading();
    }
}

function exitQuiz() {
    if (confirm('Are you sure you want to exit? Your progress is saved and you can resume later.')) {
        showScreen('welcomeScreen');
        currentSession = null;
        currentQuestion = null;
    }
}

function retakeQuiz() {
    location.reload();
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showLoading() {
    document.getElementById('loadingScreen').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingScreen').classList.remove('show');
}

function showMessage(message, type) {
    console.log(message);
    // Could add toast notifications here
}
