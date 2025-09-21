// Global UTP App object - Define early so it's available everywhere
window.UTPApp = {
    getUserData: function() {
        try {
            const userData = localStorage.getItem('utpUserData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    },
    
    saveUserData: function(data) {
        try {
            localStorage.setItem('utpUserData', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    },
    
    clearUserData: function() {
        try {
            localStorage.removeItem('utpUserData');
            return true;
        } catch (error) {
            console.error('Error clearing user data:', error);
            return false;
        }
    },
    
    showNotification: function(message, type = 'info') {
        try {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                    <span>${message}</span>
                </div>
                <button class="notification-close" onclick="this.parentElement.remove()">×</button>
            `;
            
            // Add to page
            document.body.appendChild(notification);
            
            // Show notification
            setTimeout(() => notification.classList.add('show'), 100);
            
            // Remove notification after 4 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        if (notification.parentElement) {
                            document.body.removeChild(notification);
                        }
                    }, 300);
                }
            }, 4000);
            
            return true;
        } catch (error) {
            console.error('Error showing notification:', error);
            // Fallback to alert
            alert(message);
            return false;
        }
    },
    
    simulateAPI: function(endpoint, data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, data: data });
            }, 1000 + Math.random() * 1000);
        });
    }
};

// Main JavaScript for Unlocking True Potential Platform
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100
    });

    // Initialize all components
    initNavigation();
    initScrollEffects();
    initAnimations();
    initUserData();
    initAuthState();
    // Force a UI refresh shortly after load in case auth initializes late
    setTimeout(refreshAuthUI, 300);
    setTimeout(refreshAuthUI, 1200);
    // If redirected with loggedOut flag, enforce logged-out UI immediately
    if (new URLSearchParams(location.search).get('loggedOut') === '1') {
        forceLoggedOutUI();
    }

    // Simple dropdown toggle function for direct HTML dropdowns
    window.toggleDropdown = function() {
        const menu = document.getElementById('profileMenu');
        const arrow = document.querySelector('.dropdown-arrow');
        
        if (menu) {
            const isVisible = menu.style.display === 'block';
            
            if (isVisible) {
                // Hide dropdown
                menu.style.opacity = '0';
                menu.style.transform = 'translateY(-10px)';
                if (arrow) arrow.style.transform = 'rotate(0deg)';
                setTimeout(() => {
                    menu.style.display = 'none';
                }, 300);
            } else {
                // Show dropdown
                menu.style.display = 'block';
                setTimeout(() => {
                    menu.style.opacity = '1';
                    menu.style.transform = 'translateY(0)';
                    if (arrow) arrow.style.transform = 'rotate(180deg)';
                }, 10);
            }
        }
    };
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const profileContainer = document.querySelector('.profile-dropdown-container');
        const menu = document.getElementById('profileMenu');
        const arrow = document.querySelector('.dropdown-arrow');
        
        if (profileContainer && !profileContainer.contains(e.target) && menu) {
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-10px)';
            if (arrow) arrow.style.transform = 'rotate(0deg)';
            setTimeout(() => {
                menu.style.display = 'none';
            }, 300);
        }
    });
    
    // Add hover effects to menu items
    setTimeout(() => {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const isLogout = item.classList.contains('logout-btn');
            const originalStyle = item.getAttribute('style') || '';
            
            item.addEventListener('mouseenter', () => {
                if (isLogout) {
                    item.style.background = '#fee';
                } else if (!originalStyle.includes('background: linear-gradient')) {
                    item.style.background = 'rgba(99, 102, 241, 0.1)';
                    item.style.color = '#6366f1';
                }
                item.style.transform = 'translateX(4px)';
            });
            
            item.addEventListener('mouseleave', () => {
                if (isLogout) {
                    item.style.background = 'transparent';
                    item.style.color = '#dc3545';
                } else if (!originalStyle.includes('background: linear-gradient')) {
                    item.style.background = 'transparent';
                    item.style.color = '#374151';
                }
                item.style.transform = 'translateX(0)';
            });
        });
    }, 200);
});

// Navigation functionality
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // If href is an anchor on the same page, smooth scroll; otherwise allow normal navigation
            const href = link.getAttribute('href') || '';
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(href);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // Highlight active nav link based on current page
    try {
        const path = (location.pathname || '').split('/').pop();
        navLinks.forEach(link => {
            const href = (link.getAttribute('href') || '').split('/').pop();
            if (href && href === path) {
                link.classList.add('active');
            }
        });
    } catch {}
}

// Scroll effects for navbar
function initScrollEffects() {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// Initialize animations and interactive elements
function initAnimations() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.feature-card, .testimonial-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    // Animate statistics on scroll
    const stats = document.querySelectorAll('.stat-number');
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -100px 0px'
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumber(entry.target);
            }
        });
    }, observerOptions);

    stats.forEach(stat => {
        statsObserver.observe(stat);
    });
}

// Animate numbers counting up
function animateNumber(element) {
    const target = element.textContent;
    const numericValue = parseInt(target.replace(/[^\d]/g, ''));
    const suffix = target.replace(/[\d,]/g, '');
    let current = 0;
    const increment = numericValue / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
            current = numericValue;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString() + suffix;
    }, 30);
}

// User data management
function initUserData() {
    // Check if user is returning
    const userData = UTPApp.getUserData();
    if (userData && userData.name) {
        updateUIForReturningUser(userData);
    }
}

function getUserData() {
    try {
        return JSON.parse(localStorage.getItem('utpUserData')) || {};
    } catch (e) {
        return {};
    }
}

function saveUserData(data) {
    try {
        const existingData = getUserData();
        const updatedData = { ...existingData, ...data };
        localStorage.setItem('utpUserData', JSON.stringify(updatedData));
        return true;
    } catch (e) {
        console.error('Failed to save user data:', e);
        return false;
    }
}

function updateUIForReturningUser(userData) {
    const ctaButtons = document.querySelectorAll('.btn-primary');
    ctaButtons.forEach(button => {
        if (button.textContent.includes('Start Your Journey')) {
            button.innerHTML = '<i class="fas fa-play"></i> Continue Your Journey';
        }
    });
}

// Main CTA function - Start Journey
function startJourney() {
    const userData = UTPApp.getUserData();
    
    if (userData && userData.testCompleted) {
        // User has completed test, go to dashboard
        window.location.href = 'pages/dashboard.html';
    } else if (userData && userData.name) {
        // User is registered but hasn't completed test
        window.location.href = 'pages/test.html';
    } else {
        // New user -> open unified auth modal instead of legacy auth page
        if (typeof window.openAuthModal === 'function') {
            window.openAuthModal();
        } else {
            // Fallback: go to homepage where modal is available
            window.location.href = '/index.html';
        }
    }
}

// Learn more function
function learnMore() {
    document.getElementById('features').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Open parent guide
function openParentGuide() {
    window.location.href = 'pages/parent-guide.html';
}

// Open FAQ
function openFAQ() {
    window.location.href = 'pages/faq.html';
}

// Open help center
function openHelp() {
    window.location.href = 'pages/help.html';
}

// Open privacy policy
function openPrivacy() {
    window.location.href = 'pages/privacy.html';
}

// Authentication state management
function initAuthState() {
    console.log('Initializing auth state...');
    
    // Debug Firebase availability
    console.log('Firebase available:', !!window.firebase);
    console.log('FirebaseService available:', !!window.FirebaseService);
    
    // Check if user is authenticated
    if (window.FirebaseService) {
        // Wait for Firebase to initialize
        setTimeout(() => {
            try {
                const auth = window.FirebaseService.auth();
                console.log('Firebase auth service:', !!auth);
                
                if (auth) {
                    console.log('Current user:', auth.currentUser);
                    auth.onAuthStateChanged((user) => {
                        console.log('Auth state changed:', user ? 'signed in' : 'signed out');
                        if (user) {
                            console.log('User details:', {
                                uid: user.uid,
                                email: user.email,
                                displayName: user.displayName
                            });
                        }
                        updateUIForAuthState(user);
                    });
                    // Also do an immediate pass with current user (may be null)
                    updateUIForAuthState(auth.currentUser || null);
                }
            } catch (error) {
                console.error('Error accessing Firebase auth:', error);
            }
        }, 1000);
    } else {
        console.log('FirebaseService not available, checking local storage only');
    }
    
    // Check local storage for user data
    const userData = UTPApp.getUserData();
    if (userData) {
        console.log('Found local user data:', userData);
        // Simple logout function for testing
        function simpleLogout() {
            console.log('Simple logout called');
            console.log('UTPApp available:', !!window.UTPApp);
            console.log('UTPApp.clearUserData available:', !!window.UTPApp?.clearUserData);
            
            // Clear all local data
            localStorage.clear();
            sessionStorage.clear();
            
            // Update UI
            const authButtons = document.getElementById('auth-buttons');
            const userMenu = document.getElementById('user-menu');
            
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
            
            // Show notification
            if (window.UTPApp && window.UTPApp.showNotification) {
                window.UTPApp.showNotification('Signed out successfully', 'success');
            } else {
                alert('Signed out successfully');
            }
            
            // Reload page
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }

        // Test function to check UTPApp
        function testUTPApp() {
            console.log('=== UTPApp Test ===');
            console.log('window.UTPApp:', window.UTPApp);
            console.log('UTPApp.clearUserData:', window.UTPApp?.clearUserData);
            console.log('UTPApp.showNotification:', window.UTPApp?.showNotification);
            console.log('UTPApp.getUserData:', window.UTPApp?.getUserData);
            console.log('UTPApp.saveUserData:', window.UTPApp?.saveUserData);
            
            if (window.UTPApp && window.UTPApp.clearUserData) {
                console.log('✅ UTPApp is working correctly');
                try {
                    window.UTPApp.clearUserData();
                    console.log('✅ clearUserData executed successfully');
                } catch (error) {
                    console.error('❌ Error calling clearUserData:', error);
                }
            } else {
                console.error('❌ UTPApp or clearUserData not available');
            }
        }
        updateUIForAuthState(userData);
    } else {
        console.log('No local user data found');
    }
}

function updateUIForAuthState(user) {
    const authButtonsContainer = document.getElementById('auth-buttons');
    const userMenu = document.querySelector('.user-menu') || document.getElementById('user-menu') || document.querySelector('.profile-dropdown-container');
    const existingLogout = document.querySelector('.nav-menu .logout-btn');

    if (user) {
        // Hide Login/Sign-in buttons
        if (authButtonsContainer) authButtonsContainer.style.display = 'none';

        // Show user menu if it exists
        if (userMenu) {
            userMenu.style.display = 'block';
            const userName = userMenu.querySelector('.user-name');
            if (userName) {
                userName.textContent = user.displayName || user.name || user.email || 'User';
            }
        }

        // Ensure avatar dropdown with Logout exists
        ensureUserDropdown(user);
        // Run again shortly after to avoid races with DOM updates on some pages
        setTimeout(() => ensureUserDropdown(user), 200);

        // Do not add a Logout link in the navbar; keep it only inside the profile dropdown
    } else {
        // Show Login/Sign-in buttons
        if (authButtonsContainer) authButtonsContainer.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        removeLogoutButton();
        removeUserDropdown();
    }
}

function addLogoutButton() {
    // Already present
    if (document.querySelector('.nav-menu .logout-btn') || document.querySelector('.user-dropdown .logout-btn')) return;

    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;

    const a = document.createElement('a');
    a.href = '#';
    a.className = 'nav-link logout-btn';
    a.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
    a.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
    navMenu.appendChild(a);
}

function removeLogoutButton() {
    const logoutBtn = document.querySelector('.nav-menu .logout-btn');
    if (logoutBtn) logoutBtn.remove();
}

// Helper: make links work from both root (index.html) and pages/*.html
function getRelative(targetPath) {
    try {
        const path = (location.pathname || '');
        // If we're already inside /pages/, strip the leading 'pages/'
        if (path.includes('/pages/')) {
            return targetPath.replace(/^pages\//, '');
        }
        return targetPath;
    } catch { return targetPath; }
}

// Create a simple dropdown under the avatar with Logout
function ensureUserDropdown(user){
    // Determine the host container (prefer the new profile container)
    let host = document.querySelector('.profile-dropdown-container');
    if (!host) host = document.querySelector('.user-menu') || document.querySelector('.user-profile');
    if (!host) return;

    // Ensure host is positioned for absolute dropdown
    const hostStyle = window.getComputedStyle(host);
    if (hostStyle.position === 'static') host.style.position = 'relative';

    // Derive user signals (photo/initials and name)
    const local = (window.UTPApp?.getUserData && window.UTPApp.getUserData()) || {};
    const auth = window.FirebaseService?.auth?.();
    const photo = auth?.currentUser?.photoURL || local.photoURL || local.avatarUrl;
    const displayName = (user?.displayName || user?.name || local.displayName || local.name || local.fullName || local.email || 'User');
    const initials = String(displayName).trim().split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || 'U';

    // Find/create the trigger and avatar
    let trigger = host.querySelector('.profile-trigger');
    if (!trigger) {
        trigger = document.createElement('div');
        trigger.className = 'profile-trigger';
        trigger.style.display = 'flex';
        trigger.style.alignItems = 'center';
        trigger.style.gap = '8px';
        trigger.style.cursor = 'pointer';
        trigger.style.padding = '6px 12px';
        trigger.style.borderRadius = '8px';
        trigger.style.transition = 'all 0.3s ease';
        host.appendChild(trigger);
    }

    let avatar = trigger.querySelector('.profile-circle, .profile-avatar');
    if (!avatar) {
        avatar = document.createElement('div');
        avatar.className = 'profile-circle';
        avatar.style.width = '32px';
        avatar.style.height = '32px';
        avatar.style.borderRadius = '50%';
        avatar.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
        avatar.style.color = '#fff';
        avatar.style.display = 'flex';
        avatar.style.alignItems = 'center';
        avatar.style.justifyContent = 'center';
        avatar.style.fontWeight = '700';
        avatar.style.fontSize = '0.85rem';
        avatar.style.overflow = 'hidden';
        trigger.insertBefore(avatar, trigger.firstChild);
    }
    // Apply photo or initials
    if (photo) {
        avatar.style.backgroundImage = `url('${photo}')`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.textContent = '';
    } else {
        avatar.style.backgroundImage = 'none';
        avatar.textContent = initials;
    }

    // Ensure a chevron arrow exists
    // Only add initials text if there's no existing profile structure
    let initialsEl = trigger.querySelector('.profile-initials');
    const hasExistingProfile = trigger.querySelector('.profile-name');
    if (!initialsEl && !hasExistingProfile) {
        initialsEl = document.createElement('span');
        initialsEl.className = 'profile-initials';
        initialsEl.style.fontWeight = '700';
        initialsEl.style.color = '#4f46e5';
        initialsEl.style.letterSpacing = '0.5px';
        initialsEl.style.marginLeft = '4px';
        initialsEl.style.whiteSpace = 'nowrap';
        trigger.appendChild(initialsEl);
        initialsEl.textContent = initials;
    }

    let nameEl = trigger.querySelector('.profile-name');
    const fullName = String(displayName) || 'User';
    if (!nameEl) {
        nameEl = document.createElement('span');
        nameEl.className = 'profile-name';
        nameEl.style.fontWeight = '600';
        nameEl.style.color = '#374151';
        nameEl.style.whiteSpace = 'nowrap';
        nameEl.style.marginLeft = '6px';
        trigger.appendChild(nameEl);
    }
    nameEl.textContent = fullName;

    let arrow = trigger.querySelector('.dropdown-arrow');
    if (!arrow) {
        arrow = document.createElement('i');
        arrow.className = 'fas fa-chevron-down dropdown-arrow';
        arrow.style.fontSize = '0.75rem';
        arrow.style.color = '#6b7280';
        arrow.style.transition = 'transform 0.3s ease';
        trigger.appendChild(arrow);
    }

    // Create or reuse dropdown container
    let dropdown = host.querySelector('.profile-menu, .user-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'profile-menu';
        // Base styles (kept inline for reliability across pages)
        dropdown.style.position = 'absolute';
        dropdown.style.top = '100%';
        dropdown.style.right = '0';
        dropdown.style.background = '#fff';
        dropdown.style.border = '1px solid rgba(0,0,0,0.08)';
        dropdown.style.borderRadius = '12px';
        dropdown.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
        dropdown.style.minWidth = '220px';
        dropdown.style.zIndex = '1000';
        dropdown.style.padding = '8px 0';
        dropdown.style.display = 'none';
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-10px)';
        dropdown.style.transition = 'all 0.3s ease';
        host.appendChild(dropdown);
    }

    // Determine lock state for Career Simulation
    const hasCertificate = !!(local.hasCertificate || local.certificateEarned || local.profile?.certificate || local.learning?.completed || local.learning?.certificate);

    // Build menu items
    const menu = [
        { href: getRelative('pages/dashboard.html'), icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
        { href: getRelative('pages/results.html'), icon: 'fas fa-chart-bar', label: 'Results' },
        { href: getRelative('pages/learning-path.html'), icon: 'fas fa-graduation-cap', label: 'Learning' },
        { href: getRelative('pages/simulation.html'), icon: 'fas fa-briefcase', label: 'Career Simulation', locked: false, tooltip: '' }
    ];

    const currentPage = (location.pathname || '').split('/').pop();
    dropdown.innerHTML = menu.map(item => {
        const active = (item.href.split('/').pop() === currentPage) ? ' background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff;' : '';
        const lockHtml = item.locked ? ' <i class="fas fa-lock" style="margin-left:auto;color:#9CA3AF" title="'+(item.tooltip||'Locked')+'"></i>' : '';
        const aria = item.locked ? 'aria-disabled="true"' : '';
        return `
            <a href="${item.locked ? '#' : item.href}" class="menu-item" ${aria}
               style="display:flex;align-items:center;gap:12px;padding:12px 16px;color:#374151;text-decoration:none;transition:all .3s ease;${active}">
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
                ${lockHtml}
            </a>
        `;
    }).join('') + `
        <div style="height:1px;background:rgba(0,0,0,0.08);margin:8px 0;"></div>
        <a href="#" class="menu-item logout-btn" style="display:flex;align-items:center;gap:12px;padding:12px 16px;color:#dc3545;text-decoration:none;transition:all .3s ease;">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
        </a>
    `;

    // Wire menu behavior
    const logoutEl = dropdown.querySelector('.logout-btn');
    if (logoutEl) logoutEl.onclick = (e) => { e.preventDefault(); handleLogout(); hideUserDropdown(); };

    // Lock handling for Career Simulation item
    const simItem = Array.from(dropdown.querySelectorAll('.menu-item')).find(a => a.textContent.includes('Career Simulation'));
    if (simItem && simItem.getAttribute('aria-disabled') === 'true') {
        simItem.addEventListener('click', (e) => {
            e.preventDefault();
            window.UTPApp?.showNotification('Complete your Learning Path to unlock Career Simulation', 'warning');
        });
        simItem.style.opacity = '0.7';
        simItem.style.cursor = 'not-allowed';
    }

    // Hover highlights for menu items
    const items = dropdown.querySelectorAll('.menu-item');
    items.forEach(item => {
        const isLogout = item.classList.contains('logout-btn');
        const isActive = (item.style.background || '').includes('linear-gradient');

        item.addEventListener('mouseenter', () => {
            if (isLogout) {
                item.style.background = '#fee';
                item.style.color = '#dc3545';
            } else if (!isActive) {
                item.style.background = 'rgba(99, 102, 241, 0.1)';
                item.style.color = '#6366f1';
            }
            item.style.transform = 'translateX(4px)';
        });

        item.addEventListener('mouseleave', () => {
            if (isLogout) {
                item.style.background = 'transparent';
                item.style.color = '#374151';
            } else if (!isActive) {
                item.style.background = 'transparent';
                item.style.color = '#374151';
            }
            item.style.transform = 'translateX(0)';
        });
    });

    // Show/hide helpers with animation
    const showMenu = () => {
        document.querySelectorAll('.profile-menu, .user-dropdown').forEach(d => { d.style.opacity = '0'; d.style.transform = 'translateY(-10px)'; d.style.display = 'none'; });
        dropdown.style.display = 'block';
        requestAnimationFrame(() => {
            dropdown.style.opacity = '1';
            dropdown.style.transform = 'translateY(0)';
            arrow.style.transform = 'rotate(180deg)';
        });
    };
    const hideMenu = () => {
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-10px)';
        arrow.style.transform = 'rotate(0deg)';
        setTimeout(() => { dropdown.style.display = 'none'; }, 250);
    };

    // Toggle on click
    trigger.onclick = (e) => {
        e.stopPropagation();
        const open = dropdown.style.display === 'block';
        if (open) hideMenu(); else showMenu();
    };

    // Hover behavior for desktop
    let hoverTimeout;
    host.onmouseenter = () => { clearTimeout(hoverTimeout); showMenu(); };
    host.onmouseleave = () => { hoverTimeout = setTimeout(hideMenu, 200); };

    // Outside click to close
    if (!ensureUserDropdown._outsideBound) {
        document.addEventListener('click', (e) => {
            if (!host.contains(e.target)) hideMenu();
        });
        ensureUserDropdown._outsideBound = true;
    }
}

function hideUserDropdown(){
    // Hide legacy dropdowns
    document.querySelectorAll('.user-dropdown').forEach(d=> d.style.display = 'none');
    // Hide new profile menus with animation
    document.querySelectorAll('.profile-menu').forEach(d=> {
        d.style.opacity = '0';
        d.style.transform = 'translateY(-10px)';
        setTimeout(() => { d.style.display = 'none'; }, 200);
    });
}

function removeUserDropdown(){
    document.querySelectorAll('.user-dropdown').forEach(d=> d.remove());
}

// Helper: Refresh UI based on best-known auth state
function refreshAuthUI() {
    try {
        let user = null;
        if (window.FirebaseService && window.FirebaseService.auth) {
            const auth = window.FirebaseService.auth();
            user = auth ? auth.currentUser : null;
        }
        if (!user) {
            const local = window.UTPApp?.getUserData?.();
            // Consider logged out if no uid/email present
            if (!local || (!local.uid && !local.email)) user = null; else user = local;
        }
        updateUIForAuthState(user);
    } catch (e) {
        // Fallback: assume logged out
        updateUIForAuthState(null);
    }
}

// Helper: Force logged-out visuals regardless of any races
function forceLoggedOutUI() {
    try {
        const authButtonsContainer = document.getElementById('auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        if (authButtonsContainer) authButtonsContainer.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        removeLogoutButton();
        removeUserDropdown();
    } catch {}
}

async function handleLogout() {
    try {
        // Show loading
        UTPApp.showNotification('Signing out...', 'info');
        
        // Sign out from Firebase
        if (window.FirebaseService && window.FirebaseService.auth()) {
            await window.FirebaseService.auth().signOut();
        }
        
        // Clear local data
        UTPApp.clearUserData();
        
        // Update UI
        updateUIForAuthState(null);
        
        // Show success message
        UTPApp.showNotification('Successfully signed out', 'success');
        
        // Enforce UI immediately on current page
        forceLoggedOutUI();
        // Redirect to home page with a flag so UI shows Login immediately
        setTimeout(() => {
            const url = new URL('/index.html', window.location.origin);
            url.searchParams.set('loggedOut', '1');
            window.location.href = url.toString();
        }, 800);
        
    } catch (error) {
        console.error('Logout error:', error);
        UTPApp.showNotification('Error signing out. Please try again.', 'error');
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function showLoading(element) {
    element.classList.add('loading');
    element.disabled = true;
}

function hideLoading(element) {
    element.classList.remove('loading');
    element.disabled = false;
}

// Form validation utilities
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

function validateRequired(value) {
    return value && value.trim().length > 0;
}

// API simulation functions (for demo purposes)
async function simulateAPI(endpoint, data = null, delay = 1000) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate different API responses
            switch (endpoint) {
                case 'sendOTP':
                    resolve({ success: true, message: 'OTP sent successfully' });
                    break;
                case 'verifyOTP':
                    resolve({ success: true, message: 'OTP verified successfully' });
                    break;
                case 'saveProfile':
                    resolve({ success: true, message: 'Profile saved successfully' });
                    break;
                case 'submitTest':
                    resolve({ 
                        success: true, 
                        results: generateMockTestResults(),
                        message: 'Test submitted successfully' 
                    });
                    break;
                default:
                    resolve({ success: true, data: {} });
            }
        }, delay);
    });
}

function generateMockTestResults() {
    return {
        personality: {
            type: 'Analytical Thinker',
            score: 85,
            traits: ['Logical', 'Detail-oriented', 'Problem-solver']
        },
        analytical: {
            score: 92,
            strengths: ['Pattern recognition', 'Critical thinking', 'Data analysis']
        },
        communication: {
            score: 78,
            strengths: ['Written communication', 'Clarity', 'Structure']
        },
        emotional: {
            score: 81,
            strengths: ['Empathy', 'Self-awareness', 'Stress management']
        },
        simulation: {
            score: 88,
            strengths: ['Decision making', 'Strategic thinking', 'Leadership']
        },
        recommendations: [
            {
                tier: 'S',
                career: 'Data Scientist',
                match: 94,
                description: 'Perfect match for your analytical and problem-solving skills',
                pathway: ['Statistics/Mathematics Degree', 'Python/R Programming', 'Machine Learning', 'Industry Experience']
            },
            {
                tier: 'S',
                career: 'Software Engineer',
                match: 91,
                description: 'Excellent fit for your logical thinking and technical aptitude',
                pathway: ['Computer Science Degree', 'Programming Languages', 'Software Development', 'Specialization']
            },
            {
                tier: 'A',
                career: 'Business Analyst',
                match: 87,
                description: 'Great match for your analytical and communication skills',
                pathway: ['Business/Analytics Degree', 'Data Analysis Tools', 'Business Knowledge', 'Certification']
            }
        ]
    };
}

// Add additional functions to the existing UTPApp object
Object.assign(window.UTPApp, {
    startJourney,
    learnMore,
    openParentGuide,
    openFAQ,
    openHelp,
    openPrivacy,
    showLoading,
    hideLoading,
    validateEmail,
    validatePhone,
    validateRequired
});

// Contact form functionality
function submitContactForm(event) {
    event.preventDefault();
    
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value;
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    // Simulate form submission
    setTimeout(() => {
        showNotification('Thank you! Your message has been sent successfully. We\'ll get back to you within 24 hours.', 'success');
        
        // Reset form
        document.getElementById('contact-form').reset();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

// Simple and reliable logout function
function reliableLogout() {
    console.log('=== Reliable Logout Started ===');
    
    try {
        // Step 1: Clear localStorage
        console.log('Clearing localStorage...');
        localStorage.clear();
        
        // Step 2: Clear sessionStorage  
        console.log('Clearing sessionStorage...');
        sessionStorage.clear();
        
        // Step 3: Update UI immediately
        console.log('Updating UI...');
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        
        if (authButtons) {
            authButtons.style.display = 'flex';
            console.log('✅ Auth buttons shown');
        }
        
        if (userMenu) {
            userMenu.style.display = 'none';
            console.log('✅ User menu hidden');
        }
        
        // Step 4: Try Firebase logout (optional)
        if (window.FirebaseService && window.FirebaseService.auth) {
            try {
                const auth = window.FirebaseService.auth();
                if (auth && auth.currentUser) {
                    auth.signOut().then(() => {
                        console.log('✅ Firebase logout successful');
                    }).catch((error) => {
                        console.log('⚠️ Firebase logout failed:', error);
                    });
                }
            } catch (fbError) {
                console.log('⚠️ Firebase not available:', fbError);
            }
        }
        
        // Step 5: Show success message
        alert('Successfully logged out!');
        
        // Step 6: Reload page
        console.log('Reloading page...');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
        console.log('=== Reliable Logout Completed ===');
        
    } catch (error) {
        console.error('❌ Logout error:', error);
        alert('Logout completed with errors. Page will reload.');
        window.location.reload();
    }
}

// Make functions globally available
window.handleLogout = handleLogout;
window.simpleLogout = simpleLogout;
window.reliableLogout = reliableLogout;
window.testUTPApp = function() {
    console.log('=== UTPApp Test ===');
    console.log('window.UTPApp:', !!window.UTPApp);
    if (window.UTPApp) {
        console.log('clearUserData:', typeof window.UTPApp.clearUserData);
        console.log('showNotification:', typeof window.UTPApp.showNotification);
        console.log('getUserData:', typeof window.UTPApp.getUserData);
        console.log('saveUserData:', typeof window.UTPApp.saveUserData);
    }
};
window.openParentGuide = openParentGuide;
window.openFAQ = openFAQ;
window.openHelp = openHelp;
window.openPrivacy = openPrivacy;
window.submitContactForm = submitContactForm;
// Expose UI helpers for other pages (e.g., dashboard)
window.ensureUserDropdown = ensureUserDropdown;
window.addLogoutButton = addLogoutButton;
window.hideUserDropdown = hideUserDropdown;
window.removeUserDropdown = removeUserDropdown;
