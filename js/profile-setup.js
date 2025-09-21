// Profile Setup JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initProfileSetup();
});

function initProfileSetup() {
    console.log('Initializing profile setup...');
    
    // Check if user is authenticated
    checkAuthState();
    
    // Initialize form validation
    initFormValidation();
    
    // Load existing profile data if any
    loadExistingProfile();
}

function checkAuthState() {
    const userData = UTPApp.getUserData();
    if (!userData) {
        console.log('User not authenticated, redirecting to home for login modal');
        window.location.href = '../index.html';
        return;
    }
    
    // Update user name in navbar
    const userName = document.querySelector('.user-name');
    if (userName && userData.displayName) {
        userName.textContent = userData.displayName.split(' ')[0];
    }
    
    console.log('User authenticated:', userData);
}

function initFormValidation() {
    const form = document.getElementById('profile-form');
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Remove existing error
    clearFieldError(event);
    
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Specific validations
    switch (field.type) {
        case 'email':
            if (value && !isValidEmail(value)) {
                showFieldError(field, 'Please enter a valid email address');
                return false;
            }
            break;
        case 'tel':
            if (value && !isValidPhone(value)) {
                showFieldError(field, 'Please enter a valid phone number');
                return false;
            }
            break;
        case 'date':
            if (value && !isValidAge(value)) {
                showFieldError(field, 'Please enter a valid date (age must be between 13-100)');
                return false;
            }
            break;
    }
    
    return true;
}

function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    const existingError = formGroup.querySelector('.field-error');
    
    if (existingError) {
        existingError.textContent = message;
    } else {
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        formGroup.appendChild(errorElement);
    }
    
    field.classList.add('error');
}

function clearFieldError(event) {
    const field = event.target;
    const formGroup = field.closest('.form-group');
    const errorElement = formGroup.querySelector('.field-error');
    
    if (errorElement) {
        errorElement.remove();
    }
    
    field.classList.remove('error');
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function isValidAge(dateString) {
    const birthDate = new Date(dateString);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age >= 13 && age <= 100;
}

function loadExistingProfile() {
    const userData = UTPApp.getUserData();
    if (!userData) return;

    const uid = userData.id || userData.uid;
    const localProfile = userData.profile || null;

    // Always show local profile immediately if present
    if (localProfile) populateForm(localProfile);

    // Try fetching from Firestore for authoritative data
    if (window.FirebaseService && uid) {
        window.FirebaseService.getUserProfile(uid)
            .then(profile => {
                if (profile) {
                    populateForm(profile);
                    // Merge to local cache
                    const merged = { ...(UTPApp.getUserData() || {}), profile, profileCompleted: true };
                    UTPApp.saveUserData(merged);
                }
            })
            .catch(err => {
                console.warn('Failed to load profile from Firestore:', err);
                addProfileRetryUI();
            });
    }
}

function populateForm(profile) {
    Object.keys(profile).forEach(key => {
        const field = document.getElementById(key);
        if (field) {
            if (field.type === 'checkbox') {
                if (Array.isArray(profile[key])) {
                    profile[key].forEach(value => {
                        const checkbox = document.querySelector(`input[name="${key}"][value="${value}"]`);
                        if (checkbox) checkbox.checked = true;
                    });
                }
            } else {
                field.value = profile[key];
            }
        }
    });
}

function addProfileRetryUI() {
    const noticeId = 'profile-fetch-error';
    if (document.getElementById(noticeId)) return;
    const container = document.querySelector('.path-header-section, .learning-container, body');
    const banner = document.createElement('div');
    banner.id = noticeId;
    banner.style.margin = '12px 0';
    banner.style.padding = '10px 14px';
    banner.style.border = '1px solid var(--gray-200)';
    banner.style.borderRadius = '8px';
    banner.style.background = 'var(--gray-50)';
    banner.innerHTML = `Failed to fetch saved profile. <button id="retry-profile" class="btn btn-secondary" style="padding:6px 10px">Retry</button>`;
    container.prepend(banner);
    document.getElementById('retry-profile').onclick = () => {
        banner.remove();
        loadExistingProfile();
    };
}

async function submitProfile(event) {
    event.preventDefault();
    
    console.log('Submitting profile...');
    
    // Validate form
    if (!validateForm()) {
        UTPApp.showNotification('Please fill in all required fields correctly', 'error');
        return;
    }
    
    // Show loading
    showLoading('Saving your profile...');
    
    try {
        // Collect form data
        const profileData = collectFormData();
        
        // Save profile data
        await saveProfile(profileData);
        
        // Update user data
        const userData = UTPApp.getUserData();
        userData.profile = profileData;
        userData.profileCompleted = true;
        UTPApp.saveUserData(userData);
        
        // Show success message
        UTPApp.showNotification('Profile saved successfully!', 'success');
        
        // Redirect to assessment after delay
        setTimeout(() => {
            window.location.href = 'test.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error saving profile:', error);
        UTPApp.showNotification('Error saving profile. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function validateForm() {
    const form = document.getElementById('profile-form');
    const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    return isValid;
}

function collectFormData() {
    const form = document.getElementById('profile-form');
    const formData = new FormData(form);
    const profileData = {};
    
    // Collect regular form fields
    for (let [key, value] of formData.entries()) {
        if (key === 'interests') {
            if (!profileData.interests) profileData.interests = [];
            profileData.interests.push(value);
        } else {
            profileData[key] = value;
        }
    }
    
    // Add timestamp
    profileData.createdAt = new Date().toISOString();
    profileData.updatedAt = new Date().toISOString();
    
    return profileData;
}

async function saveProfile(profileData) {
    const userData = UTPApp.getUserData() || {};
    const uid = userData.id || userData.uid;

    // Save to Firestore if available
    try {
        if (window.FirebaseService && uid) {
            await window.FirebaseService.saveUserProfile(uid, profileData);
        }
    } catch (err) {
        console.warn('Failed to save profile to Firestore, will keep local copy:', err);
    }

    // Always save to local storage as backup
    const existingData = UTPApp.getUserData() || {};
    existingData.profile = profileData;
    existingData.profileCompleted = true;
    UTPApp.saveUserData(existingData);
}

function skipProfile() {
    if (confirm('Are you sure you want to skip profile setup? You can complete it later from your account settings.')) {
        // Mark profile as skipped
        const userData = UTPApp.getUserData();
        userData.profileSkipped = true;
        UTPApp.saveUserData(userData);
        
        UTPApp.showNotification('Profile setup skipped. You can complete it later.', 'info');
        
        // Redirect to assessment
        setTimeout(() => {
            window.location.href = 'test.html';
        }, 1500);
    }
}

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const messageElement = overlay.querySelector('p');
    
    if (messageElement) {
        messageElement.textContent = message;
    }
    
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = 'none';
}

// Make functions globally available
window.submitProfile = submitProfile;
window.skipProfile = skipProfile;
