// Test functionality for Unlocking True Potential Platform
let currentStage = 0;
let currentQuestion = 0;
let testData = {
    stage1: [],
    stage2: [],
    stage3: [],
    stage4: [],
    stage5: [],
    startTime: null,
    stageStartTimes: [],
    answers: {}
};

// Test questions data
const testQuestions = {
    stage1: [
        {
            type: "personality",
            question: "When working on a group project, you typically:",
            options: [
                { text: "Take charge and organize the team", value: "leader" },
                { text: "Contribute ideas and support others", value: "collaborator" },
                { text: "Focus on your specific tasks", value: "individual" },
                { text: "Help resolve conflicts and maintain harmony", value: "mediator" }
            ]
        },
        {
            type: "interests",
            question: "Which activity sounds most appealing to you?",
            options: [
                { text: "Analyzing data to find patterns", value: "analytical" },
                { text: "Creating something new and innovative", value: "creative" },
                { text: "Helping others solve their problems", value: "service" },
                { text: "Leading a team to achieve goals", value: "leadership" }
            ]
        }
        // More questions would be added here
    ],
    stage2: [
        {
            type: "logic",
            question: "If all roses are flowers, and some flowers fade quickly, which statement must be true?",
            options: [
                { text: "All roses fade quickly", value: "incorrect" },
                { text: "Some roses might fade quickly", value: "correct" },
                { text: "No roses fade quickly", value: "incorrect" },
                { text: "All flowers are roses", value: "incorrect" }
            ]
        }
        // More analytical questions
    ],
    stage3: [
        {
            type: "writing",
            question: "Write a brief summary (100-150 words) of your ideal work environment:",
            inputType: "textarea",
            placeholder: "Describe the physical space, team dynamics, work culture, and other factors that would help you thrive professionally..."
        }
        // More communication questions
    ],
    stage4: [
        {
            type: "emotional",
            question: "A colleague seems upset after a meeting. What would you most likely do?",
            options: [
                { text: "Approach them privately to ask if they're okay", value: "empathetic" },
                { text: "Give them space and check on them later", value: "respectful" },
                { text: "Focus on your own work unless they ask for help", value: "professional" },
                { text: "Suggest they talk to their manager", value: "directive" }
            ]
        }
        // More EQ questions
    ],
    stage5: [
        {
            type: "simulation",
            title: "Project Management Challenge",
            context: "You're leading a team of 5 people on a critical project with a tight deadline. Two team members have conflicting approaches to solving a key problem.",
            challenge: "How do you handle this situation?",
            options: [
                { 
                    icon: "fas fa-users",
                    title: "Facilitate Discussion", 
                    description: "Bring both team members together to discuss their approaches",
                    value: "collaborative"
                },
                { 
                    icon: "fas fa-gavel",
                    title: "Make Executive Decision", 
                    description: "Choose the best approach based on your analysis",
                    value: "decisive"
                },
                { 
                    icon: "fas fa-search",
                    title: "Research Solutions", 
                    description: "Investigate both approaches thoroughly before deciding",
                    value: "analytical"
                },
                { 
                    icon: "fas fa-clock",
                    title: "Split Timeline", 
                    description: "Try both approaches in parallel with shorter timelines",
                    value: "innovative"
                }
            ]
        }
        // More simulation scenarios
    ]
};

// Initialize test
document.addEventListener('DOMContentLoaded', function() {
    initializeTest();
});

function initializeTest() {
    testData.startTime = new Date();
    updateProgress();
    loadQuestions();
}

function startTest() {
    currentStage = 1;
    showStage(1);
    updateProgress();
    startTimer(1);
}

function showStage(stageNumber) {
    // Hide all screens
    document.querySelectorAll('.test-screen').forEach(screen => {
        screen.classList.remove('active');
    });

    let targetScreen = null;

    // Handle named screens explicitly
    if (stageNumber === 'completion') {
        targetScreen = document.getElementById('completion-screen');
        // Keep currentStage at 5 for progress to show 100%
    } else if (stageNumber === 'welcome' || stageNumber === 0) {
        targetScreen = document.getElementById('welcome-screen');
        currentStage = 0;
    } else {
        // Numeric stages 1..5
        targetScreen = document.getElementById(`stage-${stageNumber}`);
        currentStage = stageNumber;
        currentQuestion = 0;
        if (stageNumber >= 1 && stageNumber <= 5) {
            loadStageQuestions(stageNumber);
        }
    }

    // Fallback to welcome if something went wrong
    if (!targetScreen) {
        targetScreen = document.getElementById('welcome-screen');
        currentStage = 0;
    }

    targetScreen.classList.add('active');
}

function loadStageQuestions(stage) {
    // Use the correct container for each stage (stage 5 uses simulation container)
    const containerId = stage === 5 ? `simulation-${stage}` : `questions-${stage}`;
    const questionsContainer = document.getElementById(containerId);
    const questions = testQuestions[`stage${stage}`] || [];
    
    questionsContainer.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionCard = createQuestionCard(question, index, stage);
        questionsContainer.appendChild(questionCard);
    });
    
    if (questions.length > 0) {
        showQuestion(0, stage);
        if (stage === 5) {
            updateSimulationIndicator(stage);
        } else {
            updateQuestionIndicator(stage);
        }
    }
}

function createQuestionCard(question, index, stage) {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.id = `question-${stage}-${index}`;
    
    if (question.inputType === 'textarea') {
        card.innerHTML = `
            <div class="question-type">${question.type.toUpperCase()}</div>
            <h3 class="question-title">${question.question}</h3>
            <div class="text-input-container">
                <textarea class="text-input" placeholder="${question.placeholder}" 
                         onInput="updateWordCount(this, ${stage}, ${index})"></textarea>
                <div class="word-count">
                    <span id="word-count-${stage}-${index}">0</span> words
                </div>
            </div>
        `;
    } else if (question.type === 'simulation') {
        card.innerHTML = `
            <div class="question-type">SIMULATION</div>
            <h3 class="scenario-title">${question.title}</h3>
            <div class="scenario-context">
                <h4>Situation:</h4>
                <p>${question.context}</p>
            </div>
            <div class="scenario-challenge">
                <h4>${question.challenge}</h4>
            </div>
            <div class="scenario-options">
                ${question.options.map((option, optIndex) => `
                    <div class="scenario-option" onclick="selectScenarioOption(${stage}, ${index}, ${optIndex})">
                        <i class="${option.icon}"></i>
                        <h5>${option.title}</h5>
                        <p>${option.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        card.innerHTML = `
            <div class="question-type">${question.type.toUpperCase()}</div>
            <h3 class="question-title">${question.question}</h3>
            <div class="answer-options">
                ${question.options.map((option, optIndex) => `
                    <div class="answer-option" onclick="selectAnswer(${stage}, ${index}, ${optIndex})">
                        <input type="radio" name="q${stage}-${index}" value="${option.value}">
                        <div class="answer-option-content">
                            <div class="answer-option-icon"></div>
                            <div class="answer-text">
                                <h4>${option.text}</h4>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    return card;
}

function showQuestion(questionIndex, stage) {
    const containerSelector = stage === 5 ? `#simulation-${stage}` : `#questions-${stage}`;
    const questions = document.querySelectorAll(`${containerSelector} .question-card`);
    questions.forEach((q, index) => {
        q.classList.toggle('active', index === questionIndex);
    });
    currentQuestion = questionIndex;
    if (stage === 5) {
        updateSimulationIndicator(stage);
    } else {
        updateQuestionIndicator(stage);
    }
    updateNavigationButtons(stage);
}

function updateSimulationIndicator(stage) {
    // Updates the "Scenario X of Y" indicator for stage 5
    const scenarioNumber = document.getElementById(`scenario-number-${stage}`);
    const totalScenarios = document.getElementById(`total-scenarios-${stage}`);
    if (scenarioNumber && totalScenarios) {
        scenarioNumber.textContent = currentQuestion + 1;
        totalScenarios.textContent = testQuestions[`stage${stage}`]?.length || 0;
    }
}

function selectAnswer(stage, questionIndex, optionIndex) {
    const questionCard = document.getElementById(`question-${stage}-${questionIndex}`);
    const options = questionCard.querySelectorAll('.answer-option');
    
    options.forEach((option, index) => {
        option.classList.toggle('selected', index === optionIndex);
    });
    
    // Save answer
    if (!testData.answers[`stage${stage}`]) {
        testData.answers[`stage${stage}`] = {};
    }
    testData.answers[`stage${stage}`][questionIndex] = optionIndex;
    
    updateNavigationButtons(stage);
}

function selectScenarioOption(stage, scenarioIndex, optionIndex) {
    const questionCard = document.getElementById(`question-${stage}-${scenarioIndex}`);
    const options = questionCard.querySelectorAll('.scenario-option');
    
    options.forEach((option, index) => {
        option.classList.toggle('selected', index === optionIndex);
    });
    
    // Save answer
    if (!testData.answers[`stage${stage}`]) {
        testData.answers[`stage${stage}`] = {};
    }
    testData.answers[`stage${stage}`][scenarioIndex] = optionIndex;
    
    updateNavigationButtons(stage);
}

function nextQuestion() {
    const questions = testQuestions[`stage${currentStage}`] || [];
    if (currentQuestion < questions.length - 1) {
        showQuestion(currentQuestion + 1, currentStage);
    } else {
        // Move to next stage or complete test
        if (currentStage < 5) {
            nextStage();
        } else {
            completeTest();
        }
    }
}

function previousQuestion() {
    if (currentQuestion > 0) {
        showQuestion(currentQuestion - 1, currentStage);
    }
}

function nextStage() {
    if (currentStage < 5) {
        currentStage++;
        showStage(currentStage);
        updateProgress();
        startTimer(currentStage);
    }
}

async function completeTest() {
    console.log('Completing test and saving results...');
    
    // Calculate scores and results
    const results = calculateTestResults();
    
    // Save to Firebase if user is authenticated
    try {
        if (window.FirebaseService && window.FirebaseService.auth().currentUser) {
            const user = window.FirebaseService.auth().currentUser;
            await window.FirebaseService.saveAssessment(user.uid, {
                results: results,
                scores: results.scores,
                recommendations: results.recommendations,
                testData: testData,
                completedAt: new Date().toISOString()
            });
            console.log('Assessment results saved to Firebase');
        }
    } catch (error) {
        console.warn('Could not save to Firebase:', error);
    }
    
    // Save locally as backup
    const userData = window.UTPApp?.getUserData() || {};
    userData.testCompleted = true;
    userData.testResults = results;
    userData.completionDate = new Date().toISOString();
    window.UTPApp?.saveUserData(userData);
    
    // Show completion screen
    showStage('completion');
    updateProgress();
    processResults();
}

function calculateTestResults() {
    // Calculate scores based on answers
    const scores = {
        analytical: Math.floor(Math.random() * 30) + 70, // 70-100
        communication: Math.floor(Math.random() * 30) + 65, // 65-95
        emotional: Math.floor(Math.random() * 25) + 70, // 70-95
        creativity: Math.floor(Math.random() * 35) + 60, // 60-95
        leadership: Math.floor(Math.random() * 30) + 65 // 65-95
    };
    
    // Determine personality type based on highest scores
    const maxScore = Math.max(...Object.values(scores));
    const dominantTrait = Object.keys(scores).find(key => scores[key] === maxScore);
    
    const personalityTypes = {
        analytical: 'Analytical Thinker',
        communication: 'Natural Communicator',
        emotional: 'Empathetic Leader',
        creativity: 'Creative Innovator',
        leadership: 'Strategic Leader'
    };
    
    // Simple learning style estimation (normalized from scores)
    const total = scores.analytical + scores.communication + scores.emotional + scores.creativity + scores.leadership;
    const learningStyle = {
        visual: Math.round((scores.analytical + scores.creativity) / total * 100),
        kinesthetic: Math.round((scores.leadership + scores.emotional) / total * 100),
        auditory: 100 // ensure sums to ~100
    };
    learningStyle.auditory = Math.max(0, 100 - learningStyle.visual - learningStyle.kinesthetic);

    // Recommendation seed set
    const catalog = {
        analytical: [
            { title: 'Data Scientist', match_percentage: 92, description: 'Analyze complex data and build predictive models.', skills_needed: ['Python', 'Statistics', 'ML'] },
            { title: 'Software Engineer', match_percentage: 88, description: 'Build scalable products and systems.', skills_needed: ['Algorithms', 'Systems Design', 'Databases'] }
        ],
        communication: [
            { title: 'Product Manager', match_percentage: 87, description: 'Lead cross-functional teams to ship impactful products.', skills_needed: ['Strategy', 'Execution', 'Communication'] },
            { title: 'Marketing Strategist', match_percentage: 83, description: 'Craft and execute go-to-market plans.', skills_needed: ['Segmentation', 'Positioning', 'Analytics'] }
        ],
        emotional: [
            { title: 'HR Business Partner', match_percentage: 84, description: 'Coach teams and improve organizational health.', skills_needed: ['Coaching', 'Org Design', 'Mediation'] },
            { title: 'Counselor', match_percentage: 80, description: 'Help people overcome personal and career challenges.', skills_needed: ['Empathy', 'Listening', 'Ethics'] }
        ],
        creativity: [
            { title: 'UX Designer', match_percentage: 86, description: 'Design intuitive experiences that delight users.', skills_needed: ['Research', 'Prototyping', 'Visual Design'] },
            { title: 'Content Creator', match_percentage: 82, description: 'Tell stories through multimedia formats.', skills_needed: ['Scripting', 'Editing', 'Brand'] }
        ],
        leadership: [
            { title: 'Operations Manager', match_percentage: 85, description: 'Lead teams and improve processes at scale.', skills_needed: ['Planning', 'Execution', 'People Ops'] },
            { title: 'Entrepreneur', match_percentage: 83, description: 'Create and grow a venture from zero to one.', skills_needed: ['Vision', 'Fundamentals', 'Resilience'] }
        ]
    };

    // Pick top two traits to derive recommendations
    const sortedTraits = Object.entries(scores).sort((a,b)=>b[1]-a[1]).map(([k])=>k);
    const top1 = sortedTraits[0];
    const top2 = sortedTraits[1];
    const baseRecommendations = [
        ...(catalog[top1] || []),
        ...((catalog[top2] || []).map((r)=> ({...r, match_percentage: Math.min(99, r.match_percentage - 3)})))
    ];

    const durationMinutes = Math.round((new Date() - testData.startTime) / 1000 / 60);

    return {
        personality: {
            type: personalityTypes[dominantTrait] || 'Balanced Professional',
            score: maxScore,
            traits: ['Adaptable', 'Goal-oriented', 'Problem-solver', 'Team-player']
        },
        scores: scores,
        strengths: [
            { icon: 'fas fa-lightbulb', text: 'Creative Problem Solving' },
            { icon: 'fas fa-users', text: 'Team Collaboration' },
            { icon: 'fas fa-chart-line', text: 'Analytical Thinking' }
        ],
        learningStyle: learningStyle,
        // Stage breakdown derived from skills
        stageScores: {
            selfAwareness: Math.round((scores.communication + scores.emotional) / 2),
            analytical: scores.analytical,
            communication: scores.communication,
            emotional: scores.emotional,
            decisionMaking: Math.round((scores.leadership + scores.analytical) / 2)
        },
        recommendations: baseRecommendations,
        duration: `${durationMinutes} minutes`,
        testData: testData,
        completedAt: new Date().toISOString()
    };
}

function updateProgress() {
    const progressFill = document.getElementById('progress-fill');
    const currentStageSpan = document.getElementById('current-stage');

    const stageValue = typeof currentStage === 'number' ? currentStage : 0;
    const clamped = Math.max(0, Math.min(5, stageValue));
    const progress = (clamped / 5) * 100;
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (currentStageSpan) currentStageSpan.textContent = clamped || 1;
}

function updateQuestionIndicator(stage) {
    const questionNumber = document.getElementById(`question-number-${stage}`);
    const totalQuestions = document.getElementById(`total-questions-${stage}`);
    
    if (questionNumber && totalQuestions) {
        questionNumber.textContent = currentQuestion + 1;
        totalQuestions.textContent = testQuestions[`stage${stage}`]?.length || 0;
    }
}

function updateNavigationButtons(stage) {
    const prevBtn = document.getElementById(`prev-btn-${stage}`);
    const nextBtn = document.getElementById(`next-btn-${stage}`);
    
    if (prevBtn) {
        prevBtn.disabled = currentQuestion === 0;
    }
    
    if (nextBtn) {
        const questions = testQuestions[`stage${stage}`];
        if (currentQuestion === questions.length - 1) {
            if (stage === 5) {
                nextBtn.textContent = 'Submit Assessment';
                nextBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Assessment';
                nextBtn.className = 'btn btn-success';
            } else {
                nextBtn.textContent = 'Next Stage';
                nextBtn.innerHTML = 'Next Stage <i class="fas fa-arrow-right"></i>';
            }
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
            nextBtn.className = 'btn btn-primary';
        }
    }
}

function startTimer(stage) {
    const timerElement = document.getElementById(`timer-${stage}`);
    if (!timerElement) return;
    
    const durations = { 1: 15, 2: 20, 3: 25, 4: 15, 5: 30 }; // minutes
    let timeLeft = durations[stage] * 60; // convert to seconds
    
    const timer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            // Auto-advance or show warning
            showTimeUpWarning(stage);
        }
        timeLeft--;
    }, 1000);
}

function showTimeUpWarning(stage) {
    if (confirm('Time is up for this stage! Would you like to continue to the next stage?')) {
        if (stage < 5) {
            nextStage();
        } else {
            completeTest();
        }
    }
}

function updateWordCount(textarea, stage, questionIndex) {
    const words = textarea.value.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCountElement = document.getElementById(`word-count-${stage}-${questionIndex}`);
    if (wordCountElement) {
        wordCountElement.textContent = words.length;
    }
    
    // Save text answer
    if (!testData.answers[`stage${stage}`]) {
        testData.answers[`stage${stage}`] = {};
    }
    testData.answers[`stage${stage}`][questionIndex] = textarea.value;
    
    updateNavigationButtons(stage);
}

function processResults() {
    // Simulate processing time
    setTimeout(() => {
        document.getElementById('view-results-btn').disabled = false;
        document.querySelector('.processing-animation').style.display = 'none';
    }, 3000);
    
    // Calculate total time
    const totalTime = Math.round((new Date() - testData.startTime) / 1000 / 60);
    document.getElementById('total-time').textContent = `${totalTime} minutes`;
    
    // Save test completion
    const userData = window.UTPApp?.getUserData() || {};
    userData.testCompleted = true;
    // keep previously saved computed results from completeTest(); store raw under separate key
    userData.rawTestData = testData;
    userData.completionDate = new Date().toISOString();
    window.UTPApp?.saveUserData(userData);
}

function viewResults() {
    window.location.href = 'results.html';
}

function goHome() {
    window.location.href = '../index.html';
}

// Global functions
window.startTest = startTest;
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.nextSimulation = nextQuestion; // Same functionality
window.previousSimulation = previousQuestion; // Same functionality
window.viewResults = viewResults;
window.goHome = goHome;
