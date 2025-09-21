// Firebase Configuration and Setup
// Follow these steps to set up Firebase:

/*
FIREBASE SETUP INSTRUCTIONS:

1. Go to https://console.firebase.google.com/
2. Create a new project or select existing project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google sign-in provider
   - Add your domain to authorized domains
4. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules
5. Get your config:
   - Go to Project Settings > General
   - Scroll down to "Your apps"
   - Click "Web app" and copy the config
6. Replace the config below with your actual Firebase config
*/

// Firebase Configuration (Replace with your actual config)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCB1F5YSrDkEpMtbO8CNfWMxJ3LBpw0Y7o",
    authDomain: "unlocking-true-potential.firebaseapp.com",
    projectId: "unlocking-true-potential",
    storageBucket: "unlocking-true-potential.firebasestorage.app",
    messagingSenderId: "984638841375",
    appId: "1:984638841375:web:fe0e1d5ec1cf01be17eb2a",
    measurementId: "G-X5YV23B91D"
  };

// Vertex AI Configuration
const vertexAIConfig = {
    projectId: "unlocking-true-potential", // Replace with your actual Google Cloud project ID
    location: "us-central1", // Available regions: us-central1, us-east1, us-west1, europe-west1, asia-southeast1
    apiEndpoint: "us-central1-aiplatform.googleapis.com",
    
    // Model configurations
    models: {
        textBison: "text-bison@001", // For text generation
        chatBison: "chat-bison@001", // For conversational AI
        codeBison: "code-bison@001"  // For code generation
    },
    
    // API endpoints for different services
    endpoints: {
        prediction: "https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/{MODEL}:predict",
        generateContent: "https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/{MODEL}:generateContent"
    },
    
    // Default parameters for AI generation
    defaultParameters: {
        temperature: 0.7,        // Controls randomness (0.0 to 1.0)
        maxOutputTokens: 1024,   // Maximum response length
        topP: 0.8,              // Controls diversity
        topK: 40                // Controls vocabulary diversity
    }
};

// Find a user document by email
async function getUserByEmail(email) {
    if (!db) throw new Error('Firestore not initialized');
    if (!email) throw new Error('Missing email');
    const snap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!snap.empty) {
        const doc = snap.docs[0];
        return { id: doc.id, ...doc.data() };
    }
    return null;
}

// Persist personal details under users/{uid}.profile
async function saveUserProfile(uid, profileData) {
    if (!db) throw new Error('Firestore not initialized');
    if (!uid) throw new Error('Missing UID');
    const userRef = db.collection('users').doc(uid);
    await userRef.set({
        profile: profileData,
        profileCompleted: true,
        profileUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return true;
}

// Retrieve personal details from users/{uid}.profile
async function getUserProfile(uid) {
    if (!db) throw new Error('Firestore not initialized');
    if (!uid) throw new Error('Missing UID');
    const snap = await db.collection('users').doc(uid).get();
    if (snap.exists) {
        const data = snap.data();
        return data && data.profile ? data.profile : null;
    }
    return null;
}
// Initialize Firebase
let app, auth, db, analytics;

async function initializeFirebase() {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK not loaded');
        }

        // Initialize Firebase
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Initialize Analytics if available
        if (firebase.analytics) {
            analytics = firebase.analytics();
        }

        // Configure Firestore settings
        db.settings({
            cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
        });

        // Enable offline persistence
        await db.enablePersistence().catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.code == 'unimplemented') {
                console.warn('The current browser does not support all of the features required to enable persistence');
            }
        });

        window.Logger.success('Firebase initialized successfully');
        return true;

    } catch (error) {
        window.Logger.error('Firebase initialization failed', error);
        return false;
    }
}

// Google Auth Provider setup
function setupGoogleAuth() {
    if (!auth) {
        window.Logger.error('Firebase Auth not initialized');
        return null;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Add scopes for additional user information
    provider.addScope('email');
    provider.addScope('profile');
    
    // Optional: Add custom parameters
    provider.setCustomParameters({
        'login_hint': 'user@example.com'
    });

    return provider;
}

// Real Google Sign-In with Firebase
async function signInWithGoogleFirebase() {
    try {
        window.Logger.info('Starting Firebase Google Sign-In');
        
        const provider = setupGoogleAuth();
        if (!provider) {
            throw new Error('Google Auth provider not available');
        }

        // Sign in with popup
        const result = await auth.signInWithPopup(provider);
        
        // Check if we have a valid result
        if (!result || !result.user) {
            throw new Error('Google Sign-In failed - no user returned');
        }
        
        // Get user information
        const user = result.user;
        
        // Safely get credential and token
        let token = null;
        try {
            const credential = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
            token = credential ? credential.accessToken : null;
        } catch (credentialError) {
            console.warn('Could not get access token:', credentialError);
            // Continue without token - not critical for basic auth
        }

        window.Logger.success('Firebase Google Sign-In successful', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            hasToken: !!token
        });

        return {
            user: user,
            token: token,
            additionalUserInfo: result.additionalUserInfo || { isNewUser: false }
        };

    } catch (error) {
        // Handle specific Firebase auth errors
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Sign-in was cancelled');
        } else if (error.code === 'auth/popup-blocked') {
            throw new Error('Pop-up was blocked by browser');
        } else if (error.code === 'auth/cancelled-popup-request') {
            throw new Error('Another sign-in popup is already open');
        }
        
        window.Logger.error('Firebase Google Sign-In failed', {
            code: error.code,
            message: error.message
        });
        throw error;
    }
}

// Save user data to Firestore
async function saveUserToFirestore(userData) {
    try {
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        const userRef = db.collection('users').doc(userData.uid);
        
        // Check if user already exists
        const userDoc = await userRef.get();
        
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        
        if (!userDoc.exists) {
            // New user - create profile
            await userRef.set({
                uid: userData.uid,
                email: userData.email,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                emailVerified: userData.emailVerified,
                createdAt: timestamp,
                lastLoginAt: timestamp,
                authProvider: 'google',
                profileCompleted: false,
                assessmentCompleted: false,
                preferences: {
                    notifications: true,
                    theme: 'light',
                    language: 'en'
                }
            });
            
            window.Logger.info('New user profile created in Firestore');
        } else {
            // Existing user - update last login
            await userRef.update({
                lastLoginAt: timestamp,
                displayName: userData.displayName,
                photoURL: userData.photoURL
            });
            
            window.Logger.info('User profile updated in Firestore');
        }

        return userRef;

    } catch (error) {
        window.Logger.error('Failed to save user to Firestore', error);
        throw error;
    }
}

// Get user data from Firestore
async function getUserFromFirestore(uid) {
    try {
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        const userDoc = await db.collection('users').doc(uid).get();
        
        if (userDoc.exists) {
            return userDoc.data();
        } else {
            return null;
        }

    } catch (error) {
        window.Logger.error('Failed to get user from Firestore', error);
        throw error;
    }
}

// Save assessment results to Firestore
async function saveAssessmentResults(uid, assessmentData) {
    try {
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        const assessmentRef = db.collection('assessments').doc(uid);
        
        await assessmentRef.set({
            uid: uid,
            results: assessmentData.results,
            scores: assessmentData.scores,
            recommendations: assessmentData.recommendations,
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            version: '1.0'
        });

        // Update user profile to mark assessment as completed
        await db.collection('users').doc(uid).update({
            assessmentCompleted: true,
            lastAssessmentAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        window.Logger.success('Assessment results saved to Firestore');
        return assessmentRef;

    } catch (error) {
        window.Logger.error('Failed to save assessment results', error);
        throw error;
    }
}

// Get assessment results from Firestore
async function getAssessmentResults(uid) {
    try {
        if (!db) {
            throw new Error('Firestore not initialized');
        }

        const assessmentDoc = await db.collection('assessments').doc(uid).get();
        
        if (assessmentDoc.exists) {
            return assessmentDoc.data();
        } else {
            return null;
        }

    } catch (error) {
        window.Logger.error('Failed to get assessment results', error);
        throw error;
    }
}

// Vertex AI Integration for Career Recommendations
class VertexAIService {
    constructor(config = vertexAIConfig) {
        this.config = config;
        this.accessToken = null;
        this.tokenExpiry = null;
        this.isInitialized = false;
    }

    // Initialize Vertex AI service
    async initialize() {
        try {
            console.log('Initializing Vertex AI service...');
            
            // For development: try to get access token from gcloud CLI
            await this.getAccessToken();
            
            this.isInitialized = true;
            console.log('Vertex AI service initialized successfully');
            return true;
            
        } catch (error) {
            console.warn('Vertex AI initialization failed:', error.message);
            console.log('Will use fallback recommendations');
            return false;
        }
    }

    // Get access token for authentication
    async getAccessToken() {
        try {
            // For development with gcloud CLI
            if (this.isTokenValid()) {
                return this.accessToken;
            }

            // Try to get token from gcloud (this works in development)
            const response = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
                headers: {
                    'Metadata-Flavor': 'Google'
                }
            });

            if (response.ok) {
                const tokenData = await response.json();
                this.accessToken = tokenData.access_token;
                this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
                return this.accessToken;
            }

            throw new Error('Unable to get access token');

        } catch (error) {
            // Fallback: use application default credentials approach
            console.warn('Could not get access token:', error.message);
            throw error;
        }
    }

    // Check if current token is valid
    isTokenValid() {
        return this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
    }

    // Build API URL with proper parameters
    buildApiUrl(model = 'text-bison@001') {
        return this.config.endpoints.prediction
            .replace('{PROJECT_ID}', this.config.projectId)
            .replace('{LOCATION}', this.config.location)
            .replace('{MODEL}', model);
    }

    // Generate career recommendations using Vertex AI
    async generateCareerRecommendations(userProfile, assessmentResults) {
        try {
            if (!this.apiKey) {
                window.Logger.warn('Vertex AI API key not set, using fallback recommendations');
                return this.getFallbackRecommendations();
            }

            const prompt = this.buildCareerPrompt(userProfile, assessmentResults);
            
            // Call Vertex AI API (this is a simplified example)
            const response = await fetch(`https://${this.config.apiEndpoint}/v1/projects/${this.config.projectId}/locations/${this.config.location}/publishers/google/models/text-bison:predict`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instances: [{
                        prompt: prompt
                    }],
                    parameters: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Vertex AI API error: ${response.status}`);
            }

            const data = await response.json();
            const recommendations = this.parseAIRecommendations(data);

            window.Logger.success('Career recommendations generated by Vertex AI');
            return recommendations;

        } catch (error) {
            window.Logger.error('Vertex AI recommendation generation failed', error);
            return this.getFallbackRecommendations();
        }
    }

    // Build prompt for career recommendations
    buildCareerPrompt(userProfile, assessmentResults) {
        return `
Based on the following user profile and assessment results, provide personalized career recommendations:

User Profile:
- Name: ${userProfile.displayName}
- Interests: ${assessmentResults.interests || 'Not specified'}
- Skills: ${assessmentResults.skills || 'Not specified'}
- Personality Type: ${assessmentResults.personalityType || 'Not specified'}
- Work Style: ${assessmentResults.workStyle || 'Not specified'}

Assessment Scores:
- Analytical: ${assessmentResults.scores?.analytical || 0}/100
- Creative: ${assessmentResults.scores?.creative || 0}/100
- Leadership: ${assessmentResults.scores?.leadership || 0}/100
- Technical: ${assessmentResults.scores?.technical || 0}/100
- Communication: ${assessmentResults.scores?.communication || 0}/100

Please provide:
1. Top 5 career recommendations with explanations
2. Skills to develop for each career
3. Learning path suggestions
4. Industry outlook for each recommendation

Format the response as JSON with the following structure:
{
  "recommendations": [
    {
      "title": "Career Title",
      "match_percentage": 85,
      "description": "Why this career fits",
      "skills_needed": ["skill1", "skill2"],
      "learning_path": ["step1", "step2"],
      "industry_outlook": "Growth prospects"
    }
  ]
}
        `;
    }

    // Parse AI response into structured recommendations
    parseAIRecommendations(aiResponse) {
        try {
            // Extract the generated text from Vertex AI response
            const generatedText = aiResponse.predictions[0].content;
            
            // Try to parse as JSON
            const recommendations = JSON.parse(generatedText);
            
            return recommendations;

        } catch (error) {
            window.Logger.warn('Failed to parse AI recommendations, using fallback');
            return this.getFallbackRecommendations();
        }
    }

    // Fallback recommendations when AI is not available
    getFallbackRecommendations() {
        return {
            recommendations: [
                {
                    title: "Data Analyst",
                    match_percentage: 78,
                    description: "Analyze data to help businesses make informed decisions",
                    skills_needed: ["SQL", "Python", "Statistics", "Data Visualization"],
                    learning_path: ["Learn SQL basics", "Master Excel/Google Sheets", "Study Python for data analysis", "Practice with real datasets"],
                    industry_outlook: "High demand with 25% growth expected over next 10 years"
                },
                {
                    title: "UX Designer",
                    match_percentage: 72,
                    description: "Design user-friendly digital experiences",
                    skills_needed: ["Design Thinking", "Prototyping", "User Research", "Figma/Sketch"],
                    learning_path: ["Learn design principles", "Practice wireframing", "Study user psychology", "Build a portfolio"],
                    industry_outlook: "Growing field with increasing focus on digital experiences"
                },
                {
                    title: "Project Manager",
                    match_percentage: 69,
                    description: "Lead teams and manage projects from start to finish",
                    skills_needed: ["Leadership", "Communication", "Planning", "Risk Management"],
                    learning_path: ["Get PMP certification", "Practice with small projects", "Develop leadership skills", "Learn project management tools"],
                    industry_outlook: "Stable demand across all industries"
                }
            ]
        };
    }
}

// Export for global use
window.FirebaseService = {
    initialize: initializeFirebase,
    signInWithGoogle: signInWithGoogleFirebase,
    saveUser: saveUserToFirestore,
    getUser: getUserFromFirestore,
    getUserByEmail,
    saveUserProfile,
    getUserProfile,
    saveAssessment: saveAssessmentResults,
    getAssessment: getAssessmentResults,
    auth: () => auth,
    db: () => db
};

window.VertexAIService = new VertexAIService();

console.log('Firebase and Vertex AI services loaded');
