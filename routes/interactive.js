const express = require('express');
const router = express.Router();
const conn = require('../config/db');

const safeJSONParse = (data) => {
    if (!data) return [];
    if (typeof data === 'object') return data;
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('JSON Parse Error for data:', data);
        return [];
    }
};

const tierWeights = {
    'Free': 0,
    'Pro': 1,
    'VIP': 2
};

const hasAccess = (userTier, requiredTier) => {
    return tierWeights[userTier || 'Free'] >= tierWeights[requiredTier || 'Free'];
};

// Get all learning paths
router.get('/paths', (req, res) => {
    const sql = `
        SELECT lp.*, 
               COUNT(DISTINCT pl.lesson_id) as total_lessons
    FROM learning_paths lp
    LEFT JOIN path_lessons pl ON lp.id = pl.path_id
    WHERE lp.is_published = 1
    GROUP BY lp.id
    ORDER BY lp.created_at DESC
    `;

    conn.query(sql, (err, paths) => {
        if (err) {
            console.error('Error fetching learning paths:', err);
            return res.render('interactive-paths.hbs', {
                isLoggedIn: !!req.session.user,
                paths: []
            });
        }

        // Refetch user to get latest membership status
        if (req.session.user) {
            const userSql = 'SELECT * FROM client WHERE id = ?';
            conn.query(userSql, [req.session.user.id], (err, users) => {
                let userTier = 'Free';
                if (!err && users.length > 0) {
                    const dbUser = users[0];
                    // Update session with latest tier
                    req.session.user.membershipTier = dbUser.membership_tier || 'Free';
                    req.session.user.membership_status = dbUser.membership_status;
                    userTier = req.session.user.membershipTier;
                }

                const isAdmin = req.session.user.role === 'admin';
                const processedPaths = paths.map(path => ({
                    ...path,
                    isLocked: !isAdmin && !hasAccess(userTier, path.required_tier)
                }));

                res.render('interactive-paths.hbs', {
                    isLoggedIn: true,
                    user: req.session.user,
                    userTier: userTier,
                    paths: processedPaths || []
                });
            });
        } else {
            // Not logged in
            const processedPaths = paths.map(path => ({
                ...path,
                isLocked: true // Locked for guests usually, or check logic
            }));
            // Actually existing logic used !isAdmin && !hasAccess('Free', tier)
            const guestPaths = paths.map(path => ({
                ...path,
                isLocked: !hasAccess('Free', path.required_tier)
            }));

            res.render('interactive-paths.hbs', {
                isLoggedIn: false,
                user: null,
                userTier: 'Free',
                paths: guestPaths || []
            });
        }
    });
});

// Get specific learning path with roadmap
router.get('/path/:pathId', (req, res) => {
    const pathId = req.params.pathId;
    const clientId = req.session.user ? req.session.user.id : null;

    // Get path details
    const pathSql = 'SELECT * FROM learning_paths WHERE id = ?';
    conn.query(pathSql, [pathId], (err, paths) => {
        if (err || paths.length === 0) {
            return res.redirect('/interactive/paths');
        }

        const path = paths[0];
        const isAdmin = req.session.user && req.session.user.role === 'admin';
        const userTier = req.session.user ? req.session.user.membershipTier : 'Free';
        // We now allow viewing the roadmap even if locked, so users can see what's inside.
        // The individual lessons will be locked in the view.
        const isPathLocked = !isAdmin && !hasAccess(userTier, path.required_tier);

        // Get lessons in this path
        const lessonsSql = `
            SELECT l.*, pl.order_number, pl.is_locked,
                   ch.title as chapter_title
            FROM path_lessons pl
            INNER JOIN lessons l ON pl.lesson_id = l.lesson_id
            LEFT JOIN chapters ch ON l.chapitre_id = ch.id
            WHERE pl.path_id = ?
            ORDER BY pl.order_number ASC
        `;

        conn.query(lessonsSql, [pathId], (err, lessons) => {
            if (err) {
                console.error('Error fetching path lessons:', err);
                return res.redirect('/interactive/paths');
            }

            // Get user's progress if logged in
            if (clientId) {
                const lessonIds = lessons.map(l => l.lesson_id);

                if (lessonIds.length === 0) {
                    return res.render('interactive-roadmap.hbs', {
                        isLoggedIn: true,
                        user: req.session.user,
                        path,
                        lessons: []
                    });
                }

                // Simplified query: Direct check on progress table
                const progressSql = `SELECT lesson_id FROM progress WHERE client_id = ? AND lesson_id IN (?) AND completed = 1`;

                conn.query(progressSql, [clientId, lessonIds], (err, progressResults) => {
                    const completedSet = new Set();
                    if (!err && progressResults) {
                        progressResults.forEach(p => completedSet.add(p.lesson_id));
                    }

                    // Check if Admin (Role added in login)
                    const isAdmin = req.session.user.role === 'admin';

                    const processedLessons = lessons.map((lesson, index) => {
                        const isCompleted = completedSet.has(lesson.lesson_id);
                        const prevLessonCompleted = index > 0 ? completedSet.has(lessons[index - 1].lesson_id) : true;
                        const isFreeLesson = (lesson.is_free === 1);

                        // Membership Check: Locked if not admin, not free, not completed, AND (path is locked OR user is on Free tier)
                        const isMembershipLocked = !isAdmin && !isFreeLesson && !isCompleted && (isPathLocked || userTier === 'Free');

                        // Progression Check: Locked if not admin, not completed, not first, and previous not done
                        const isProgressionLocked = !isAdmin && !isCompleted && index > 0 && !prevLessonCompleted;

                        // Combined Unlock Status: !MembershipLocked AND !ProgressionLocked AND !ForcedLock
                        const isUnlocked = !isMembershipLocked && !isProgressionLocked && (lesson.is_locked !== 1);

                        return {
                            ...lesson,
                            progress: { completed: isCompleted },
                            isUnlocked: !!isUnlocked,
                            isMembershipLocked: !!isMembershipLocked,
                            isFree: isFreeLesson
                        };
                    });

                    res.render('interactive-roadmap.hbs', {
                        isLoggedIn: true,
                        user: req.session.user,
                        path,
                        isPathLocked,
                        lessons: processedLessons
                    });
                });
            } else {
                // Not logged in - show all lessons as locked except first (demo) or free
                const lessonsWithProgress = lessons.map((lesson, index) => {
                    const isFree = lesson.is_free === 1;
                    const isMembershipLocked = !isFree;
                    // For guests, only the first lesson can be unlocked (if it's free)
                    const isUnlocked = index === 0 && isFree;

                    return {
                        ...lesson,
                        progress: null,
                        isUnlocked,
                        isMembershipLocked,
                        isFree
                    };
                });

                res.render('interactive-roadmap.hbs', {
                    isLoggedIn: false,
                    path,
                    isPathLocked: true, // Always locked for guests
                    lessons: lessonsWithProgress
                });
            }
        });
    });
});

// Interactive lesson view
router.get('/lesson/:lessonId', (req, res) => {
    const lessonId = req.params.lessonId;
    const clientId = req.session.user ? req.session.user.id : null;
    const isAdmin = req.session.user && req.session.user.role === 'admin';

    if (!clientId) {
        return res.redirect('/login');
    }

    // Check if lesson is unlocked for this user
    const checkLessonSql = `
        SELECT pl.lesson_id, pl.path_id, pl.order_number, lp.required_tier, l.is_free
        FROM path_lessons pl
        JOIN learning_paths lp ON pl.path_id = lp.id
        JOIN lessons l ON pl.lesson_id = l.lesson_id
        WHERE pl.lesson_id = ?
    `;

    conn.query(checkLessonSql, [lessonId], (err, results) => {
        if (err) {
            console.error('Error checking lesson:', err);
            return res.redirect('/interactive/paths');
        }

        if (results.length === 0) {
            console.log('Lesson not found in path_lessons:', lessonId);
            return res.redirect('/interactive/paths');
        }

        const lesson = results[0];
        const pathId = lesson.path_id;
        const requiredTier = lesson.required_tier;
        const userTier = req.session.user ? req.session.user.membershipTier : 'Free';
        const orderNumber = parseInt(lesson.order_number) || 0;
        const isFirstLesson = orderNumber === 1;
        const isFreePreview = lesson.is_free === 1;

        console.log('--- ACCESS CHECK DEBUG ---');
        console.log('Lesson ID:', lessonId);
        console.log('User Tier:', userTier);
        console.log('Required Tier (Path):', requiredTier);
        console.log('Is Free Preview:', isFreePreview);

        // Membership Check: Bypass if admin, or lesson is free preview.
        // Otherwise, lock if user doesn't have path access OR user is on Free tier (all non-free missions require Pro+)
        if (!isAdmin && !isFreePreview && (!hasAccess(userTier, requiredTier) || userTier === 'Free')) {
            console.log('ACCESS DENIED: Membership (Pro/VIP) required for paid mission');
            return res.redirect('/interactive/paths#pricing');
        }

        // Check if lesson is completed (to allow replay)
        const checkCompletedSql = `SELECT completed FROM progress WHERE client_id = ? AND lesson_id = ? AND completed = 1`;
        conn.query(checkCompletedSql, [clientId, lessonId], (err, progressResults) => {
            const isAlreadyCompleted = progressResults && progressResults.length > 0;

            // If not first lesson, not admin, and not already completed, check if previous lesson is completed
            if (!isFirstLesson && !isAdmin && !isAlreadyCompleted) {
                // Get previous lesson ID
                const prevLessonSql = `
                SELECT lesson_id FROM path_lessons 
                WHERE path_id = ? AND order_number = ?
            `;
                conn.query(prevLessonSql, [pathId, orderNumber - 1], (err, prevResults) => {
                    if (err) {
                        console.error('Error getting previous lesson:', err);
                        return res.redirect(`/interactive/path/${pathId}`);
                    }

                    if (prevResults.length === 0) {
                        console.log('Previous lesson not found');
                        return res.redirect(`/interactive/path/${pathId}`);
                    }

                    const prevLessonId = prevResults[0].lesson_id;
                    // Check if previous lesson is completed
                    const progressSql = `SELECT completed FROM progress WHERE client_id = ? AND lesson_id = ? AND completed = 1`;
                    conn.query(progressSql, [clientId, prevLessonId], (err, progressResults) => {
                        if (err) {
                            console.error('Error checking progress:', err);
                            return res.redirect(`/interactive/path/${pathId}`);
                        }

                        const prevCompleted = progressResults && progressResults.length > 0;

                        if (!prevCompleted) {
                            console.log('Previous lesson not completed, lesson locked');
                            return res.redirect(`/interactive/path/${pathId}`);
                        }

                        // Previous lesson completed, allow access
                        console.log('Access granted - previous lesson completed');
                        res.render('interactive-lesson.hbs', {
                            isLoggedIn: true,
                            user: req.session.user,
                            lessonId
                        });
                    });
                });
            } else {
                // First lesson or admin, allow access
                console.log('Access granted - first lesson or admin');
                res.render('interactive-lesson.hbs', {
                    isLoggedIn: true,
                    user: req.session.user,
                    lessonId
                });
            }
        });
    });
});

// API: Get lesson data for interactive coding
router.get('/api/lesson/:lessonId', (req, res) => {
    const lessonId = req.params.lessonId;
    const clientId = req.session.user ? req.session.user.id : null;

    const sql = `
        SELECT l.*, pl.path_id, ch.title as chapter_title, ch.course_id,
               c.title as course_title
        FROM lessons l
        LEFT JOIN path_lessons pl ON l.lesson_id = pl.lesson_id
        LEFT JOIN chapters ch ON l.chapitre_id = ch.id
        LEFT JOIN courses c ON ch.course_id = c.course_id
        WHERE l.lesson_id = ?
    `;

    conn.query(sql, [lessonId], (err, lessons) => {
        if (err || lessons.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        const lesson = lessons[0];

        // Get user's previous submissions if logged in
        if (clientId) {
            const submissionsSql = `
                SELECT * FROM code_submissions 
                WHERE client_id = ? AND lesson_id = ?
                ORDER BY submission_date DESC
                LIMIT 5
            `;

            conn.query(submissionsSql, [clientId, lessonId], (err, submissions) => {
                res.json({
                    success: true,
                    lesson: {
                        ...lesson,
                        hints: safeJSONParse(lesson.hints),
                        test_cases: safeJSONParse(lesson.test_cases)
                    },
                    submissions: submissions || []
                });
            });
        } else {
            res.json({
                success: true,
                lesson: {
                    ...lesson,
                    hints: safeJSONParse(lesson.hints),
                    test_cases: safeJSONParse(lesson.test_cases)
                },
                submissions: []
            });
        }
    });
});

// API: Submit code for validation
router.post('/api/submit-code', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Please login to submit code'
        });
    }

    const { lessonId, code } = req.body;
    const clientId = req.session.user.id;

    if (!lessonId || !code) {
        return res.json({
            success: false,
            message: 'Lesson ID and code are required'
        });
    }

    // Get lesson validation data
    const lessonSql = `
        SELECT l.*, pl.path_id, l.programming_language as lang_context
        FROM lessons l
        LEFT JOIN path_lessons pl ON l.lesson_id = pl.lesson_id
        LEFT JOIN chapters ch ON l.chapitre_id = ch.id
        LEFT JOIN courses c ON ch.course_id = c.course_id
        WHERE l.lesson_id = ?
    `;

    conn.query(lessonSql, [lessonId], (err, lessons) => {
        if (err || lessons.length === 0) {
            console.error('Error finding lesson:', err);
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        const lesson = lessons[0];

        // Define the save function to be called after validation
        const proceedToSave = (isCorrect, feedback, stdout = null) => {
            // Get previous attempts count
            const countSql = `
                SELECT COUNT(*) as attempts 
                FROM code_submissions 
                WHERE client_id = ? AND lesson_id = ?
            `;

            conn.query(countSql, [clientId, lessonId], (err, countResult) => {
                const attemptsCount = countResult && countResult[0] ? countResult[0].attempts + 1 : 1;

                // Save submission
                const insertSql = `
                    INSERT INTO code_submissions 
                    (client_id, lesson_id, submitted_code, is_correct, attempts_count, execution_output)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;

                conn.query(insertSql, [
                    clientId,
                    lessonId,
                    code,
                    isCorrect,
                    attemptsCount,
                    feedback
                ], (err) => {
                    // If it's a foreign key error, it means the user is not a 'client' (e.g. Admin)
                    if (err && err.errno === 1452) {
                        return res.json({
                            success: true,
                            isCorrect,
                            feedback,
                            stdout,
                            attemptsCount,
                            message: isCorrect ? 'Congratulations! (Simulation Mode)' : 'Keep trying! (Simulation Mode)'
                        });
                    }

                    if (err) {
                        console.error('Error saving submission:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error saving submission'
                        });
                    }

                    // If correct, mark lesson as complete
                    if (isCorrect) {
                        const progressSql = `
                            INSERT INTO progress (client_id, lesson_id, completed, completation_date)
                            VALUES (?, ?, 1, NOW())
                            ON DUPLICATE KEY UPDATE completed = 1, completation_date = NOW()
                        `;

                        conn.query(progressSql, [clientId, lessonId], (err) => {
                            if (err) console.error('Error updating progress:', err);

                            // Find next lesson and check its access status
                            const nextLessonSql = `
                                SELECT pl_next.lesson_id, l.is_free, lp.required_tier
                                FROM path_lessons pl_curr
                                JOIN path_lessons pl_next ON pl_curr.path_id = pl_next.path_id
                                JOIN lessons l ON pl_next.lesson_id = l.lesson_id
                                JOIN learning_paths lp ON pl_next.path_id = lp.id
                                WHERE pl_curr.lesson_id = ?
                                AND pl_next.order_number > pl_curr.order_number
                                ORDER BY pl_next.order_number ASC
                                LIMIT 1
                            `;

                            conn.query(nextLessonSql, [lessonId], (err, nextResult) => {
                                const nextLesson = nextResult && nextResult.length > 0 ? nextResult[0] : null;
                                const nextLessonId = nextLesson ? nextLesson.lesson_id : null;

                                // Check if next lesson is membership locked
                                let isNextMembershipLocked = false;
                                if (nextLesson) {
                                    const userTier = req.session.user.membershipTier || 'Free';
                                    const nextIsFree = nextLesson.is_free === 1;
                                    const nextPathTier = nextLesson.required_tier;
                                    const isAdmin = req.session.user.role === 'admin';

                                    isNextMembershipLocked = !isAdmin && !nextIsFree && (!hasAccess(userTier, nextPathTier) || userTier === 'Free');
                                }

                                res.json({
                                    success: true,
                                    isCorrect,
                                    feedback,
                                    stdout,
                                    attemptsCount,
                                    nextLessonId,
                                    isNextMembershipLocked,
                                    message: isCorrect ?
                                        (isNextMembershipLocked ? 'Great job! You\'ve completed this free preview. Upgrade to Pro to continue the journey.' : 'Congratulations! You can now proceed to the next lesson.')
                                        : 'Keep trying! You can do it.'
                                });
                            });
                        });
                    } else {
                        res.json({
                            success: true,
                            isCorrect,
                            feedback,
                            stdout,
                            attemptsCount,
                            message: 'Keep trying! You can do it.'
                        });
                    }
                });
            });
        };

        // Perform AI Validation for ALL code submissions
        (async () => {
            try {
                // Check if API key is configured
                if (!process.env.GEMINI_API_KEY) {
                    throw new Error('GEMINI_API_KEY is not configured in environment variables');
                }

                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

                // List of models to try in order of preference
                // Using model names that are actually available for this API key
                const modelCandidates = [
                    "gemini-2.5-flash",           // Latest and most capable
                    "gemini-2.0-flash",           // Stable version
                    "gemini-2.0-flash-exp",       // Experimental but available
                    "gemini-flash-latest",         // Always points to latest
                    "gemini-2.0-flash-lite",       // Lighter version
                    "gemini-2.5-pro"              // Pro version as last resort
                ];

                let finalResult = null;
                let lastError = null;

                // Build context for AI analysis
                const solutionContext = lesson.solution_code ? `\n\nReference Solution:\n${lesson.solution_code}` : '';
                const expectedOutputContext = lesson.expected_output ? `\n\nExpected Output: ${lesson.expected_output}` : '';
                const testCasesContext = lesson.test_cases ? `\n\nTest Cases: ${JSON.stringify(safeJSONParse(lesson.test_cases))}` : '';

                // Helper for delay
                const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

                for (const modelName of modelCandidates) {
                    try {
                        const model = genAI.getGenerativeModel({ model: modelName });

                        const prompt = `
You are a helpful coding tutor analyzing a student's code submission. Your task is to:
1. Check if the code correctly solves the given challenge
2. Identify specific problems, errors, or issues in the code
3. Provide clear, constructive feedback pointing out WHERE the problem is and WHAT is wrong

Challenge/Task: ${lesson.code_challenge || 'Complete the coding challenge'}
Programming Language: ${lesson.programming_language || 'javascript'}
${solutionContext}
${expectedOutputContext}
${testCasesContext}

Student's Code:
\`\`\`${lesson.programming_language || 'javascript'}
${code}
\`\`\`

Analyze the code carefully:
- Check for syntax errors, logical errors, or missing functionality
- Compare with the expected solution/output if provided
- Identify specific lines or sections where problems occur
- If the code is incorrect, explain what's wrong and where the issue is located
- If the code is correct, confirm it solves the challenge properly
- Ignore minor formatting/style differences unless they affect correctness

Provide a JSON response with this exact structure (no markdown formatting, no backticks around JSON):
{
  "isCorrect": boolean,
  "feedback": "Detailed feedback explaining what's wrong or right. If incorrect, specify the line numbers or sections where problems occur. Be specific about the issue.",
  "problems": ["List of specific problems found"],
  "stdout": "The exact text output (stdout) that this code would produce if executed. If there is a runtime error, describe it here."
}
                        `;

                        const result = await model.generateContent(prompt);
                        const response = await result.response;
                        finalResult = response.text();
                        console.log(`✅ AI Success using model: ${modelName}`);
                        break; // Success!
                    } catch (e) {
                        const errorMsg = e.message || 'Unknown error';
                        const statusCode = e.status || e.statusCode || (e.response && e.response.status);

                        if (statusCode === 429) {
                            console.log(`⚠️  AI Model ${modelName} rate limited (429). Waiting 2s before trying next model...`);
                            await sleep(2000); // Wait 2s before trying next model
                        } else if (statusCode === 404) {
                            console.log(`⚠️  AI Model ${modelName} not found (404). Trying next model...`);
                        } else {
                            console.log(`⚠️  AI Model ${modelName} failed: ${errorMsg}`);
                        }

                        lastError = e;
                        // Continue to next model
                    }
                }

                if (!finalResult) {
                    throw lastError || new Error("All AI models failed");
                }

                // Clean markdown formatting
                let text = finalResult.replace(/```json|```/g, '').trim();
                // Remove any markdown code blocks
                text = text.replace(/^```[\s\S]*?```$/gm, '').trim();

                // Try to extract JSON from the response
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    text = jsonMatch[0];
                }

                let aiResult;
                try {
                    aiResult = JSON.parse(text);
                } catch (parseError) {
                    console.error('Failed to parse AI response as JSON:', parseError);
                    console.error('AI Response text:', text);
                    throw new Error('AI returned invalid response format. Please try again.');
                }

                // Validate AI response structure
                if (typeof aiResult.isCorrect !== 'boolean') {
                    console.error('AI response missing isCorrect field:', aiResult);
                    throw new Error('AI response is missing required fields');
                }

                // Format feedback with problems list if available
                let formattedFeedback = aiResult.feedback || 'No feedback provided.';
                if (aiResult.problems && Array.isArray(aiResult.problems) && aiResult.problems.length > 0) {
                    formattedFeedback += '\n\n🔍 Issues Found:\n';
                    aiResult.problems.forEach((problem, index) => {
                        formattedFeedback += `${index + 1}. ${problem}\n`;
                    });
                }

                proceedToSave(aiResult.isCorrect, formattedFeedback, aiResult.stdout);

            } catch (e) {
                console.error('AI Validation Failed:', e);
                console.error('Error details:', {
                    message: e.message,
                    stack: e.stack,
                    apiKeyExists: !!process.env.GEMINI_API_KEY
                });

                // Fallback to basic validation if AI fails
                let isCorrect = false;
                let feedback = '';

                // Provide specific error message based on error type
                const statusCode = e.status || e.statusCode || (e.response && e.response.status);

                if (e.message && e.message.includes('GEMINI_API_KEY')) {
                    feedback = '⚠️ AI service is not configured. Please contact the administrator.\n\n';
                } else if (e.message && e.message.includes('API key') || statusCode === 401 || statusCode === 403) {
                    feedback = '⚠️ Invalid or unauthorized API key. Please contact the administrator.\n\n';
                } else if (statusCode === 429) {
                    feedback = '⚠️ AI service is currently rate-limited. Please try again in a moment. Using fallback validation.\n\n';
                } else if (statusCode === 404) {
                    feedback = '⚠️ AI model not available. Using fallback validation.\n\n';
                } else {
                    feedback = `⚠️ AI service temporarily unavailable (${statusCode || 'unknown error'}). Using fallback validation.\n\n`;
                }

                // Try fallback validation based on validation_type
                switch (lesson.validation_type) {
                    case 'exact_match':
                        const normalizedCode = code.trim().replace(/\s+/g, ' ');
                        const normalizedSolution = lesson.solution_code ? lesson.solution_code.trim().replace(/\s+/g, ' ') : '';
                        isCorrect = normalizedCode === normalizedSolution;
                        feedback += isCorrect ? '✅ Code matches solution!' : '❌ Code does not match the solution.';
                        if (!isCorrect && lesson.solution_code) {
                            feedback += '\n\n💡 Tip: Compare your code with the expected solution.';
                        }
                        break;
                    case 'output_match':
                        isCorrect = lesson.expected_output ? code.includes(lesson.expected_output) : false;
                        feedback += isCorrect ? '✅ Output is correct!' : '❌ Output does not match expected result.';
                        if (!isCorrect && lesson.expected_output) {
                            feedback += `\n\n💡 Expected output should contain: "${lesson.expected_output}"`;
                        }
                        break;
                    case 'regex_match':
                        try {
                            const regex = new RegExp(lesson.expected_output, 'is');
                            isCorrect = regex.test(code);
                            feedback += isCorrect ? '✅ Pattern matches!' : '❌ Pattern does not match.';
                        } catch (err) {
                            isCorrect = false;
                            feedback += '❌ Validation error occurred.';
                        }
                        break;
                    default:
                        // Basic check
                        isCorrect = lesson.expected_output ? code.includes(lesson.expected_output) : false;
                        feedback += isCorrect ? '✅ Basic validation passed.' : '❌ Please check your code and try again.';
                        if (!isCorrect && lesson.code_challenge) {
                            feedback += `\n\n📝 Challenge: ${lesson.code_challenge}`;
                        }
                }

                const stdout = isCorrect ? (lesson.expected_output || 'Program executed successfully.') : 'Execution stopped due to incorrect logic.';
                proceedToSave(isCorrect, feedback, stdout);
            }
        })();
    });
});

// API: Get hint for a lesson
router.get('/api/hint/:lessonId/:hintIndex', (req, res) => {
    const { lessonId, hintIndex } = req.params;

    const sql = 'SELECT hints FROM lessons WHERE lesson_id = ?';
    conn.query(sql, [lessonId], (err, lessons) => {
        if (err || lessons.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        const hints = safeJSONParse(lessons[0].hints);
        const hint = hints[parseInt(hintIndex)] || null;

        res.json({
            success: true,
            hint,
            totalHints: hints.length
        });
    });
});

module.exports = router;
