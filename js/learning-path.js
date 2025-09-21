// Learning Path functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeLearningPath();
    loadLeaderboard();
    updateNavStats();
});

// Mock learning data
const mockLearningData = {
    userStats: {
        xp: 2450,
        streak: 7,
        level: 3,
        weeklyXP: 350
    },
    leaderboard: [
        { rank: 1, name: 'Sarah Chen', level: 'Level 5', xp: 4200, avatar: 'SC' },
        { rank: 2, name: 'Mike Rodriguez', level: 'Level 4', xp: 3800, avatar: 'MR' },
        { rank: 3, name: 'Emma Wilson', level: 'Level 4', xp: 3600, avatar: 'EW' },
        { rank: 4, name: 'David Kim', level: 'Level 3', xp: 3200, avatar: 'DK' },
        { rank: 5, name: 'Lisa Zhang', level: 'Level 3', xp: 3000, avatar: 'LZ' },
        { rank: 6, name: 'Tom Anderson', level: 'Level 3', xp: 2900, avatar: 'TA' },
        { rank: 7, name: 'Anna Kowalski', level: 'Level 3', xp: 2800, avatar: 'AK' },
        { rank: 8, name: 'James Brown', level: 'Level 2', xp: 2700, avatar: 'JB' },
        { rank: 9, name: 'Maria Garcia', level: 'Level 2', xp: 2600, avatar: 'MG' },
        { rank: 10, name: 'Chris Taylor', level: 'Level 2', xp: 2500, avatar: 'CT' }
    ],
    modules: [
        {
            id: 1,
            title: 'Python Fundamentals',
            description: 'Master Python programming basics for data science',
            duration: '2 weeks',
            xp: 300,
            status: 'completed',
            badges: ['Python Basics', 'First Steps']
        },
        {
            id: 2,
            title: 'Data Analysis with Pandas',
            description: 'Learn data manipulation and analysis using Pandas library',
            duration: '3 weeks',
            xp: 450,
            status: 'completed',
            badges: ['Data Explorer', 'Pandas Pro']
        },
        {
            id: 3,
            title: 'Statistical Analysis',
            description: 'Master descriptive and inferential statistics for data science',
            duration: '4 weeks',
            xp: 600,
            status: 'current',
            progress: 45,
            currentLesson: 'Probability Distributions'
        },
        {
            id: 4,
            title: 'Data Visualization',
            description: 'Create compelling visualizations with Matplotlib and Seaborn',
            duration: '3 weeks',
            xp: 500,
            status: 'locked',
            requirement: 'Complete Statistical Analysis to unlock'
        },
        {
            id: 5,
            title: 'Machine Learning Basics',
            description: 'Introduction to supervised and unsupervised learning algorithms',
            duration: '5 weeks',
            xp: 800,
            status: 'locked',
            requirement: 'Complete Data Visualization to unlock'
        }
    ]
};

// Helpers
function getModuleById(id) {
    return mockLearningData.modules.find(m => String(m.id) === String(id));
}

// Review modal rendering
function ensureReviewModal() {
    let modal = document.querySelector('.review-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'review-modal';
        modal.innerHTML = `
            <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="review-title">
                <div class="modal-header">
                    <h3 id="review-title">Module Review</h3>
                    <button class="close-btn" aria-label="Close" onclick="closeReviewModal()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="module-summary"></div>
                    <h4>Lessons</h4>
                    <div class="lesson-list"></div>
                </div>
            </div>`;
        document.body.appendChild(modal);

        // close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeReviewModal();
        });
        // close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeReviewModal();
        });
    }
    return modal;
}

function openReviewModal(module) {
    const modal = ensureReviewModal();
    // Populate content
    const summary = modal.querySelector('.module-summary');
    const lessons = modal.querySelector('.lesson-list');
    const titleEl = modal.querySelector('#review-title');

    titleEl.textContent = `Review: ${module.title}`;

    summary.innerHTML = `
        <p><strong>Duration:</strong> ${module.duration || '-'} &nbsp; • &nbsp; <strong>XP:</strong> ${module.xp || 0}</p>
        <p class="muted">${module.description || ''}</p>
    `;

    // Mock lesson list (in real app, fetch lessons by module)
    const mockLessons = [
        { title: 'Overview', completed: true },
        { title: 'Core Concepts', completed: true },
        { title: 'Hands-on Exercise', completed: module.status !== 'locked' },
        { title: 'Assessment', completed: module.status === 'completed' }
    ];
    lessons.innerHTML = mockLessons.map(l => `
        <div class="lesson-item ${l.completed ? 'completed' : ''}"><i class="fas fa-${l.completed ? 'check' : 'circle'}"></i><span>${l.title}</span></div>
    `).join('');

    modal.classList.add('active');
}

function closeReviewModal() {
    const modal = document.querySelector('.review-modal');
    if (modal) modal.classList.remove('active');
}

// Expose close function
window.closeReviewModal = closeReviewModal;

function initializeLearningPath() {
    // Initialize any animations or interactive elements
    animateProgressBars();
    setupViewToggle();
}

function updateNavStats() {
    document.getElementById('nav-xp').textContent = mockLearningData.userStats.xp.toLocaleString();
    document.getElementById('nav-streak').textContent = mockLearningData.userStats.streak;
}

function animateProgressBars() {
    // Animate progress bars on load
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = width;
        }, 500);
    });

    // Animate progress circles
    const progressCircles = document.querySelectorAll('.progress-circle .progress-bar');
    progressCircles.forEach(circle => {
        const dashOffset = circle.style.strokeDashoffset || circle.getAttribute('stroke-dashoffset');
        circle.style.strokeDashoffset = '251'; // Full circle
        setTimeout(() => {
            circle.style.strokeDashoffset = dashOffset;
        }, 1000);
    });
}

function setupViewToggle() {
    // Grid view is not implemented in this version, but toggle is ready
    const pathView = document.getElementById('path-view');
    const gridView = document.getElementById('grid-view');
    
    // Populate grid view with modules if needed
    if (gridView) {
        populateGridView();
    }
}

function populateGridView() {
    const gridContainer = document.querySelector('.modules-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = mockLearningData.modules.map(module => `
        <div class="module-grid-card ${module.status}">
            <div class="module-status-badge">
                <i class="fas fa-${getStatusIcon(module.status)}"></i>
                <span>${module.status.charAt(0).toUpperCase() + module.status.slice(1)}</span>
            </div>
            <h3>${module.title}</h3>
            <p>${module.description}</p>
            <div class="module-meta">
                <span><i class="fas fa-clock"></i> ${module.duration}</span>
                <span><i class="fas fa-star"></i> ${module.xp} XP</span>
            </div>
            ${module.status === 'current' ? `
                <div class="module-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${module.progress}%"></div>
                    </div>
                    <span>${module.progress}% Complete</span>
                </div>
            ` : ''}
            ${module.badges ? `
                <div class="module-badges">
                    ${module.badges.map(badge => `<span class="badge earned">${badge}</span>`).join('')}
                </div>
            ` : ''}
            ${(module.status === 'completed' || module.status === 'locked') ? '' : `
                <button class="btn ${getButtonClass(module.status)}" onclick="handleModuleAction(${module.id}, '${module.status}')">
                    <i class="fas fa-${getButtonIcon(module.status)}"></i>
                    ${getButtonText(module.status)}
                </button>
            `}
        </div>
    `).join('');
}

function getStatusIcon(status) {
    switch (status) {
        case 'completed': return 'check-circle';
        case 'current': return 'play-circle';
        case 'locked': return 'lock';
        default: return 'circle';
    }
}

function getButtonClass(status) {
    switch (status) {
        case 'completed': return 'btn-secondary';
        case 'current': return 'btn-primary';
        case 'locked': return 'btn-disabled';
        default: return 'btn-primary';
    }
}

function getButtonIcon(status) {
    switch (status) {
        case 'completed': return 'eye';
        case 'current': return 'play';
        case 'locked': return 'lock';
        default: return 'play';
    }
}

function getButtonText(status) {
    switch (status) {
        case 'completed': return 'Review';
        case 'current': return 'Continue';
        case 'locked': return 'Locked';
        default: return 'Start';
    }
}

function switchView(viewType) {
    const pathView = document.getElementById('path-view');
    const gridView = document.getElementById('grid-view');
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    
    // Remove active class from all buttons
    toggleButtons.forEach(btn => btn.classList.remove('active'));
    
    if (viewType === 'path') {
        pathView.classList.add('active');
        gridView.classList.remove('active');
        document.querySelector('.toggle-btn[onclick*="path"]').classList.add('active');
    } else {
        pathView.classList.remove('active');
        gridView.classList.add('active');
        document.querySelector('.toggle-btn[onclick*="grid"]').classList.add('active');
    }
}

function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = mockLearningData.leaderboard.map(user => `
        <div class="leaderboard-item">
            <span class="rank-position ${user.rank <= 3 ? 'top-3' : ''}">#${user.rank}</span>
            <div class="user-avatar">${user.avatar}</div>
            <div class="user-info">
                <div class="user-name">${user.name}</div>
                <div class="user-level">${user.level}</div>
            </div>
            <div class="user-xp">${user.xp.toLocaleString()} XP</div>
        </div>
    `).join('');
}

function filterLeaderboard(period) {
    // In a real app, this would filter the leaderboard data
    window.UTPApp?.showNotification(`Showing ${period} leaderboard`, 'info');
    
    // Simulate loading new data
    setTimeout(() => {
        loadLeaderboard();
    }, 500);
}

function continueModule(moduleId) {
    window.UTPApp?.showNotification('Loading module...', 'info');
    
    // Simulate module loading
    setTimeout(() => {
        window.UTPApp?.showNotification('Module loaded! Starting lesson...', 'success');
        // In a real app, this would navigate to the lesson
    }, 1500);
}

function reviewModule(moduleId) {
    const module = getModuleById(moduleId);
    if (!module) {
        window.UTPApp?.showNotification('Module not found', 'error');
        return;
    }
    openReviewModal(module);
}

function handleModuleAction(moduleId, status) {
    switch (status) {
        case 'completed':
            reviewModule(moduleId);
            break;
        case 'current':
            continueModule(moduleId);
            break;
        case 'locked':
            window.UTPApp?.showNotification('Complete previous modules to unlock this one', 'warning');
            break;
        default:
            continueModule(moduleId);
    }
}

function startProject(projectId) {
    window.UTPApp?.showNotification('Starting project...', 'info');
    
    setTimeout(() => {
        window.UTPApp?.showNotification('Project workspace ready!', 'success');
        // In a real app, this would open the project environment
    }, 1500);
}

function viewProject(projectId) {
    window.UTPApp?.showNotification('Opening project details...', 'info');
    
    setTimeout(() => {
        window.UTPApp?.showNotification('Project details loaded', 'success');
    }, 1000);
}

// Simulate XP gain animation
function gainXP(amount) {
    const currentXP = mockLearningData.userStats.xp;
    const newXP = currentXP + amount;
    
    // Create floating XP notification
    const notification = document.createElement('div');
    notification.className = 'xp-gain-notification';
    notification.innerHTML = `+${amount} XP`;
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #6366f1, #f59e0b);
        color: white;
        padding: 1rem 2rem;
        border-radius: 2rem;
        font-weight: bold;
        font-size: 1.25rem;
        z-index: 10000;
        animation: xpGain 2s ease-out forwards;
    `;
    
    // Add animation keyframes if not already added
    if (!document.getElementById('xp-gain-styles')) {
        const style = document.createElement('style');
        style.id = 'xp-gain-styles';
        style.textContent = `
            @keyframes xpGain {
                0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                50% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.2);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -100px) scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Update XP counter
    setTimeout(() => {
        mockLearningData.userStats.xp = newXP;
        updateNavStats();
        notification.remove();
    }, 2000);
}

// Simulate completing a lesson
function completeLesson() {
    gainXP(50);
    window.UTPApp?.showNotification('Lesson completed! Well done!', 'success');
}

// Global functions
window.switchView = switchView;
window.filterLeaderboard = filterLeaderboard;
window.continueModule = continueModule;
window.reviewModule = reviewModule;
window.handleModuleAction = handleModuleAction;
window.startProject = startProject;
window.viewProject = viewProject;
window.completeLesson = completeLesson;
