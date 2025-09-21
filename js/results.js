// Results page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Try local results immediately for fast UX
    const hadLocal = loadLocalResultsOrPrompt();
    // Proceed with remote initialization in background
    initializeFirebaseResults();
    if (!hadLocal) {
        // Attempt to load remote if local wasn't available
        loadRealUserResults();
    }
    initializeCharts();
    initializeScoreCircles();
});

// Global holder for currently displayed results
let currentResults = null;

// Chart.js plugin to draw percentage labels on doughnut slices
const DoughnutPctPlugin = {
    id: 'doughnutPct',
    afterDatasetsDraw(chart, args, pluginOptions) {
        const { ctx } = chart;
        const dataset = chart.data?.datasets?.[0];
        const meta = chart.getDatasetMeta(0);
        if (!dataset || !meta) return;
        const values = (dataset.data || []).map(v => Number(v) || 0);
        const total = values.reduce((a, b) => a + b, 0);
        if (!total) return;

        ctx.save();
        ctx.font = (pluginOptions && pluginOptions.font) || 'bold 12px Inter, Arial, sans-serif';
        ctx.fillStyle = (pluginOptions && pluginOptions.color) || '#111827';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const minPct = (pluginOptions && pluginOptions.minPercentageToShow) || 3; // hide tiny slivers
        meta.data.forEach((arc, i) => {
            const value = values[i];
            if (!value) return;
            const pct = (value / total) * 100;
            if (pct < minPct) return;
            const pos = arc.tooltipPosition();
            ctx.fillText(`${Math.round(pct)}%`, pos.x, pos.y);
        });

        ctx.restore();
    }
};

if (typeof Chart !== 'undefined' && Chart.register) {
    Chart.register(DoughnutPctPlugin);
}

// Initialize Firebase for results page
async function initializeFirebaseResults() {
    try {
        if (window.FirebaseService) {
            const initialized = await window.FirebaseService.initialize();
            if (initialized) {
                console.log('Firebase initialized for results page');
                
                // Set up auth state listener
                const auth = window.FirebaseService.auth();
                if (auth) {
                    auth.onAuthStateChanged(async (user) => {
                        if (user) {
                            console.log('User authenticated, loading results');
                            await loadRealUserResults(user.uid);
                        } else {
                            console.log('User not authenticated, loading local results if available');
                            loadLocalResultsOrPrompt();
                        }
                    });
                }
            }
        } else {
            // No Firebase available, try local results
            console.log('Firebase not available, loading local results');
            loadLocalResultsOrPrompt();
        }
    } catch (error) {
        console.error('Failed to initialize Firebase for results:', error);
        // Fallback to local or mock data
        loadLocalResultsOrPrompt();
    }
}

// Load real user results from Firebase and generate AI recommendations
async function loadRealUserResults(uid = null) {
    try {
        // Get current user if uid not provided
        if (!uid) {
            const auth = window.FirebaseService.auth();
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('No authenticated user');
            }
            uid = currentUser.uid;
        }

        console.log('Loading real results for user:', uid);
        
        // Get assessment results from Firestore
        const assessmentData = await window.FirebaseService.getAssessment(uid);
        
        if (assessmentData) {
            console.log('Assessment data found:', assessmentData);
            
            // Generate AI-powered career recommendations using Vertex AI
            const userProfile = await window.FirebaseService.getUser(uid);
            const aiRecommendations = await window.VertexAIService.generateCareerRecommendations(
                userProfile, 
                assessmentData
            );
            
            // Combine assessment data with AI recommendations
            const realResults = {
                personality: assessmentData.results.personality || {
                    type: 'Career Explorer',
                    score: 75,
                    traits: ['Curious', 'Adaptable', 'Growth-minded', 'Analytical']
                },
                skills: assessmentData.scores || {
                    analytical: 75,
                    communication: 70,
                    emotional: 65,
                    creativity: 80,
                    leadership: 70
                },
                strengths: assessmentData.results.strengths || [
                    { icon: 'fas fa-lightbulb', text: 'Creative Thinking' },
                    { icon: 'fas fa-users', text: 'Team Collaboration' },
                    { icon: 'fas fa-chart-line', text: 'Growth Mindset' }
                ],
                recommendations: formatAIRecommendations(aiRecommendations.recommendations),
                aiInsights: aiRecommendations,
                userProfile: userProfile,
                completedAt: assessmentData.completedAt
            };
            
            displayResults(realResults);
            
        } else {
            console.log('No Firestore assessment data; trying local storage results');
            if (!loadLocalResultsOrPrompt()) {
                showAssessmentPrompt();
            }
        }
        
    } catch (error) {
        console.error('Failed to load real results:', error);
        // Try local results before mock
        if (!loadLocalResultsOrPrompt()) {
            console.log('Falling back to mock data');
            loadMockResults();
        }
    }
}

// Try to load results saved in localStorage by the assessment page
function loadLocalResultsOrPrompt() {
    try {
        const userData = window.UTPApp?.getUserData && window.UTPApp.getUserData();
        if (userData && (userData.testResults || userData.testCompleted)) {
            const local = userData.testResults || {};
            const skills = local.scores || local.skills || mockResults.skills;
            const personality = local.personality || mockResults.personality;

            // Build minimal recommendations if not present
            const recs = local.recommendations || mockResults.recommendations;

            const realResults = {
                personality,
                skills,
                strengths: local.strengths || mockResults.strengths,
                recommendations: recs,
                completedAt: local.completedAt || userData.completionDate || new Date().toISOString(),
            };
            displayResults(realResults);
            return true;
        }
    } catch (e) {
        console.warn('Could not load local results:', e);
    }
    return false;
}

// Format AI recommendations into the expected structure
function formatAIRecommendations(aiRecommendations) {
    const tierS = [];
    const tierA = [];
    const tierB = [];
    
    aiRecommendations.forEach((rec, index) => {
        const formattedRec = {
            title: rec.title,
            match: rec.match_percentage,
            description: rec.description,
            pathway: rec.learning_path || ['Research the field', 'Develop relevant skills', 'Gain experience', 'Apply for positions'],
            salaryRange: rec.salary_range || '$50,000 - $100,000',
            growthRate: rec.growth_rate || '10%',
            skills: rec.skills_needed || [],
            industryOutlook: rec.industry_outlook || 'Stable growth expected'
        };
        
        if (rec.match_percentage >= 85) {
            tierS.push(formattedRec);
        } else if (rec.match_percentage >= 70) {
            tierA.push(formattedRec);
        } else {
            tierB.push(formattedRec);
        }
    });
    
    return { tierS, tierA, tierB };
}

// Show prompt for users who haven't taken the assessment
function showAssessmentPrompt() {
    // Guard: if local results exist now, don't show prompt
    const ud = window.UTPApp?.getUserData && window.UTPApp.getUserData();
    if (ud && (ud.testResults || ud.testCompleted)) {
        return;
    }
    const resultsContainer = document.querySelector('.results-container');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="assessment-prompt">
                <div class="prompt-content">
                    <i class="fas fa-clipboard-list prompt-icon"></i>
                    <h2>Take Your Career Assessment</h2>
                    <p>You haven't completed your career assessment yet. Take our comprehensive test to get personalized career recommendations.</p>
                    <button class="btn btn-primary" onclick="window.location.href='test.html'">
                        <i class="fas fa-play"></i>
                        Start Assessment
                    </button>
                </div>
            </div>
        `;
    }
}

// Fallback to mock data when real data is not available
function loadMockResults() {
    console.log('Loading mock results as fallback');
    displayResults(mockResults);
}

// Mock results data (fallback when real data is not available)
const mockResults = {
    personality: {
        type: 'Analytical Thinker',
        score: 85,
        traits: ['Logical', 'Detail-oriented', 'Problem-solver', 'Strategic']
    },
    skills: {
        analytical: 92,
        communication: 78,
        emotional: 81,
        creativity: 74,
        leadership: 88
    },
    strengths: [
        { icon: 'fas fa-brain', text: 'Analytical Thinking' },
        { icon: 'fas fa-puzzle-piece', text: 'Problem Solving' },
        { icon: 'fas fa-search', text: 'Attention to Detail' },
        { icon: 'fas fa-chart-line', text: 'Data Analysis' },
        { icon: 'fas fa-cogs', text: 'Systems Thinking' }
    ],
    recommendations: {
        tierS: [
            {
                title: 'Data Scientist',
                match: 94,
                description: 'Perfect match for your analytical and problem-solving skills. Data scientists extract insights from complex datasets to drive business decisions.',
                pathway: ['Statistics/Mathematics Degree', 'Python/R Programming', 'Machine Learning', 'Industry Experience'],
                salaryRange: '$80,000 - $150,000',
                growthRate: '22%'
            },
            {
                title: 'Software Engineer',
                match: 91,
                description: 'Excellent fit for your logical thinking and technical aptitude. Build applications and systems that solve real-world problems.',
                pathway: ['Computer Science Degree', 'Programming Languages', 'Software Development', 'Specialization'],
                salaryRange: '$70,000 - $140,000',
                growthRate: '25%'
            }
        ],
        tierA: [
            {
                title: 'Business Analyst',
                match: 87,
                description: 'Great match for your analytical and communication skills. Bridge the gap between business needs and technical solutions.',
                pathway: ['Business/Analytics Degree', 'Data Analysis Tools', 'Business Knowledge', 'Certification'],
                salaryRange: '$60,000 - $100,000',
                growthRate: '14%'
            },
            {
                title: 'Product Manager',
                match: 84,
                description: 'Good fit combining your analytical skills with strategic thinking. Lead product development from conception to launch.',
                pathway: ['Business/Engineering Degree', 'Product Management', 'Market Research', 'Leadership Skills'],
                salaryRange: '$90,000 - $160,000',
                growthRate: '19%'
            }
        ],
        tierB: [
            {
                title: 'Financial Analyst',
                match: 76,
                description: 'Solid match for your analytical abilities. Analyze financial data to guide investment and business decisions.',
                pathway: ['Finance/Economics Degree', 'Financial Modeling', 'CFA Certification', 'Industry Knowledge'],
                salaryRange: '$55,000 - $95,000',
                growthRate: '6%'
            }
        ]
    },
    stageScores: {
        selfAwareness: 85,
        analytical: 92,
        communication: 78,
        emotional: 81,
        decisionMaking: 88
    },
    learningStyle: {
        visual: 40,
        kinesthetic: 35,
        auditory: 25
    },
    completionDate: new Date().toLocaleDateString(),
    duration: '45 minutes'
};

function initializeResults() {
    document.getElementById('completion-date').textContent = mockResults.completionDate;
    document.getElementById('test-duration').textContent = mockResults.duration;
}

function loadUserResults() {
    document.getElementById('personality-type').textContent = mockResults.personality.type;
    document.getElementById('personality-score').textContent = mockResults.personality.score;
    
    const traitsContainer = document.getElementById('personality-traits');
    traitsContainer.innerHTML = mockResults.personality.traits
        .map(trait => `<span class="trait">${trait}</span>`)
        .join('');
    
    const strengthsList = document.getElementById('strengths-list');
    strengthsList.innerHTML = mockResults.strengths
        .map(strength => `
            <div class="strength-item">
                <i class="${strength.icon}"></i>
                <span>${strength.text}</span>
            </div>
        `).join('');
    
    loadRecommendations();
}

function loadRecommendations() {
    const tierSContainer = document.getElementById('tier-s-recommendations');
    tierSContainer.innerHTML = mockResults.recommendations.tierS
        .map(career => createRecommendationCard(career))
        .join('');
    
    const tierAContainer = document.getElementById('tier-a-recommendations');
    tierAContainer.innerHTML = mockResults.recommendations.tierA
        .map(career => createRecommendationCard(career))
        .join('');
    
    const tierBContainer = document.getElementById('tier-b-recommendations');
    tierBContainer.innerHTML = mockResults.recommendations.tierB
        .map(career => createRecommendationCard(career))
        .join('');
}

function createRecommendationCard(career) {
    return `
        <div class="recommendation-card">
            <div class="recommendation-header">
                <div>
                    <h3 class="career-title">${career.title}</h3>
                    <p class="career-description">${career.description}</p>
                </div>
                <div class="match-score">
                    <span class="match-percentage">${career.match}%</span>
                    <span class="match-label">Match</span>
                </div>
            </div>
            
            <div class="career-pathway">
                <h5><i class="fas fa-route"></i> Learning Path</h5>
                <div class="pathway-steps">
                    ${career.pathway.map(step => `<span class="pathway-step">${step}</span>`).join('')}
                </div>
            </div>
            
            <div class="career-stats">
                <div class="stat-item">
                    <i class="fas fa-dollar-sign"></i>
                    <span>Salary: ${career.salaryRange}</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-chart-line"></i>
                    <span>Growth: ${career.growthRate}</span>
                </div>
            </div>
            
            <div class="recommendation-actions">
                <button class="btn btn-primary" onclick="startCareerPath('${career.title}')">
                    <i class="fas fa-play"></i>
                    Start Journey
                </button>
                <button class="btn btn-secondary" onclick="learnMore('${career.title}')">
                    <i class="fas fa-info-circle"></i>
                    Learn More
                </button>
            </div>
        </div>
    `;
}

function initializeCharts() {
    const skillsCtx = document.getElementById('skills-chart');
    if (skillsCtx) {
        const srcSkills = (currentResults && (currentResults.skills || currentResults.scores)) || mockResults.skills;
        
        // Completely disable any datalabels plugin that might be globally registered
        if (typeof Chart !== 'undefined') {
            // Override Chart.js to ignore datalabels completely
            const originalRegister = Chart.register;
            Chart.register = function(...plugins) {
                const filteredPlugins = plugins.filter(plugin => 
                    !plugin.id || plugin.id !== 'datalabels'
                );
                if (filteredPlugins.length > 0) {
                    originalRegister.apply(this, filteredPlugins);
                }
            };
            
            // Force disable in defaults
            Chart.defaults.set('plugins.datalabels', { display: false });
        }
        
        const chart = new Chart(skillsCtx, {
            type: 'radar',
            data: {
                labels: ['Analytical', 'Communication', 'Emotional', 'Creativity', 'Leadership'],
                datasets: [{
                    label: 'Your Skills',
                    data: [
                        srcSkills.analytical,
                        srcSkills.communication,
                        srcSkills.emotional,
                        srcSkills.creativity,
                        srcSkills.leadership
                    ],
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { top: 16, right: 36, bottom: 16, left: 36 }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            display: false,
                            stepSize: 20
                        },
                        grid: {
                            color: 'rgba(107,114,128,0.2)'
                        },
                        angleLines: {
                            color: 'rgba(107,114,128,0.2)'
                        },
                        pointLabels: {
                            color: '#374151',
                            padding: 10,
                            font: {
                                size: 10,
                                weight: '500'
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { 
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.r + '%';
                            }
                        }
                    },
                    datalabels: { display: false }
                }
            },
            plugins: []
        });
        
        // Nuclear option: Override canvas text rendering to block ONLY permanent percentage labels
        setTimeout(() => {
            if (chart && chart.canvas) {
                const ctx = chart.canvas.getContext('2d');
                const originalFillText = ctx.fillText;
                let isTooltipRendering = false;
                
                // Hook into tooltip rendering to allow tooltip text
                const originalTooltipDraw = chart.tooltip.draw;
                chart.tooltip.draw = function(pt) {
                    isTooltipRendering = true;
                    originalTooltipDraw.call(this, pt);
                    isTooltipRendering = false;
                };
                
                ctx.fillText = function(text, x, y, maxWidth) {
                    // Allow tooltip text, block only permanent chart labels with %
                    if (typeof text === 'string' && text.includes('%') && !isTooltipRendering) {
                        return;
                    }
                    return originalFillText.call(this, text, x, y, maxWidth);
                };
                chart.update('none');
            }
        }, 100);
    }

    const learningCtx = document.getElementById('learning-style-chart');
    if (learningCtx) {
        const ls = (currentResults && currentResults.learningStyle) || mockResults.learningStyle;
        new Chart(learningCtx, {
            type: 'doughnut',
            data: {
                labels: ['Visual', 'Kinesthetic', 'Auditory'],
                datasets: [{
                    data: [ls.visual, ls.kinesthetic, ls.auditory],
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(16, 185, 129, 0.8)'
                    ],
                    borderColor: [
                        'rgba(99, 102, 241, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(16, 185, 129, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const sum = context.dataset.data.reduce((a, b) => a + (Number(b) || 0), 0);
                                const val = Number(context.raw) || 0;
                                const pct = sum ? Math.round((val / sum) * 100) : 0;
                                return `${context.label}: ${val} (${pct}%)`;
                            }
                        }
                    },
                    doughnutPct: {
                        color: '#111827',
                        minPercentageToShow: 3
                    }
                }
            }
        });
    }
}

function initializeScoreCircles() {
    const scoreCircles = document.querySelectorAll('.score-circle');
    scoreCircles.forEach(circle => {
        const score = circle.getAttribute('data-score');
        circle.style.setProperty('--score', score);
    });
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

function startCareerPath(careerTitle) {
    const userData = window.UTPApp?.getUserData() || {};
    userData.selectedCareer = careerTitle;
    window.UTPApp?.saveUserData(userData);
    
    window.UTPApp?.showNotification(`Starting your journey as a ${careerTitle}!`, 'success');
    
    setTimeout(() => {
        window.location.href = 'learning-path.html';
    }, 1500);
}

function learnMore(careerTitle) {
    window.UTPApp?.showNotification(`Loading detailed information about ${careerTitle}...`, 'info');
}

function startLearningPath() {
    const userData = window.UTPApp?.getUserData() || {};
    if (userData.selectedCareer) {
        startCareerPath(userData.selectedCareer);
    } else {
        window.UTPApp?.showNotification('Please select a career path first!', 'warning');
    }
}

function downloadReport() {
    window.UTPApp?.showNotification('Generating your career report...', 'info');
    
    setTimeout(() => {
        window.UTPApp?.showNotification('Report downloaded successfully!', 'success');
    }, 2000);
}

// Global functions
window.showTab = showTab;
window.startCareerPath = startCareerPath;
window.learnMore = learnMore;
window.startLearningPath = startLearningPath;
window.downloadReport = downloadReport;

// Display results into the results.html UI from a results object
function displayResults(results) {
    try {
        currentResults = results || mockResults;

        const persona = currentResults.personality || mockResults.personality;
        const skills = currentResults.skills || currentResults.scores || mockResults.skills;
        const strengths = currentResults.strengths || mockResults.strengths;
        const recs = currentResults.recommendations || mockResults.recommendations;

        // Header meta
        const completionDate = document.getElementById('completion-date');
        const testDuration = document.getElementById('test-duration');
        if (completionDate) completionDate.textContent = new Date(currentResults.completedAt || new Date()).toLocaleDateString();
        if (testDuration) testDuration.textContent = currentResults.duration || '—';

        // Personality section
        const typeEl = document.getElementById('personality-type');
        const scoreEl = document.getElementById('personality-score');
        const traitsEl = document.getElementById('personality-traits');
        if (typeEl) typeEl.textContent = persona.type || 'Career Explorer';
        if (scoreEl) scoreEl.textContent = (persona.score || 75) + '%';
        if (traitsEl) {
            const traits = persona.traits || [];
            traitsEl.innerHTML = traits.map(t => `<span class="trait">${t}</span>`).join('');
        }

        // Strengths
        const strengthsList = document.getElementById('strengths-list');
        if (strengthsList) {
            strengthsList.innerHTML = strengths.map(s => `
                <div class="strength-item">
                    <i class="${s.icon}"></i>
                    <span>${s.text}</span>
                </div>
            `).join('');
        }

        // Recommendations (support both tiered object and raw array)
        let tiered = recs;
        if (Array.isArray(recs)) {
            tiered = formatAIRecommendations(recs);
        }
        const sContainer = document.getElementById('tier-s-recommendations');
        const aContainer = document.getElementById('tier-a-recommendations');
        const bContainer = document.getElementById('tier-b-recommendations');
        if (sContainer) sContainer.innerHTML = (tiered.tierS || []).map(createRecommendationCard).join('');
        if (aContainer) aContainer.innerHTML = (tiered.tierA || []).map(createRecommendationCard).join('');
        if (bContainer) bContainer.innerHTML = (tiered.tierB || []).map(createRecommendationCard).join('');

        // Rebuild charts with currentResults data
        initializeCharts();
        initializeScoreCircles();

    } catch (err) {
        console.error('displayResults failed, using mock:', err);
        currentResults = mockResults;
        initializeCharts();
        initializeScoreCircles();
    }
}
