// Interactive Lesson JavaScript
let editor;
let currentLesson = null;
let currentHintIndex = 0;
let attemptsCount = 0;
let nextLessonId = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeEditor();
    loadLesson();
    setupEventListeners();

    // Set initial tab state based on device
    if (window.innerWidth <= 768) {
        switchTab('text');
    } else {
        switchTab('code');
    }

    // Console message listener
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'log') {
            logToConsole(event.data.content, 'log');
        } else if (event.data && event.data.type === 'error') {
            logToConsole(event.data.content, 'error');
        } else if (event.data && event.data.type === 'warn') {
            logToConsole(event.data.content, 'warn');
        }
    });
});

function logToConsole(message, type = 'log') {
    const outputContent = document.getElementById('outputContent');

    const logEntry = document.createElement('div');
    logEntry.className = `console-log log-${type}`;

    // Add timestamp or icon
    const icon = type === 'error' ? 'error' : (type === 'warn' ? 'warning' : 'chevron_right');

    logEntry.innerHTML = `
        <span class="material-symbols-rounded console-icon">${icon}</span>
        <span class="console-text">${escapeHtml(message)}</span>
    `;

    outputContent.appendChild(logEntry);
    outputContent.scrollTop = outputContent.scrollHeight;
}

function clearConsole() {
    const outputContent = document.getElementById('outputContent');
    outputContent.innerHTML = `
        <div class="console-log log-info" style="border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 8px;">
            <span class="material-symbols-rounded console-icon">terminal</span>
            <span class="console-text" style="font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Output</span>
        </div>
    `;
}

// Initialize CodeMirror editor
function initializeEditor() {
    const textarea = document.getElementById('codeEditor');
    editor = CodeMirror.fromTextArea(textarea, {
        mode: 'htmlmixed',
        theme: 'dracula',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        lineWrapping: true,
        styleActiveLine: true
    });

    editor.setSize('100%', '100%');
}

// Load lesson data
async function loadLesson() {
    try {
        const response = await fetch(`/interactive/api/lesson/${lessonId}`);
        const data = await response.json();

        if (data.success) {
            currentLesson = data.lesson;
            displayLesson(currentLesson);

            // Set editor mode based on programming language
            const modeMap = {
                'javascript': 'javascript',
                'html': 'htmlmixed',
                'css': 'css',
                'python': 'python'
            };
            editor.setOption('mode', modeMap[currentLesson.programming_language] || 'htmlmixed');

            // Set starter code
            if (currentLesson.starter_code) {
                editor.setValue(currentLesson.starter_code);
            }

            // Update file name
            // Update file name (Skipped for generic 'Code' tab)
            /*
            const fileExtensions = {
                'javascript': 'script.js',
                'html': 'index.html',
                'css': 'styles.css',
                'python': 'main.py'
            };
            document.getElementById('editorFileName').textContent =
                fileExtensions[currentLesson.programming_language] || 'code.txt';
            */

            // Setup hints
            if (currentLesson.hints && currentLesson.hints.length > 0) {
                document.getElementById('hintsSection').style.display = 'block';
                document.getElementById('hintsCount').textContent =
                    `${currentLesson.hints.length} available`;
            }

            // Update attempts count from submissions
            if (data.submissions && data.submissions.length > 0) {
                attemptsCount = data.submissions[0].attempts_count || 0;
                document.getElementById('attemptsCount').textContent =
                    `Attempts: ${attemptsCount}`;
            }
        } else {
            showError('Failed to load lesson');
        }
    } catch (error) {
        console.error('Error loading lesson:', error);
        showError('Error loading lesson');
    }
}

// Display lesson content
function displayLesson(lesson) {
    const contentDiv = document.getElementById('lessonContent');

    contentDiv.innerHTML = `
        <div class="lesson-header">
            <div class="lesson-badge">${lesson.programming_language}</div>
            <h1 class="lesson-title">${lesson.title}</h1>
        </div>

        ${lesson.text_content ? `
            <div class="lesson-explanation mb-4">
                <h2>
                    <span class="material-symbols-outlined">menu_book</span>
                    Explanation
                </h2>
                <div class="explanation-text typography">${lesson.text_content}</div>
            </div>
        ` : ''}
        
        <div class="lesson-description">
            <h2>
                <span class="material-symbols-outlined">assignment</span>
                Challenge
            </h2>
            <div class="challenge-text">${lesson.code_challenge || 'Complete this coding challenge'}</div>
        </div>
        
        ${(lesson.display_output || lesson.expected_output) ? `
            <div class="expected-output">
                <h3>
                    <span class="material-symbols-outlined">output</span>
                    Expected Output
                </h3>
                <pre><code>${escapeHtml(lesson.display_output || lesson.expected_output)}</code></pre>
            </div>
        ` : ''}
        
        ${lesson.test_cases && lesson.test_cases.length > 0 ? `
            <div class="test-cases">
                <h3>
                    <span class="material-symbols-outlined">fact_check</span>
                    Test Cases
                </h3>
                <div class="test-cases-list">
                    ${lesson.test_cases.map((tc, i) => `
                        <div class="test-case">
                            <strong>Test ${i + 1}:</strong>
                            <div>Input: <code>${escapeHtml(tc.input || 'N/A')}</code></div>
                            <div>Expected: <code>${escapeHtml(tc.output || 'N/A')}</code></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Submit code button
    document.getElementById('submitCodeBtn').addEventListener('click', submitCode);

    // Reset code button
    document.getElementById('resetCodeBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your code?')) {
            editor.setValue(currentLesson.starter_code || '');
        }
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        const currentTheme = editor.getOption('theme');
        const newTheme = currentTheme === 'dracula' ? 'material' : 'dracula';
        editor.setOption('theme', newTheme);

        const icon = document.querySelector('#themeToggle .material-symbols-outlined');
        icon.textContent = newTheme === 'dracula' ? 'dark_mode' : 'light_mode';
    });

    // Show hint button
    document.getElementById('showHintBtn').addEventListener('click', showNextHint);

    // Clear console button
    document.getElementById('clearConsoleBtn').addEventListener('click', clearConsole);

    // Close feedback modal
    document.getElementById('closeFeedbackModal').addEventListener('click', closeFeedbackModal);
    document.getElementById('feedbackModalCloseBtn').addEventListener('click', closeFeedbackModal);

    // Close modal when clicking outside
    document.getElementById('feedbackModal').addEventListener('click', (e) => {
        if (e.target.id === 'feedbackModal') {
            closeFeedbackModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const feedbackModal = document.getElementById('feedbackModal');
            if (feedbackModal.style.display === 'flex') {
                closeFeedbackModal();
            }
        }
    });

    // Back button
    document.getElementById('backButton').addEventListener('click', (e) => {
        e.preventDefault();
        if (currentLesson && currentLesson.path_id) {
            window.location.href = `/interactive/path/${currentLesson.path_id}`;
        } else {
            window.location.href = '/interactive/paths';
        }
    });

    // Feedback modal success buttons
    document.getElementById('feedbackModalStayBtn').addEventListener('click', () => {
        closeFeedbackModal();
    });

    document.getElementById('feedbackModalNextBtn').addEventListener('click', () => {
        if (nextLessonId) {
            window.location.href = `/interactive/lesson/${nextLessonId}`;
        } else {
            // Fallback if no next lesson (end of path)
            if (currentLesson && currentLesson.path_id) {
                window.location.href = `/interactive/path/${currentLesson.path_id}`;
            } else {
                window.location.href = '/interactive/paths';
            }
        }
    });
}

// Submit code for validation
async function submitCode() {
    const code = editor.getValue();

    if (!code.trim()) {
        showOutput('Please write some code before submitting!', 'error');
        return;
    }

    const submitBtn = document.getElementById('submitCodeBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="material-symbols-rounded rotating">sync</span>
        <span>AI Checking...</span>
    `;

    // On mobile, switch to code tab to show the execution/console
    if (window.innerWidth <= 768) {
        switchTab('code');
    }

    // Clear console for new run
    clearConsole();
    logToConsole('print output >', 'prompt');

    // For web languages, run in sandbox; for others, the AI will simulate stdout
    const webLangs = ['javascript', 'html', 'css'];
    if (webLangs.includes(currentLesson.programming_language)) {
        updatePreview();
    } else {
        logToConsole(`# Initializing ${currentLesson.programming_language} runtime environment...`, 'info');
        logToConsole(`# Executing script...`, 'info');
    }

    try {
        const response = await fetch('/interactive/api/submit-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lessonId: lessonId,
                code: code
            })
        });

        const data = await response.json();

        // If backend returned simulated stdout (for Python or other non-JS langs)
        if (data.stdout) {
            logToConsole(data.stdout, 'log');
        }

        if (data.success) {
            attemptsCount = data.attemptsCount;
            document.getElementById('attemptsCount').textContent =
                `Attempts: ${attemptsCount}`;

            if (data.isCorrect) {
                if (data.isNextMembershipLocked) {
                    // If next mission is locked, change button behavior
                    const nextBtn = document.getElementById('feedbackModalNextBtn');
                    nextBtn.innerHTML = `Upgrade to Unlock <span class="material-symbols-rounded align-middle">workspace_premium</span>`;
                    nextBtn.onclick = () => { window.location.href = '/interactive/paths#pricing'; };
                    showOutput(data.message, 'success');
                } else {
                    nextLessonId = data.nextLessonId;
                    showOutput(data.feedback, 'success', data.nextLessonId);
                }
            } else {
                showOutput(data.feedback, 'error');
            }
        } else {
            showOutput(data.message || 'Submission failed', 'error');
        }
    } catch (error) {
        console.error('Error submitting code:', error);
        showOutput('Error submitting code. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <span class="material-symbols-rounded">play_arrow</span>
            <span>Run</span>
        `;
    }
}

// Show feedback modal
function showOutput(message, type = 'info', nextLessonIdParam = null) {
    const feedbackModal = document.getElementById('feedbackModal');
    const feedbackModalContent = document.getElementById('feedbackModalContent');
    const feedbackModalTitle = document.getElementById('feedbackModalTitle');
    const feedbackModalSubtitle = document.getElementById('feedbackModalSubtitle');
    const feedbackModalIcon = document.getElementById('feedbackModalIcon');
    const feedbackModalIconSymbol = document.getElementById('feedbackModalIconSymbol');
    const errorActions = document.getElementById('feedbackModalErrorActions');
    const successActions = document.getElementById('feedbackModalSuccessActions');

    const classMap = {
        'success': 'feedback-success',
        'error': 'feedback-error',
        'info': 'feedback-info'
    };

    const iconMap = {
        'success': 'check_circle',
        'error': 'error',
        'info': 'info'
    };

    const titleMap = {
        'success': 'Mission Complete!',
        'error': 'Needs Improvement',
        'info': 'Information'
    };

    const subtitleMap = {
        'success': 'You\'ve unlocked the next stage!',
        'error': 'AI found some issues',
        'info': 'Code analysis result'
    };

    // Set modal type styling
    feedbackModal.className = `modal-overlay feedback-modal ${classMap[type] || ''}`;
    feedbackModalIcon.className = `feedback-modal-icon-wrapper ${classMap[type] || ''}`;
    feedbackModalIconSymbol.textContent = iconMap[type] || 'info';
    feedbackModalTitle.textContent = titleMap[type] || type;
    feedbackModalSubtitle.textContent = subtitleMap[type] || 'Code Review Result';

    // Show/hide appropriate action buttons
    if (type === 'success') {
        errorActions.style.display = 'none';
        successActions.style.display = 'flex';

        // Update next lesson ID if provided
        if (nextLessonIdParam) {
            nextLessonId = nextLessonIdParam;
        }
    } else {
        errorActions.style.display = 'flex';
        successActions.style.display = 'none';
    }

    // Format message to handle line breaks and code formatting
    let formattedMessage = escapeHtml(message);

    // Convert line breaks to <br> but preserve structure
    formattedMessage = formattedMessage.replace(/\n\n/g, '</p><p>');
    formattedMessage = formattedMessage.replace(/\n/g, '<br>');

    // Format issue lists with better styling
    formattedMessage = formattedMessage.replace(/🔍 Issues Found:/g, '<div class="issues-header"><span class="material-symbols-rounded">bug_report</span> Issues Found:</div>');
    formattedMessage = formattedMessage.replace(/(\d+\.\s)(.+?)(?=<br>|$)/g, '<div class="issue-item"><span class="issue-number">$1</span><span class="issue-text">$2</span></div>');

    // Highlight tips and suggestions
    formattedMessage = formattedMessage.replace(/💡 Tip:/g, '<div class="tip-header"><span class="material-symbols-rounded">lightbulb</span> Tip:</div>');
    formattedMessage = formattedMessage.replace(/⚠️/g, '<span class="material-symbols-rounded warning-icon">warning</span>');
    formattedMessage = formattedMessage.replace(/✅/g, '<span class="material-symbols-rounded success-icon">check_circle</span>');
    formattedMessage = formattedMessage.replace(/❌/g, '<span class="material-symbols-rounded error-icon">cancel</span>');

    // Wrap in paragraph if not already wrapped
    if (!formattedMessage.startsWith('<div') && !formattedMessage.startsWith('<p')) {
        formattedMessage = `<p>${formattedMessage}</p>`;
    }

    feedbackModalContent.innerHTML = formattedMessage;

    // Show modal with animation
    feedbackModal.style.display = 'flex';

    // Add animation class
    setTimeout(() => {
        feedbackModal.classList.add('modal-show');
    }, 10);

    // Trigger confetti for success
    if (type === 'success' && window.confetti) {
        setTimeout(() => {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
        }, 300);
    }
}

// Close feedback modal
function closeFeedbackModal() {
    const feedbackModal = document.getElementById('feedbackModal');
    feedbackModal.classList.remove('modal-show');
    setTimeout(() => {
        feedbackModal.style.display = 'none';
    }, 300);
}

// Show next hint
function showNextHint() {
    if (!currentLesson.hints || currentHintIndex >= currentLesson.hints.length) {
        showOutput('No more hints available!', 'info');
        return;
    }

    const hint = currentLesson.hints[currentHintIndex];
    const hintsList = document.getElementById('hintsList');

    const hintElement = document.createElement('div');
    hintElement.className = 'hint-item';
    hintElement.innerHTML = `
        <div class="hint-number">Hint ${currentHintIndex + 1}</div>
        <div class="hint-text">${hint}</div>
    `;

    hintsList.appendChild(hintElement);
    currentHintIndex++;

    // Update button
    const showHintBtn = document.getElementById('showHintBtn');
    if (currentHintIndex >= currentLesson.hints.length) {
        showHintBtn.disabled = true;
        showHintBtn.innerHTML = `
            <span class="material-symbols-outlined">check</span>
            <span>All Hints Shown</span>
        `;
    } else {
        showHintBtn.innerHTML = `
            <span class="material-symbols-outlined">help</span>
            <span>Show Next Hint (${currentLesson.hints.length - currentHintIndex} left)</span>
        `;
    }
}


// Global Tab Switch
window.switchTab = function (tab) {
    const isMobile = window.innerWidth <= 768;
    const panelLeft = document.querySelector('.panel-left');
    const panelRight = document.querySelector('.panel-right');
    const codeWrapper = document.getElementById('codeWrapper');
    const preview = document.getElementById('livePreview');
    const tabText = document.getElementById('tabText');
    const tabCode = document.getElementById('tabCode');
    const tabPreview = document.getElementById('tabPreview');

    // Remove active class from all tabs
    [tabText, tabCode, tabPreview].forEach(t => {
        if (t) t.classList.remove('active');
    });

    if (isMobile) {
        // Mobile behavior: Toggle between Instruction Panel and Editor Panel
        if (tab === 'text') {
            panelLeft.style.setProperty('display', 'flex', 'important');
            panelRight.style.setProperty('display', 'none', 'important');
            if (tabText) tabText.classList.add('active');
        } else {
            // "Code" tab on mobile shows Editor Panel (and hides Instruction Panel)
            panelLeft.style.setProperty('display', 'none', 'important');
            panelRight.style.setProperty('display', 'flex', 'important');

            // Ensure editor is showing, not frame
            if (codeWrapper) codeWrapper.style.display = 'block';
            if (preview) preview.style.display = 'none';

            if (tabCode) tabCode.classList.add('active');
            if (editor) {
                setTimeout(() => {
                    editor.refresh();
                    editor.focus();
                }, 50);
            }
        }
    } else {
        // Desktop behavior: Split screen always visible, tabs only switch right panel content
        // Panel displays are handled by CSS media queries on desktop (40/60)

        if (tab === 'code' || tab === 'text') { // 'text' acts like 'code' on desktop if somehow clicked
            if (codeWrapper) codeWrapper.style.display = 'block';
            if (preview) preview.style.display = 'none';
            if (tabCode) tabCode.classList.add('active');
            if (editor) {
                editor.refresh();
                editor.focus();
            }
        } else if (tab === 'preview') {
            if (codeWrapper) codeWrapper.style.display = 'none';
            if (preview) preview.style.display = 'block';
            if (tabPreview) tabPreview.classList.add('active');
            updatePreview();
        }
    }
}

function updatePreview() {
    if (!editor || !currentLesson) return;
    const code = editor.getValue();
    const frame = document.getElementById('livePreview');
    const doc = frame.contentDocument || frame.contentWindow.document;

    // Script to override console inside the iframe and send messages to parent
    const consoleOverride = `
        <script>
            (function() {
                const sendToParent = (type, content) => {
                    window.parent.postMessage({
                        type: type,
                        content: content
                    }, '*');
                };

                console.log = (...args) => sendToParent('log', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
                console.warn = (...args) => sendToParent('warn', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
                console.error = (...args) => sendToParent('error', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));

                window.onerror = (msg, url, line, col, error) => {
                    sendToParent('error', \`Runtime Error: \${msg} (Line \${line})\`);
                    return false;
                };
                
                // Catch unhandled rejections
                window.onunhandledrejection = (event) => {
                    sendToParent('error', \`Promise Rejection: \${event.reason}\`);
                };
            })();
        <\/script>
    `;

    let finalHtml = '';
    const lang = currentLesson.programming_language;

    if (lang === 'html') {
        finalHtml = consoleOverride + code;
    } else if (lang === 'javascript') {
        finalHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>JS Sandbox</title>
                </head>
                <body>
                    ${consoleOverride}
                    <script>${code}<\/script>
                </body>
            </html>
        `;
    } else {
        // For other languages, just show the code (or handle specifically if needed)
        return;
    }

    doc.open();
    doc.write(finalHtml);
    doc.close();
}

// Show error message
function showError(message) {
    const contentDiv = document.getElementById('lessonContent');
    contentDiv.innerHTML = `
        <div class="error-state">
            <span class="material-symbols-outlined">error</span>
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="window.history.back()" class="btn-primary">Go Back</button>
        </div>
    `;
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
