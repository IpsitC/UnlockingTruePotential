// Career Simulation functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeSimulation();
});

// Simulation data
let simulationState = {
    currentScenario: 0,
    totalScenarios: 5,
    score: 0,
    timeRemaining: 45 * 60, // 45 minutes in seconds
    scenarioTime: 10 * 60, // 10 minutes per scenario
    answers: [],
    startTime: null,
    timer: null,
    scenarioTimer: null
};

// Mock scenario data
const scenarios = [
    {
        id: 1,
        title: "Data Quality Crisis",
        context: "You've just received a critical dataset for analysis, but upon initial inspection, you notice significant data quality issues that could impact your analysis.",
        situation: {
            context: "Your team is working on a high-priority project for the marketing department. They need insights from customer data to launch a campaign next week.",
            details: "The dataset contains 50,000 customer records, but you've discovered:\n• 15% missing values in key columns\n• Inconsistent date formats\n• Duplicate entries\n• Outliers that seem unrealistic",
            challenge: "The marketing team is expecting preliminary results by tomorrow, but the data quality issues need to be addressed first."
        },
        question: "What's your immediate course of action?",
        options: [
            {
                id: 'a',
                icon: 'fas fa-clock',
                title: "Proceed with available data",
                description: "Use the data as-is and add disclaimers about quality issues in your analysis",
                score: 2,
                feedback: "While meeting deadlines is important, proceeding with poor quality data could lead to incorrect insights and poor business decisions."
            },
            {
                id: 'b',
                icon: 'fas fa-tools',
                title: "Clean the data first",
                description: "Spend time cleaning the data properly, even if it means delaying the preliminary results",
                score: 4,
                feedback: "Excellent choice! Data quality is crucial for reliable insights. Communicating the delay with proper justification shows professionalism."
            },
            {
                id: 'c',
                icon: 'fas fa-users',
                title: "Escalate to stakeholders",
                description: "Immediately inform the marketing team about the data issues and propose a revised timeline",
                score: 5,
                feedback: "Perfect approach! Transparent communication about data quality issues and collaborative timeline adjustment demonstrates strong professional judgment."
            },
            {
                id: 'd',
                icon: 'fas fa-chart-line',
                title: "Partial analysis approach",
                description: "Analyze only the clean subset of data and clearly communicate the limitations",
                score: 3,
                feedback: "Good compromise, but consider that partial analysis might not represent the full picture needed for marketing decisions."
            }
        ]
    },
    {
        id: 2,
        title: "Stakeholder Presentation Challenge",
        context: "You need to present complex statistical findings to a mixed audience of technical and non-technical stakeholders.",
        situation: {
            context: "You've completed a comprehensive analysis showing that customer churn is primarily driven by three factors, with statistical significance.",
            details: "Your analysis reveals:\n• Price sensitivity (p < 0.001)\n• Customer service interactions (correlation: -0.67)\n• Product usage patterns (R² = 0.84)\n• Complex interaction effects between variables",
            challenge: "The audience includes the CEO, marketing director, customer service head, and your technical team lead."
        },
        question: "How do you structure your presentation?",
        options: [
            {
                id: 'a',
                icon: 'fas fa-chart-bar',
                title: "Focus on visualizations",
                description: "Use clear charts and graphs, minimize statistical jargon, focus on business impact",
                score: 5,
                feedback: "Excellent! Visual storytelling with business focus is perfect for mixed audiences. You can always dive deeper in Q&A."
            },
            {
                id: 'b',
                icon: 'fas fa-calculator',
                title: "Present full technical details",
                description: "Show all statistical tests, p-values, and methodology to demonstrate rigor",
                score: 2,
                feedback: "While technical rigor is important, overwhelming non-technical stakeholders with statistics can lose their attention and buy-in."
            },
            {
                id: 'c',
                icon: 'fas fa-layer-group',
                title: "Layered approach",
                description: "Start with high-level insights, then provide technical details for those interested",
                score: 4,
                feedback: "Good strategy! This allows you to engage everyone while having technical backup ready."
            },
            {
                id: 'd',
                icon: 'fas fa-lightbulb',
                title: "Story-driven presentation",
                description: "Frame findings as a customer journey story with data supporting each chapter",
                score: 4,
                feedback: "Creative approach! Storytelling can be very effective, just ensure the data insights remain clear and actionable."
            }
        ]
    },
    {
        id: 3,
        title: "Conflicting Priorities",
        context: "Two different departments have requested urgent analyses, both claiming highest priority, but you only have time for one.",
        situation: {
            context: "It's Monday morning and you receive two urgent requests that both need to be completed by Friday.",
            details: "Request 1 - Sales Team:\n• Revenue forecasting for Q4 planning\n• Affects budget allocation decisions\n• 3-day analysis requirement\n\nRequest 2 - Product Team:\n• User behavior analysis for feature launch\n• Affects product roadmap decisions\n• 4-day analysis requirement",
            challenge: "Both teams claim their request is more critical and both have valid business justifications."
        },
        question: "How do you handle this situation?",
        options: [
            {
                id: 'a',
                icon: 'fas fa-handshake',
                title: "Facilitate stakeholder meeting",
                description: "Organize a meeting with both teams to discuss priorities and find a solution together",
                score: 5,
                feedback: "Excellent leadership! Bringing stakeholders together to align on priorities shows maturity and prevents future conflicts."
            },
            {
                id: 'b',
                icon: 'fas fa-user-tie',
                title: "Escalate to manager",
                description: "Ask your manager to decide which project takes priority",
                score: 3,
                feedback: "Reasonable approach, but try to explore collaborative solutions first before escalating."
            },
            {
                id: 'c',
                icon: 'fas fa-clock',
                title: "First come, first served",
                description: "Work on whichever request came in first",
                score: 2,
                feedback: "While fair, this doesn't consider business impact. Priority should be based on strategic value, not timing."
            },
            {
                id: 'd',
                icon: 'fas fa-divide',
                title: "Split time equally",
                description: "Divide your time between both projects, delivering partial results for each",
                score: 2,
                feedback: "This might result in two incomplete analyses. Better to deliver one high-quality result than two mediocre ones."
            }
        ]
    },
    {
        id: 4,
        title: "Technical Challenge",
        context: "Your analysis is taking much longer than expected due to computational limitations and complex data processing requirements.",
        situation: {
            context: "You're working on a machine learning model with a large dataset (10M+ records) and the processing is taking days instead of hours.",
            details: "Current challenges:\n• Memory limitations causing crashes\n• Model training taking 12+ hours\n• Deadline is in 2 days\n• Results needed for board presentation",
            challenge: "You need to find a way to deliver results on time while maintaining analysis quality."
        },
        question: "What's your strategy to overcome this technical challenge?",
        options: [
            {
                id: 'a',
                icon: 'fas fa-random',
                title: "Use data sampling",
                description: "Work with a representative sample of the data to speed up processing",
                score: 4,
                feedback: "Smart approach! Proper sampling can maintain statistical validity while improving efficiency. Just ensure the sample is truly representative."
            },
            {
                id: 'b',
                icon: 'fas fa-server',
                title: "Request more resources",
                description: "Ask for access to more powerful computing resources or cloud infrastructure",
                score: 3,
                feedback: "Good thinking, but this might not be available in time. Always good to have backup plans."
            },
            {
                id: 'c',
                icon: 'fas fa-cogs',
                title: "Optimize the approach",
                description: "Simplify the model or use more efficient algorithms to reduce computational complexity",
                score: 5,
                feedback: "Excellent! Optimizing your approach shows technical maturity and problem-solving skills. Sometimes simpler models work just as well."
            },
            {
                id: 'd',
                icon: 'fas fa-calendar-times',
                title: "Request deadline extension",
                description: "Explain the technical challenges and ask for more time",
                score: 2,
                feedback: "While honesty is important, explore technical solutions first. Stakeholders prefer problem-solvers over problem-reporters."
            }
        ]
    },
    {
        id: 5,
        title: "Ethical Dilemma",
        context: "Your analysis reveals insights that could be used in ways that might not align with customer best interests.",
        situation: {
            context: "Your customer behavior analysis has identified patterns that could significantly increase revenue through targeted pricing strategies.",
            details: "Key findings:\n• Certain customer segments are less price-sensitive\n• Timing patterns show when customers are most likely to pay premium prices\n• Geographic data reveals market-specific opportunities",
            challenge: "The marketing team wants to use this for dynamic pricing that could disadvantage some customer groups, particularly those with limited options."
        },
        question: "How do you handle this ethical consideration?",
        options: [
            {
                id: 'a',
                icon: 'fas fa-balance-scale',
                title: "Raise ethical concerns",
                description: "Discuss the ethical implications with stakeholders and propose alternative approaches",
                score: 5,
                feedback: "Outstanding! Raising ethical concerns shows integrity and long-term thinking. This protects both customers and company reputation."
            },
            {
                id: 'b',
                icon: 'fas fa-chart-line',
                title: "Present data objectively",
                description: "Provide the analysis as requested and let business stakeholders make the decisions",
                score: 3,
                feedback: "While objectivity is important, as a data professional, you have a responsibility to highlight potential ethical implications."
            },
            {
                id: 'c',
                icon: 'fas fa-shield-alt',
                title: "Suggest safeguards",
                description: "Recommend implementing ethical guidelines and monitoring for the pricing strategy",
                score: 4,
                feedback: "Good approach! Proposing safeguards shows you're thinking about responsible implementation."
            },
            {
                id: 'd',
                icon: 'fas fa-user-friends',
                title: "Focus on customer value",
                description: "Reframe the analysis to emphasize creating value for customers rather than just extracting it",
                score: 5,
                feedback: "Excellent reframing! This approach aligns business goals with customer benefit, creating sustainable long-term value."
            }
        ]
    }
];

function initializeSimulation() {
    updateSimulationDisplay();
    startMainTimer();
}

function updateSimulationDisplay() {
    // Update progress bar
    const progress = (simulationState.currentScenario / simulationState.totalScenarios) * 100;
    document.getElementById('sim-progress').style.width = `${progress}%`;
    document.getElementById('sim-percentage').textContent = `${Math.round(progress)}%`;
    
    // Update stats
    document.getElementById('time-remaining').textContent = formatTime(simulationState.timeRemaining);
    document.getElementById('current-score').textContent = simulationState.score;
    document.getElementById('scenarios-completed').textContent = `${simulationState.currentScenario}/${simulationState.totalScenarios}`;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function startMainTimer() {
    simulationState.timer = setInterval(() => {
        simulationState.timeRemaining--;
        updateSimulationDisplay();
        
        if (simulationState.timeRemaining <= 0) {
            endSimulation();
        }
    }, 1000);
}

function startScenarioTimer() {
    simulationState.scenarioTime = 10 * 60; // Reset to 10 minutes
    
    simulationState.scenarioTimer = setInterval(() => {
        simulationState.scenarioTime--;
        document.getElementById('scenario-time').textContent = formatTime(simulationState.scenarioTime);
        
        if (simulationState.scenarioTime <= 0) {
            // Auto-advance if time runs out
            nextScenario();
        }
    }, 1000);
}

function startSimulation() {
    simulationState.startTime = new Date();
    simulationState.currentScenario = 0;
    
    showScreen('scenario-screen');
    loadScenario(0);
    startScenarioTimer();
}

function showScreen(screenId) {
    document.querySelectorAll('.sim-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function loadScenario(index) {
    if (index >= scenarios.length) {
        endSimulation();
        return;
    }
    
    const scenario = scenarios[index];
    
    // Update scenario info
    document.getElementById('scenario-title').textContent = scenario.title;
    document.getElementById('scenario-context').textContent = scenario.context;
    
    // Update scenario situation
    const situationDiv = document.getElementById('scenario-situation');
    situationDiv.innerHTML = `
        <div class="situation-context">
            <h4>Context</h4>
            <p class="situation-details">${scenario.situation.context}</p>
        </div>
        <div class="situation-challenge">
            <h4>The Situation</h4>
            <div class="situation-details">${scenario.situation.details.replace(/\n/g, '<br>')}</div>
        </div>
        <div class="situation-challenge">
            <h4>The Challenge</h4>
            <p class="situation-details">${scenario.situation.challenge}</p>
        </div>
    `;
    
    // Update question
    document.getElementById('scenario-question-text').textContent = scenario.question;
    
    // Load options
    const optionsDiv = document.getElementById('scenario-options');
    optionsDiv.innerHTML = scenario.options.map(option => `
        <div class="option-card" onclick="selectOption('${option.id}', ${option.score})" data-option="${option.id}">
            <div class="option-header">
                <div class="option-icon">
                    <i class="${option.icon}"></i>
                </div>
                <h4 class="option-title">${option.title}</h4>
            </div>
            <p class="option-description">${option.description}</p>
        </div>
    `).join('');
    
    // Update navigation
    document.getElementById('current-scenario').textContent = index + 1;
    document.getElementById('total-scenarios').textContent = scenarios.length;
    
    // Update button states
    document.getElementById('prev-scenario-btn').disabled = index === 0;
    document.getElementById('next-scenario-btn').disabled = true;
    
    simulationState.currentScenario = index;
    updateSimulationDisplay();
}

function selectOption(optionId, score) {
    // Remove previous selections
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Select current option
    document.querySelector(`[data-option="${optionId}"]`).classList.add('selected');
    
    // Store answer
    simulationState.answers[simulationState.currentScenario] = {
        scenarioId: scenarios[simulationState.currentScenario].id,
        optionId: optionId,
        score: score,
        timestamp: new Date()
    };
    
    // Enable next button
    document.getElementById('next-scenario-btn').disabled = false;
    
    // Update score
    simulationState.score += score;
    updateSimulationDisplay();
}

function nextScenario() {
    if (simulationState.currentScenario < scenarios.length - 1) {
        clearInterval(simulationState.scenarioTimer);
        loadScenario(simulationState.currentScenario + 1);
        startScenarioTimer();
    } else {
        endSimulation();
    }
}

function previousScenario() {
    if (simulationState.currentScenario > 0) {
        clearInterval(simulationState.scenarioTimer);
        loadScenario(simulationState.currentScenario - 1);
        startScenarioTimer();
    }
}

function endSimulation() {
    clearInterval(simulationState.timer);
    clearInterval(simulationState.scenarioTimer);
    
    showScreen('results-screen');
    displayResults();
}

function displayResults() {
    const totalPossibleScore = scenarios.reduce((sum, scenario) => {
        return sum + Math.max(...scenario.options.map(option => option.score));
    }, 0);
    
    const percentage = Math.round((simulationState.score / totalPossibleScore) * 100);
    
    // Update final score
    document.getElementById('final-score').textContent = `${percentage}%`;
    
    // Update performance grade
    let grade, description;
    if (percentage >= 90) {
        grade = 'Outstanding';
        description = 'You demonstrated exceptional professional judgment and decision-making skills.';
    } else if (percentage >= 80) {
        grade = 'Excellent';
        description = 'You showed strong professional skills and made sound decisions throughout.';
    } else if (percentage >= 70) {
        grade = 'Good';
        description = 'You performed well with room for improvement in some areas.';
    } else if (percentage >= 60) {
        grade = 'Satisfactory';
        description = 'You showed basic understanding but should focus on developing professional judgment.';
    } else {
        grade = 'Needs Improvement';
        description = 'Consider reviewing professional best practices and decision-making frameworks.';
    }
    
    document.getElementById('performance-grade').textContent = grade;
    document.getElementById('grade-description').textContent = description;
    
    // Update performance circle
    const circle = document.getElementById('performance-circle');
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    
    // Load scenario reviews
    loadScenarioReviews();
    
    // Animate skill bars
    setTimeout(() => {
        document.querySelectorAll('.skill-fill').forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }, 1000);
}

function loadScenarioReviews() {
    const reviewsList = document.getElementById('scenario-reviews-list');
    
    reviewsList.innerHTML = simulationState.answers.map((answer, index) => {
        const scenario = scenarios[index];
        const selectedOption = scenario.options.find(opt => opt.id === answer.optionId);
        const maxScore = Math.max(...scenario.options.map(opt => opt.score));
        const scorePercentage = Math.round((selectedOption.score / maxScore) * 100);
        
        return `
            <div class="review-item">
                <div class="review-header">
                    <h4 class="review-title">${scenario.title}</h4>
                    <span class="review-score">${scorePercentage}%</span>
                </div>
                <p class="review-feedback">${selectedOption.feedback}</p>
            </div>
        `;
    }).join('');
}

function retakeSimulation() {
    // Reset simulation state
    simulationState = {
        currentScenario: 0,
        totalScenarios: 5,
        score: 0,
        timeRemaining: 45 * 60,
        scenarioTime: 10 * 60,
        answers: [],
        startTime: null,
        timer: null,
        scenarioTimer: null
    };
    
    showScreen('welcome-screen');
    updateSimulationDisplay();
}

function viewDetailedFeedback() {
    window.UTPApp?.showNotification('Generating detailed feedback report...', 'info');
    
    setTimeout(() => {
        window.UTPApp?.showNotification('Detailed feedback available for download!', 'success');
    }, 2000);
}

function continueToNextLevel() {
    window.UTPApp?.showNotification('Unlocking advanced simulations...', 'success');
    
    setTimeout(() => {
        window.location.href = 'learning-path.html';
    }, 1500);
}

// Global functions
window.startSimulation = startSimulation;
window.selectOption = selectOption;
window.nextScenario = nextScenario;
window.previousScenario = previousScenario;
window.retakeSimulation = retakeSimulation;
window.viewDetailedFeedback = viewDetailedFeedback;
window.continueToNextLevel = continueToNextLevel;
