// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadUserProgress();
    initializeCharts();
    loadActivityTimeline();
    loadAchievements();
    loadBadges();
    setupCareerSimulationGate();
});

// Mock user data (used as fallback if no local data exists)
const mockUserData = {
    name: 'Alex Johnson',
    currentPath: 'Data Scientist',
    level: 3,
    totalXP: 2450,
    // badgesCount intentionally omitted; we compute from the array below
    streak: 7,
    overallProgress: 70,
    skills: {
        analytical: { level: 4, xp: 1200, maxXP: 1500 },
        programming: { level: 3, xp: 600, maxXP: 1000 },
        visualization: { level: 2, xp: 200, maxXP: 500 },
        machineLearning: { level: 1, xp: 50, maxXP: 250 }
    },
    currentQuest: {
        title: 'Statistical Analysis Fundamentals',
        description: 'Learn descriptive statistics, probability distributions, and hypothesis testing',
        progress: 45,
        completed: 3,
        total: 8
    },
    learningProgress: {
        thisWeek: [2, 4, 3, 5, 2, 6, 4],
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    recentActivity: [
        { type: 'lesson', title: 'Completed: Probability Distributions', time: '2 hours ago', icon: 'fas fa-book' },
        { type: 'badge', title: 'Earned: Statistics Novice Badge', time: '1 day ago', icon: 'fas fa-trophy' },
        { type: 'quest', title: 'Started: Statistical Analysis Quest', time: '2 days ago', icon: 'fas fa-flag' },
        { type: 'level', title: 'Reached Level 3 in Analytical Thinking', time: '3 days ago', icon: 'fas fa-star' },
        { type: 'project', title: 'Submitted: Data Cleaning Project', time: '5 days ago', icon: 'fas fa-project-diagram' }
    ],
    achievements: [
        { title: 'First Steps', description: 'Completed your first lesson', icon: 'fas fa-baby', earned: true },
        { title: 'Streak Master', description: '7-day learning streak', icon: 'fas fa-fire', earned: true },
        { title: 'Quick Learner', description: 'Completed 5 lessons in one day', icon: 'fas fa-bolt', earned: true }
    ],
    badges: [
        { name: 'Python Basics', description: 'Completed Python fundamentals', icon: 'fas fa-code', earned: true },
        { name: 'Data Explorer', description: 'Analyzed first dataset', icon: 'fas fa-search', earned: true },
        { name: 'Statistics Novice', description: 'Learned basic statistics', icon: 'fas fa-chart-bar', earned: true },
        { name: 'Visualization Pro', description: 'Created 10 charts', icon: 'fas fa-chart-line', earned: false },
        { name: 'ML Apprentice', description: 'Built first ML model', icon: 'fas fa-robot', earned: false },
        { name: 'Project Master', description: 'Completed 5 projects', icon: 'fas fa-trophy', earned: false }
    ]
};

function initializeDashboard() {
    // Prefer local user data when available
    const local = window.UTPApp?.getUserData && window.UTPApp.getUserData();
    // Derive name from multiple possible sources set during auth/profile setup
    const profile = local?.profile || {};
    const composedFromProfile = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    let fullName = (
        local?.displayName ||
        composedFromProfile ||
        profile.fullName ||
        profile.name ||
        local?.fullName ||
        local?.name ||
        ''
    ).trim();
    // Fallback to email username if no name available
    if (!fullName && local?.email) {
        fullName = String(local.email).split('@')[0];
    }
    if (!fullName) fullName = mockUserData.name;
    const firstName = String(fullName).trim().split(' ')[0] || 'Student';

    // Load user name in navbar and hero
    const userNameEl = document.getElementById('user-name');
    const welcomeNameEl = document.getElementById('welcome-name');
    if (userNameEl) userNameEl.textContent = fullName;
    if (welcomeNameEl) welcomeNameEl.textContent = firstName;

    // Put user initials inside the navbar avatar
    const initials = fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(p => (p && p[0] ? p[0].toUpperCase() : ''))
        .join('') || 'U';
    const avatarEl = document.querySelector('.profile-avatar');
    if (avatarEl) avatarEl.textContent = initials;
    
    // Ensure profile dropdown exists (no navbar logout link)
    try {
        if (window.ensureUserDropdown) window.ensureUserDropdown({ displayName: fullName, email: local?.email });
    } catch (e) { /* non-blocking */ }
    
    // Load quick stats
    const badgesSource = Array.isArray(local?.badges) ? local.badges : (mockUserData.badges || []);
    const earnedBadgesCount = badgesSource.filter(b => b && b.earned).length;
    const streak = local?.streak ?? mockUserData.streak;
    const totalXP = local?.totalXP ?? mockUserData.totalXP;

    const badgesEl = document.getElementById('total-badges');
    const streakEl = document.getElementById('current-streak');
    const xpEl = document.getElementById('total-xp');
    if (badgesEl) badgesEl.textContent = earnedBadgesCount;
    if (streakEl) streakEl.textContent = streak;
    if (xpEl) xpEl.textContent = Number(totalXP).toLocaleString();
    
    // Load current path info
    const pathTitle = local?.currentPath || mockUserData.currentPath;
    const pathTitleEl = document.getElementById('current-path-title');
    if (pathTitleEl) pathTitleEl.textContent = pathTitle;
    
    // Update progress ring
    updateProgressRing(local?.overallProgress ?? mockUserData.overallProgress);
}

function updateProgressRing(percentage) {
    const circle = document.querySelector('.progress-bar');
    const circumference = 2 * Math.PI * 50; // radius = 50
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    
    document.querySelector('.progress-percentage').textContent = `${percentage}%`;
}

function loadUserProgress() {
    // Update current quest progress
    const questProgress = document.querySelector('.quest-progress .progress-fill');
    questProgress.style.width = `${mockUserData.currentQuest.progress}%`;
    
    const questText = document.querySelector('.quest-progress span');
    questText.textContent = `${mockUserData.currentQuest.completed} of ${mockUserData.currentQuest.total} lessons completed`;
    
    // Update skills progress
    updateSkillProgress('analytical', mockUserData.skills.analytical);
    updateSkillProgress('programming', mockUserData.skills.programming);
    updateSkillProgress('visualization', mockUserData.skills.visualization);
    updateSkillProgress('machineLearning', mockUserData.skills.machineLearning);
}

function updateSkillProgress(skillType, skillData) {
    const progressPercentage = (skillData.xp / skillData.maxXP) * 100;
    
    // This would update specific skill cards if they had unique IDs
    // For now, the progress is shown in the HTML with inline styles
}

function initializeCharts() {
    // Learning progress chart
    const progressCtx = document.getElementById('learning-progress-chart');
    if (progressCtx) {
        new Chart(progressCtx, {
            type: 'line',
            data: {
                labels: mockUserData.learningProgress.labels,
                datasets: [{
                    label: 'Hours Studied',
                    data: mockUserData.learningProgress.thisWeek,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 8,
                        ticks: {
                            stepSize: 2
                        }
                    }
                }
            }
        });
    }
}

function loadActivityTimeline() {
    const timeline = document.getElementById('activity-timeline');
    timeline.innerHTML = mockUserData.recentActivity.map(activity => `
        <div class="timeline-item">
            <div class="timeline-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="timeline-content">
                <h5>${activity.title}</h5>
                <p>${activity.time}</p>
            </div>
        </div>
    `).join('');
}

function loadAchievements() {
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = mockUserData.achievements.map(achievement => `
        <div class="achievement-item">
            <div class="achievement-badge">
                <i class="${achievement.icon}"></i>
            </div>
            <div class="achievement-content">
                <h5>${achievement.title}</h5>
                <p>${achievement.description}</p>
            </div>
        </div>
    `).join('');
}

function loadBadges() {
    const local = window.UTPApp?.getUserData && window.UTPApp.getUserData();
    const badgesSource = Array.isArray(local?.badges) ? local.badges : (mockUserData.badges || []);
    const badgesGrid = document.getElementById('badges-grid');
    if (!badgesGrid) return;
    badgesGrid.innerHTML = badgesSource.map(badge => `
        <div class="badge-item ${badge.earned ? 'earned' : 'locked'}">
            <div class="badge-icon">
                <i class="${badge.icon}"></i>
            </div>
            <div class="badge-name">${badge.name}</div>
            <p class="badge-description">${badge.description}</p>
        </div>
    `).join('');
}

function continueQuest() {
    window.UTPApp?.showNotification('Continuing your quest...', 'info');
    setTimeout(() => {
        window.location.href = 'learning-path.html';
    }, 1000);
}

function changePath() {
    window.UTPApp?.showNotification('Opening career path selection...', 'info');
    setTimeout(() => {
        window.location.href = 'results.html';
    }, 1000);
}

// Global functions
window.continueQuest = continueQuest;
window.changePath = changePath;

// Lock/unlock Career Simulation based on certificate
function setupCareerSimulationGate() {
    const navSim = document.getElementById('nav-sim');
    const unlockRow = document.getElementById('unlock-sim-row');
    const unlockFill = document.getElementById('unlock-sim-fill');
    const unlockPct = document.getElementById('unlock-sim-percent');
    const unlockText = document.getElementById('unlock-sim-text');
    if (!navSim) return;

    // If the unlock row is not present, assume feature is unlocked and ensure navigation works
    if (!unlockRow) {
        navSim.classList.remove('locked');
        navSim.removeAttribute('aria-disabled');
        navSim.removeAttribute('title');
        const lockBadge = navSim.querySelector('.lock-badge');
        if (lockBadge) lockBadge.remove();
        navSim.setAttribute('href', 'simulation.html');
        return;
    }

    const user = (window.UTPApp?.getUserData && window.UTPApp.getUserData()) || {};
    // Heuristics: certificateEarned boolean or completed modules vs total
    let hasCertificate = Boolean(user.certificateEarned || user.certificate || user.hasCertificate);
    const completed = Number(user.modulesCompleted ?? 7);
    const total = Number(user.modulesTotal ?? 10);
    const percent = Math.min(100, Math.max(0, Math.round((completed / Math.max(1, total)) * 100)));

    // Update progress row (if elements exist)
    if (unlockFill) unlockFill.style.width = percent + '%';
    if (unlockPct) unlockPct.textContent = percent + '%';

    // Testing overrides: URL ?unlockSim=1 or localStorage.utp_unlockSim === '1'
    const params = new URLSearchParams(window.location.search);
    const overrideUnlock = params.get('unlockSim') === '1' || window.localStorage?.getItem('utp_unlockSim') === '1';
    if (!hasCertificate && overrideUnlock) {
        hasCertificate = true;
    }

    if (hasCertificate) {
        // Unlock
        navSim.classList.remove('locked');
        navSim.removeAttribute('aria-disabled');
        navSim.removeAttribute('title');
        const lockBadge = navSim.querySelector('.lock-badge');
        if (lockBadge) lockBadge.remove();
        if (unlockRow) unlockRow.style.display = 'none';
        // ensure proper href to simulation page
        navSim.setAttribute('href', 'simulation.html');
    } else {
        // Remain locked
        navSim.classList.add('locked');
        navSim.setAttribute('aria-disabled', 'true');
        navSim.setAttribute('title', 'Complete Learning Path to unlock Career Simulation');
        if (unlockText) unlockText.textContent = 'Complete your Learning Path to unlock Career Simulation';
        // prevent navigation
        navSim.addEventListener('click', (e) => {
            e.preventDefault();
            window.UTPApp?.showNotification('Complete your Learning Path to unlock Career Simulation', 'warning');
        });
    }
}
