// Google OAuth Configuration
// To set up Google OAuth, follow these steps:

/*
1. Go to Google Cloud Console (https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google+ API and Google Identity Services
4. Go to "Credentials" section
5. Create OAuth 2.0 Client ID
6. Add your domain to authorized origins:
   - http://localhost:3000 (for development)
   - https://yourdomain.com (for production)
7. Copy the Client ID and replace it in the configuration below
*/

const GOOGLE_CONFIG = {
    // Replace this with your actual Google OAuth Client ID
    CLIENT_ID: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com',
    
    // OAuth scopes (what information you want to access)
    SCOPES: [
        'openid',
        'email', 
        'profile'
    ],
    
    // Redirect URI (where Google sends the user after authentication)
    // Use homepage; the unified auth modal handles subsequent routing
    REDIRECT_URI: window.location.origin + '/index.html',
    
    // Additional configuration
    CONFIG: {
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true
    }
};

// Export configuration for use in other files
window.GOOGLE_CONFIG = GOOGLE_CONFIG;

// Logging configuration
const LOGGING_CONFIG = {
    // Enable/disable console logging
    ENABLE_CONSOLE_LOGS: true,
    
    // Log levels: 'error', 'warn', 'info', 'debug'
    LOG_LEVEL: 'info',
    
    // Enable/disable user action tracking
    TRACK_USER_ACTIONS: true,
    
    // Enable/disable API call logging
    LOG_API_CALLS: true
};

// Enhanced logging system
class Logger {
    constructor(config = LOGGING_CONFIG) {
        this.config = config;
        this.logs = [];
        this.maxLogs = 1000; // Maximum number of logs to keep in memory
    }
    
    log(level, message, data = null) {
        if (!this.config.ENABLE_CONSOLE_LOGS) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // Add to memory logs
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift(); // Remove oldest log
        }
        
        // Console output with styling
        const styles = {
            error: 'color: #ff4444; font-weight: bold;',
            warn: 'color: #ffaa00; font-weight: bold;',
            info: 'color: #4444ff;',
            debug: 'color: #888888;',
            success: 'color: #44ff44; font-weight: bold;'
        };
        
        const style = styles[level] || styles.info;
        console.log(`%c[${timestamp}] [${level.toUpperCase()}] ${message}`, style, data || '');
        
        // Send to analytics if configured
        if (this.config.TRACK_USER_ACTIONS && (level === 'error' || level === 'warn')) {
            this.sendToAnalytics(logEntry);
        }
    }
    
    error(message, data) { this.log('error', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    info(message, data) { this.log('info', message, data); }
    debug(message, data) { this.log('debug', message, data); }
    success(message, data) { this.log('success', message, data); }
    
    // Track user actions
    trackAction(action, details = {}) {
        if (!this.config.TRACK_USER_ACTIONS) return;
        
        this.info(`User Action: ${action}`, {
            action,
            details,
            timestamp: new Date().toISOString(),
            page: window.location.pathname
        });
    }
    
    // Track API calls
    trackAPICall(endpoint, method, status, duration) {
        if (!this.config.LOG_API_CALLS) return;
        
        const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
        this.log(level, `API Call: ${method} ${endpoint}`, {
            endpoint,
            method,
            status,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
    }
    
    // Get recent logs
    getRecentLogs(count = 50) {
        return this.logs.slice(-count);
    }
    
    // Export logs for debugging
    exportLogs() {
        const logsData = {
            logs: this.logs,
            config: this.config,
            browser: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString()
            }
        };
        
        const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utp-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Send logs to analytics service (placeholder)
    async sendToAnalytics(logEntry) {
        try {
            // In a real implementation, you would send this to your analytics service
            // Example: Google Analytics, Mixpanel, or custom analytics endpoint
            
            console.log('Sending to analytics:', logEntry);
            
            // Placeholder for actual analytics call
            // await fetch('/api/analytics', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(logEntry)
            // });
            
        } catch (error) {
            console.error('Failed to send analytics:', error);
        }
    }
    
    // Clear logs
    clearLogs() {
        this.logs = [];
        this.info('Logs cleared');
    }
}

// Create global logger instance
window.Logger = new Logger(LOGGING_CONFIG);

// Add global error handler
window.addEventListener('error', (event) => {
    window.Logger.error('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
    });
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    window.Logger.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
    });
});

// Google OAuth Helper Functions
window.GoogleOAuthHelper = {
    // Check if Google Sign-In is available
    isAvailable() {
        return typeof google !== 'undefined' && google.accounts && google.accounts.id;
    },
    
    // Initialize Google Sign-In with proper error handling
    async initialize(clientId = GOOGLE_CONFIG.CLIENT_ID) {
        try {
            if (!this.isAvailable()) {
                throw new Error('Google Sign-In library not loaded');
            }
            
            window.Logger.info('Initializing Google OAuth', { clientId: clientId.substring(0, 10) + '...' });
            
            google.accounts.id.initialize({
                client_id: clientId,
                callback: window.handleGoogleSignIn,
                ...GOOGLE_CONFIG.CONFIG
            });
            
            window.Logger.success('Google OAuth initialized successfully');
            return true;
            
        } catch (error) {
            window.Logger.error('Google OAuth initialization failed', error);
            return false;
        }
    },
    
    // Prompt for sign-in
    promptSignIn() {
        if (!this.isAvailable()) {
            window.Logger.error('Google Sign-In not available');
            return false;
        }
        
        window.Logger.info('Prompting Google Sign-In');
        google.accounts.id.prompt();
        return true;
    },
    
    // Render sign-in button
    renderButton(element, options = {}) {
        if (!this.isAvailable()) {
            window.Logger.error('Cannot render Google Sign-In button - library not available');
            return false;
        }
        
        const defaultOptions = {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular'
        };
        
        google.accounts.id.renderButton(element, { ...defaultOptions, ...options });
        window.Logger.info('Google Sign-In button rendered');
        return true;
    }
};

console.log('Google configuration and logging system loaded');
