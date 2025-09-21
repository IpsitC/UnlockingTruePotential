// Authentication JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initAuthPage();
});

let currentPhone = '';
let otpTimer = null;
let timerSeconds = 60;

// Phone validation function
function validatePhoneNumber(phone) {
    // Remove any non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (typically 10 digits for most countries)
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        return false;
    }
    
    // Check if it contains only digits (after cleaning)
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(cleanPhone);
}

function initAuthPage() {
    initFormToggle();
    initPhoneForm();
    initOTPForm();
    initLoginForm();
    initEmailRegisterForm();
    initOTPInput();
    initPhoneFormatting();
    initGoogleCloudAI();
    initFirebaseAuth();
}

// Phone number formatting
function initPhoneFormatting() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    console.log('Found phone inputs:', phoneInputs.length); // Debug log
    phoneInputs.forEach(input => {
        console.log('Adding listeners to:', input.id); // Debug log
        input.addEventListener('input', formatPhoneInput);
        input.addEventListener('keypress', validatePhoneKeypress);
        
        // Add visual feedback that formatting is active
        input.addEventListener('focus', function() {
            this.style.borderColor = 'var(--primary-color)';
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.style.borderColor = 'var(--gray-200)';
            }
        });
    });
}

function formatPhoneInput(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Limit to 15 digits max
    if (value.length > 15) {
        value = value.substring(0, 15);
    }
    
    // Format based on length (basic formatting)
    if (value.length >= 10) {
        // Format as: 1234567890 -> 123-456-7890
        value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (value.length >= 6) {
        // Format as: 123456 -> 123-456
        value = value.replace(/(\d{3})(\d{3})/, '$1-$2');
    } else if (value.length >= 3) {
        // Format as: 123 -> 123-
        value = value.replace(/(\d{3})/, '$1-');
    }
    
    e.target.value = value;
}

function validatePhoneKeypress(e) {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
        return;
    }
    
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
    }
}

// Form toggle functionality
function initFormToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const authForms = document.querySelectorAll('.auth-form');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetForm = btn.getAttribute('data-form');
            
            // Update toggle buttons
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update forms
            authForms.forEach(form => form.classList.remove('active'));
            document.getElementById(`${targetForm}-form`).classList.add('active');
        });
    });
}

// Phone form handling
function initPhoneForm() {
    const phoneForm = document.getElementById('phone-form');
    if (phoneForm) {
        phoneForm.addEventListener('submit', handlePhoneSubmit);
    }
}

async function handlePhoneSubmit(e) {
    e.preventDefault();
    
    const phoneInput = document.getElementById('phone');
    const countryCode = document.getElementById('country-code').value;
    const phone = phoneInput.value.trim();
    
    // Validate phone number
    if (!validatePhoneNumber(phone)) {
        showFieldError(phoneInput, 'Please enter a valid phone number (10-15 digits)');
        return;
    }
    
    currentPhone = countryCode + phone;
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    try {
        // Simulate API call
        const response = await UTPApp.simulateAPI('sendOTP', { phone: currentPhone });
        
        if (response.success) {
            // Show success and move to OTP step
            showFieldSuccess(phoneInput, 'Verification code sent successfully!');
            setTimeout(() => {
                showOTPStep();
            }, 1000);
        } else {
            showFieldError(phoneInput, response.message || 'Failed to send verification code');
        }
    } catch (error) {
        showFieldError(phoneInput, 'Network error. Please try again.');
    } finally {
        hideLoading(submitBtn);
    }
}

// OTP form handling
function initOTPForm() {
    const otpForm = document.getElementById('otp-form');
    if (otpForm) {
        otpForm.addEventListener('submit', handleOTPSubmit);
    }
}

async function handleOTPSubmit(e) {
    e.preventDefault();
    
    const otpDigits = document.querySelectorAll('.otp-digit');
    const otp = Array.from(otpDigits).map(digit => digit.value).join('');
    
    // Validate OTP
    if (otp.length !== 6) {
        showOTPError('Please enter the complete 6-digit code');
        return;
    }
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    try {
        // Simulate API call
        const response = await UTPApp.simulateAPI('verifyOTP', { phone: currentPhone, otp });
        
        if (response.success) {
            // Save user data and redirect
            UTPApp.saveUserData({ 
                phone: currentPhone, 
                verified: true,
                registrationDate: new Date().toISOString()
            });
            
            showOTPSuccess('Phone verified successfully!');
            setTimeout(() => {
                window.location.href = 'profile-setup.html';
            }, 1500);
        } else {
            showOTPError(response.message || 'Invalid verification code');
        }
    } catch (error) {
        showOTPError('Network error. Please try again.');
    } finally {
        hideLoading(submitBtn);
    }
}

// Login form handling
function initLoginForm() {
    const emailLoginForm = document.getElementById('email-login-form');
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', handleEmailLoginSubmit);
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const phoneInput = document.getElementById('login-phone');
    const countryCode = document.getElementById('login-country-code').value;
    const phone = phoneInput.value.trim();
    
    // Validate phone number
    if (!validatePhoneNumber(phone)) {
        showFieldError(phoneInput, 'Please enter a valid phone number (10-15 digits)');
        return;
    }
    
    const fullPhone = countryCode + phone;
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    try {
        // Check if user exists (simulate)
        const userData = UTPApp.getUserData();
        if (userData.phone === fullPhone) {
            // User exists, send OTP
            const response = await UTPApp.simulateAPI('sendOTP', { phone: fullPhone });
            
            if (response.success) {
                currentPhone = fullPhone;
                showFieldSuccess(phoneInput, 'Login code sent successfully!');
                
                // Switch to register form and show OTP step
                setTimeout(() => {
                    document.querySelector('[data-form="register"]').click();
                    showOTPStep();
                }, 1000);
            } else {
                showFieldError(phoneInput, 'Failed to send login code');
            }
        } else {
            showFieldError(phoneInput, 'Phone number not found. Please register first.');
        }
    } catch (error) {
        showFieldError(phoneInput, 'Network error. Please try again.');
    } finally {
        hideLoading(submitBtn);
    }
}

// OTP input handling
function initOTPInput() {
    const otpDigits = document.querySelectorAll('.otp-digit');
    
    otpDigits.forEach((digit, index) => {
        digit.addEventListener('input', (e) => {
            const value = e.target.value;
            
            // Only allow numbers
            if (!/^\d$/.test(value)) {
                e.target.value = '';
                return;
            }
            
            // Move to next digit
            if (value && index < otpDigits.length - 1) {
                otpDigits[index + 1].focus();
            }
            
            // Auto-submit when all digits are filled
            const allFilled = Array.from(otpDigits).every(d => d.value);
            if (allFilled) {
                setTimeout(() => {
                    document.getElementById('otp-form').dispatchEvent(new Event('submit'));
                }, 500);
            }
        });
        
        digit.addEventListener('keydown', (e) => {
            // Handle backspace
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpDigits[index - 1].focus();
            }
        });
        
        digit.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text');
            const digits = pastedData.replace(/\D/g, '').slice(0, 6);
            
            digits.split('').forEach((digit, i) => {
                if (otpDigits[i]) {
                    otpDigits[i].value = digit;
                }
            });
            
            // Focus on the next empty digit or last digit
            const nextEmpty = Array.from(otpDigits).findIndex(d => !d.value);
            if (nextEmpty !== -1) {
                otpDigits[nextEmpty].focus();
            } else {
                otpDigits[otpDigits.length - 1].focus();
            }
        });
    });
}

// Show OTP step
function showOTPStep() {
    // Hide phone step, show OTP step
    document.getElementById('phone-step').classList.remove('active');
    document.getElementById('otp-step').classList.add('active');
    
    // Update phone display
    document.getElementById('phone-display').textContent = currentPhone;
    
    // Start timer
    startOTPTimer();
    
    // Focus first OTP digit
    document.querySelector('.otp-digit').focus();
}

// OTP timer
function startOTPTimer() {
    timerSeconds = 60;
    const timerElement = document.getElementById('timer');
    const timerContainer = document.querySelector('.otp-timer');
    const resendBtn = document.querySelector('.otp-actions .btn-secondary');
    
    timerContainer.style.display = 'block';
    resendBtn.disabled = true;
    resendBtn.style.opacity = '0.5';
    
    otpTimer = setInterval(() => {
        timerSeconds--;
        timerElement.textContent = timerSeconds;
        
        if (timerSeconds <= 0) {
            clearInterval(otpTimer);
            timerContainer.style.display = 'none';
            resendBtn.disabled = false;
            resendBtn.style.opacity = '1';
        }
    }, 1000);
}

// Resend OTP
async function resendOTP() {
    const resendBtn = document.querySelector('.otp-actions .btn-secondary');
    showLoading(resendBtn);
    
    try {
        const response = await UTPApp.simulateAPI('sendOTP', { phone: currentPhone });
        
        if (response.success) {
            UTPApp.showNotification('Verification code sent again!', 'success');
            startOTPTimer();
            
            // Clear OTP inputs
            document.querySelectorAll('.otp-digit').forEach(digit => {
                digit.value = '';
            });
            document.querySelector('.otp-digit').focus();
        } else {
            UTPApp.showNotification('Failed to resend code. Please try again.', 'error');
        }
    } catch (error) {
        UTPApp.showNotification('Network error. Please try again.', 'error');
    } finally {
        hideLoading(resendBtn);
    }
}

// Continue as guest
function continueAsGuest() {
    UTPApp.saveUserData({ 
        isGuest: true,
        guestId: 'guest_' + Date.now(),
        registrationDate: new Date().toISOString()
    });
    
    UTPApp.showNotification('Continuing as guest. You can register later to save your progress.', 'info');
    
    setTimeout(() => {
        window.location.href = 'profile-setup.html';
    }, 2000);
}

// Field validation helpers
function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.remove('success');
    formGroup.classList.add('error');
    
    // Remove existing error message
    const existingError = formGroup.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    formGroup.appendChild(errorDiv);
    
    // Focus the field
    field.focus();
}

function showFieldSuccess(field, message) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.remove('error');
    formGroup.classList.add('success');
    
    // Remove existing messages
    const existingError = formGroup.querySelector('.form-error');
    const existingSuccess = formGroup.querySelector('.form-success');
    if (existingError) existingError.remove();
    if (existingSuccess) existingSuccess.remove();
    
    // Add success message
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    formGroup.appendChild(successDiv);
}

function clearFieldState(field) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.remove('error', 'success');
    
    const existingError = formGroup.querySelector('.form-error');
    const existingSuccess = formGroup.querySelector('.form-success');
    if (existingError) existingError.remove();
    if (existingSuccess) existingSuccess.remove();
}

// OTP specific helpers
function showOTPError(message) {
    const otpContainer = document.querySelector('.otp-input').parentElement;
    
    // Remove existing error
    const existingError = otpContainer.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorDiv.style.textAlign = 'center';
    errorDiv.style.marginTop = 'var(--spacing-md)';
    otpContainer.appendChild(errorDiv);
    
    // Shake animation for OTP digits
    document.querySelectorAll('.otp-digit').forEach(digit => {
        digit.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            digit.style.animation = '';
        }, 500);
    });
}

function showOTPSuccess(message) {
    const otpContainer = document.querySelector('.otp-input').parentElement;
    
    // Remove existing messages
    const existingError = otpContainer.querySelector('.form-error');
    const existingSuccess = otpContainer.querySelector('.form-success');
    if (existingError) existingError.remove();
    if (existingSuccess) existingSuccess.remove();
    
    // Add success message
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    successDiv.style.textAlign = 'center';
    successDiv.style.marginTop = 'var(--spacing-md)';
    otpContainer.appendChild(successDiv);
    
    // Success animation for OTP digits
    document.querySelectorAll('.otp-digit').forEach((digit, index) => {
        setTimeout(() => {
            digit.style.animation = 'bounceIn 0.3s ease-in-out';
            digit.style.borderColor = 'var(--success-color)';
        }, index * 100);
    });
}

// Loading overlay
function showLoadingOverlay() {
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoadingOverlay() {
    document.getElementById('loading-overlay').classList.remove('active');
}

// OAuth Login Functions
async function signInWithGoogle() {
    showLoadingOverlay();
    
    try {
        // Simulate Google OAuth
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate successful login
        const userData = {
            email: 'user@gmail.com',
            name: 'John Doe',
            loginMethod: 'google',
            loginDate: new Date().toISOString()
        };
        
        UTPApp.saveUserData(userData);
        UTPApp.showNotification('Successfully signed in with Google!', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        UTPApp.showNotification('Google sign-in failed. Please try again.', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

async function signInWithMicrosoft() {
    showLoadingOverlay();
    
    try {
        // Simulate Microsoft OAuth
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const userData = {
            email: 'user@outlook.com',
            name: 'Jane Smith',
            loginMethod: 'microsoft',
            loginDate: new Date().toISOString()
        };
        
        UTPApp.saveUserData(userData);
        UTPApp.showNotification('Successfully signed in with Microsoft!', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        UTPApp.showNotification('Microsoft sign-in failed. Please try again.', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

async function signInWithGitHub() {
    showLoadingOverlay();
    
    try {
        // Simulate GitHub OAuth
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const userData = {
            email: 'user@github.com',
            name: 'Alex Developer',
            loginMethod: 'github',
            loginDate: new Date().toISOString()
        };
        
        UTPApp.saveUserData(userData);
        UTPApp.showNotification('Successfully signed in with GitHub!', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        UTPApp.showNotification('GitHub sign-in failed. Please try again.', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

// Email Login Function
async function handleEmailLoginSubmit(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validate email
    if (!UTPApp.validateEmail(email)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        return;
    }
    
    // Validate password
    if (password.length < 6) {
        showFieldError(passwordInput, 'Password must be at least 6 characters');
        return;
    }
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    try {
        // Simulate login API call
        const response = await UTPApp.simulateAPI('login', { email, password });
        
        if (response.success) {
            // Save user data and redirect
            UTPApp.saveUserData({ 
                email: email,
                loginMethod: 'email',
                loginDate: new Date().toISOString()
            });
            
            showFieldSuccess(emailInput, 'Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showFieldError(emailInput, response.message || 'Invalid email or password');
        }
    } catch (error) {
        showFieldError(emailInput, 'Network error. Please try again.');
    } finally {
        hideLoading(submitBtn);
    }
}

// Password Toggle Function
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.parentElement.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.classList.remove('fa-eye');
        toggle.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        toggle.classList.remove('fa-eye-slash');
        toggle.classList.add('fa-eye');
    }
}

// Forgot Password Function
function forgotPassword() {
    UTPApp.showNotification('Password reset link will be sent to your email', 'info');
}

// Google Cloud AI Integration
let googleCloudAI = null;

async function initGoogleCloudAI() {
    try {
        // Initialize real Google Cloud AI services
        console.log('Initializing Google Cloud AI services...');
        
        if (window.GoogleCloudAI) {
            googleCloudAI = new window.GoogleCloudAI();
            const initialized = await googleCloudAI.initialize();
            
            if (initialized) {
                console.log('Google Cloud AI services initialized successfully');
            } else {
                console.warn('Google Cloud AI initialization failed, using fallback');
                googleCloudAI = createFallbackAI();
            }
        } else {
            console.warn('Google Cloud AI class not found, using fallback');
            googleCloudAI = createFallbackAI();
        }
    } catch (error) {
        console.warn('Google Cloud AI initialization failed:', error);
        googleCloudAI = createFallbackAI();
    }
}

// Fallback AI for when Google Cloud AI is not available
function createFallbackAI() {
    return {
        analyzeSentiment: async (text) => ({
            sentiment: 'positive',
            score: 0.5,
            confidence: 0.75
        }),
        generateWelcomeMessage: async (userProfile) => 
            `Welcome ${userProfile.name}! Let's start your career discovery journey.`,
        generateCareerRecommendations: async (userProfile, assessmentResults) => ({
            recommendations: [
                {
                    category: 'General Recommendations',
                    careers: ['Business Analyst', 'Project Manager', 'Marketing Coordinator'],
                    reason: 'Based on general career trends'
                }
            ],
            analysis: { confidence: 0.5 }
        }),
        analyzeCareerGoals: async (goalsText) => ({
            insights: ['Focus on exploring different career options'],
            recommendations: ['Take our career assessment']
        })
    };
}

// Firebase Authentication Configuration
let firebaseInitialized = false;

async function initFirebaseAuth() {
    try {
        window.Logger.info('Initializing Firebase Authentication');
        
        if (window.FirebaseService) {
            const initialized = await window.FirebaseService.initialize();
            if (initialized) {
                firebaseInitialized = true;
                window.Logger.success('Firebase Authentication initialized successfully');
                
                // Set up auth state listener
                const auth = window.FirebaseService.auth();
                if (auth) {
                    auth.onAuthStateChanged((user) => {
                        if (user) {
                            window.Logger.info('User is signed in', { uid: user.uid, email: user.email });
                        } else {
                            window.Logger.info('User is signed out');
                        }
                    });
                }
            } else {
                window.Logger.warn('Firebase initialization failed, retrying in 3 seconds...');
                setTimeout(initFirebaseAuth, 3000);
            }
        } else {
            window.Logger.warn('Firebase service not available, retrying in 2 seconds...');
            setTimeout(initFirebaseAuth, 2000);
        }
    } catch (error) {
        window.Logger.error('Firebase initialization error', error);
        setTimeout(initFirebaseAuth, 3000);
    }
}

// Handle Google Sign-In response
async function handleGoogleSignIn(response) {
    const startTime = Date.now();
    
    try {
        showLoadingOverlay();
        window.Logger.info('Google Sign-In response received', { hasCredential: !!response.credential });
        window.Logger.trackAction('google_signin_attempt');
        
        // Decode the JWT token to get user info
        const userInfo = parseJwt(response.credential);
        if (!userInfo) {
            throw new Error('Failed to parse Google credential');
        }
        
        window.Logger.info('User info extracted from Google', { 
            email: userInfo.email, 
            name: userInfo.name,
            emailVerified: userInfo.email_verified 
        });
        
        const userData = {
            id: 'google_' + userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            profilePicture: userInfo.picture,
            registrationMethod: 'google',
            registrationDate: new Date().toISOString(),
            emailVerified: userInfo.email_verified
        };
        
        // Use Google Cloud AI to generate personalized welcome content
        if (googleCloudAI) {
            window.Logger.info('Generating AI-powered welcome content');
            const welcomeMessage = await googleCloudAI.generateWelcomeMessage(userData);
            const sentiment = await googleCloudAI.analyzeSentiment(`${userData.name} career development goals`);
            userData.welcomeMessage = welcomeMessage;
            userData.aiAnalysis = sentiment;
            userData.recommendations = ['Take the career assessment', 'Explore learning paths', 'Join community discussions'];
        }
        
        UTPApp.saveUserData(userData);
        window.Logger.success('Google Sign-In completed successfully', { 
            userId: userData.id, 
            email: userData.email,
            duration: Date.now() - startTime 
        });
        window.Logger.trackAction('google_signin_success', { method: 'google', email: userData.email });
        
        UTPApp.showNotification(`Welcome ${userData.name}! Successfully signed in with Google.`, 'success');
        
        setTimeout(() => {
            window.location.href = 'test.html';
        }, 1500);
        
    } catch (error) {
        window.Logger.error('Google Sign-In failed', { 
            error: error.message, 
            stack: error.stack,
            duration: Date.now() - startTime 
        });
        window.Logger.trackAction('google_signin_error', { error: error.message });
        UTPApp.showNotification('Google sign-in failed. Please try again.', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

// Parse JWT token to extract user information
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error parsing JWT token:', error);
        return null;
    }
}

// Firebase Google Authentication
async function registerWithGoogle() {
    const startTime = Date.now();
    
    try {
        window.Logger.info('Initiating Firebase Google registration');
        window.Logger.trackAction('google_register_attempt');
        
        if (!firebaseInitialized) {
            throw new Error('Firebase not initialized');
        }
        
        showLoadingOverlay();
        
        // Sign in with Firebase Google Auth
        const result = await window.FirebaseService.signInWithGoogle();
        
        if (!result || !result.user) {
            throw new Error('Google Sign-In was cancelled or failed');
        }
        
        const isNew = result.additionalUserInfo ? result.additionalUserInfo.isNewUser : false;
        window.Logger.info('Firebase Google Sign-In successful', {
            uid: result.user.uid,
            email: result.user.email,
            isNewUser: isNew
        });
        
        // Save user data to Firestore
        await window.FirebaseService.saveUser({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            emailVerified: result.user.emailVerified
        });
        
        // Generate AI-powered welcome content
        const userData = {
            id: result.user.uid,
            name: result.user.displayName || result.user.email,
            email: result.user.email,
            profilePicture: result.user.photoURL,
            registrationMethod: 'google',
            isNewUser: isNew
        };
        
        if (googleCloudAI) {
            window.Logger.info('Generating AI-powered welcome content');
            const welcomeMessage = await googleCloudAI.generateWelcomeMessage(userData);
            const sentiment = await googleCloudAI.analyzeSentiment(`${userData.name} career development goals`);
            userData.welcomeMessage = welcomeMessage;
            userData.aiAnalysis = sentiment;
        }
        
        // Save to local storage for immediate use
        UTPApp.saveUserData(userData);
        
        window.Logger.success('Google registration completed successfully', {
            uid: result.user.uid,
            duration: Date.now() - startTime,
            isNewUser: result.additionalUserInfo ? result.additionalUserInfo.isNewUser : false
        });
        
        window.Logger.trackAction('google_register_success', { 
            method: 'firebase_google', 
            isNewUser: result.additionalUserInfo ? result.additionalUserInfo.isNewUser : false 
        });
        
        let message;
        if (isNew === true) {
            message = `Welcome ${userData.name}! Your account has been created successfully.`;
        } else if (isNew === false) {
            message = 'Please Login as Returning User. You are already registered. Signing you in...';
        } else {
            message = `Welcome ${userData.name}! Successfully signed in.`;
        }
        
        UTPApp.showNotification(message, 'success');
        
        setTimeout(() => {
            // Check if user has completed profile
            const userData = UTPApp.getUserData();
            if (result.additionalUserInfo && result.additionalUserInfo.isNewUser) {
                // New user - go to profile setup
                window.location.href = 'profile-setup.html';
            } else if (userData && userData.profileCompleted) {
                // Existing user with completed profile - go to test
                window.location.href = 'test.html';
            } else {
                // Existing user without completed profile - go to profile setup
                window.location.href = 'profile-setup.html';
            }
        }, 1500);
        
    } catch (error) {
        window.Logger.error('Firebase Google registration failed', {
            error: error.message,
            code: error.code,
            stack: error.stack,
            duration: Date.now() - startTime
        });
        
        window.Logger.trackAction('google_register_error', { 
            error: error.message,
            code: error.code 
        });
        
        let errorMessage = 'Google sign-in failed. Please try again.';
        
        // Handle specific Firebase errors
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-in was cancelled. Please try again.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Pop-up was blocked. Please allow pop-ups and try again.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        UTPApp.showNotification(errorMessage, 'error');
        
    } finally {
        hideLoadingOverlay();
    }
}

// Firebase Google Login Function
async function signInWithGoogle() {
    // Same function for both registration and login with Firebase
    await registerWithGoogle();
}

// Show Google Sign-In button as fallback
function showGoogleSignInButton() {
    if (typeof google !== 'undefined' && google.accounts) {
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'google-signin-button';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.margin = '20px 0';
        
        google.accounts.id.renderButton(buttonContainer, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular'
        });
        
        // Insert the button after the OAuth section
        const oauthSection = document.querySelector('.oauth-section');
        if (oauthSection && !document.getElementById('google-signin-button')) {
            oauthSection.appendChild(buttonContainer);
        }
    }
}

// Email Registration Form
function initEmailRegisterForm() {
    const emailRegisterForm = document.getElementById('email-register-form');
    if (emailRegisterForm) {
        emailRegisterForm.addEventListener('submit', handleEmailRegisterSubmit);
    }
}

async function handleEmailRegisterSubmit(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const termsCheckbox = document.getElementById('terms-agree');
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validate inputs
    if (!name) {
        showFieldError(nameInput, 'Please enter your full name');
        return;
    }
    
    if (!UTPApp.validateEmail(email)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        return;
    }
    
    if (password.length < 6) {
        showFieldError(passwordInput, 'Password must be at least 6 characters');
        return;
    }
    
    if (!termsCheckbox.checked) {
        UTPApp.showNotification('Please agree to the Terms of Service and Privacy Policy', 'warning');
        return;
    }
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    try {
        // Returning user guard via Firestore if available
        if (window.FirebaseService && window.FirebaseService.getUserByEmail) {
            try {
                const existing = await window.FirebaseService.getUserByEmail(email);
                if (existing) {
                    hideLoading(submitBtn);
                    UTPApp.showNotification('This email is already registered. Please Login as Returning User.', 'warning');
                    // Switch to login form
                    const loginToggle = document.querySelector('[data-form="login"]');
                    if (loginToggle) loginToggle.click();
                    const loginEmail = document.getElementById('login-email');
                    if (loginEmail) loginEmail.value = email;
                    return;
                }
            } catch (chkErr) {
                console.warn('Could not verify existing user by email:', chkErr);
            }
        } else {
            // Fallback guard: basic local check
            const existingLocal = UTPApp.getUserData();
            if (existingLocal && existingLocal.email && existingLocal.email.toLowerCase() === email.toLowerCase()) {
                hideLoading(submitBtn);
                UTPApp.showNotification('This email is already registered on this device. Please Login as Returning User.', 'warning');
                const loginToggle = document.querySelector('[data-form="login"]');
                if (loginToggle) loginToggle.click();
                const loginEmail = document.getElementById('login-email');
                if (loginEmail) loginEmail.value = email;
                return;
            }
        }

        // Use Google Cloud AI to analyze user input
        let aiAnalysis = null;
        if (googleCloudAI) {
            aiAnalysis = await googleCloudAI.analyzeSentiment(name + ' career development');
            console.log('User sentiment analysis:', aiAnalysis);
        }
        
        // Simulate registration API call
        const response = await UTPApp.simulateAPI('register', { name, email, password });
        
        if (response.success) {
            const userData = {
                id: 'email_' + Date.now(),
                name: name,
                email: email,
                registrationMethod: 'email',
                registrationDate: new Date().toISOString(),
                emailVerified: false
            };
            
            // Generate personalized content using Google Cloud AI
            if (googleCloudAI) {
                const welcomeMessage = await googleCloudAI.generateWelcomeMessage(userData);
                userData.welcomeMessage = welcomeMessage;
                userData.aiAnalysis = aiAnalysis;
                userData.recommendations = ['Take the career assessment', 'Explore learning paths', 'Join community discussions'];
            }
            
            UTPApp.saveUserData(userData);
            showFieldSuccess(emailInput, 'Account created successfully!');
            
            setTimeout(() => {
                window.location.href = 'profile-setup.html';
            }, 1500);
        } else {
            showFieldError(emailInput, response.message || 'Registration failed');
        }
    } catch (error) {
        showFieldError(emailInput, 'Network error. Please try again.');
    } finally {
        hideLoading(submitBtn);
    }
}

// Terms and Privacy functions
function showTerms() {
    UTPApp.showNotification('Terms of Service will open in a new window', 'info');
    // In real implementation, open terms modal or page
}

function showPrivacy() {
    UTPApp.showNotification('Privacy Policy will open in a new window', 'info');
    // In real implementation, open privacy modal or page
}

// Global functions
window.resendOTP = resendOTP;
window.continueAsGuest = continueAsGuest;
window.signInWithGoogle = signInWithGoogle;
window.registerWithGoogle = registerWithGoogle;
window.handleEmailLoginSubmit = handleEmailLoginSubmit;
window.handleEmailRegisterSubmit = handleEmailRegisterSubmit;
window.togglePassword = togglePassword;
window.forgotPassword = forgotPassword;
window.showTerms = showTerms;
window.showPrivacy = showPrivacy;

// Add shake animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes bounceIn {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
    }
`;
document.head.appendChild(style);
