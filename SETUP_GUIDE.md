# 🚀 Complete Setup Guide for Unlocking True Potential

This guide will help you set up Firebase Authentication, Firestore Database, and Vertex AI for real Google OAuth and AI-powered career recommendations.

## 📋 Prerequisites

- Google Cloud Account
- Firebase Account (free tier available)
- Basic understanding of web development

## 🔥 Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `unlocking-true-potential` (or your preferred name)
4. Enable Google Analytics (recommended)
5. Click "Create project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google** provider
3. Click **Enable**
4. Add your email as a test user
5. Add authorized domains:
   - `localhost` (for development)
   - Your production domain (e.g., `yourdomain.com`)
6. Click **Save**

### Step 3: Set up Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll configure rules later)
4. Select your preferred location (choose closest to your users)
5. Click **Done**

### Step 4: Configure Firestore Security Rules

In Firestore > Rules, replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own assessments
    match /assessments/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow reading public career data
    match /careers/{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

### Step 5: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click **Web app** icon (`</>`)
4. Register your app with a nickname
5. Copy the configuration object

### Step 6: Update Firebase Config

Replace the config in `js/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345678",
    measurementId: "G-XXXXXXXXXX"
};
```

## ☁️ Google Cloud & Vertex AI Setup

### Step 1: Enable Vertex AI API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (or create new one)
3. Go to **APIs & Services** > **Library**
4. Search for "Vertex AI API"
5. Click **Enable**

### Step 2: Create Service Account (for production)

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name: `vertex-ai-service`
4. Grant roles:
   - Vertex AI User
   - AI Platform Developer
5. Create and download JSON key file
6. Store securely (never commit to version control)

### Step 3: Set up Authentication

For development, you can use:
```bash
gcloud auth application-default login
```

For production, set environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
```

### Step 4: Update Vertex AI Config

In `js/firebase-config.js`, update:

```javascript
const vertexAIConfig = {
    projectId: "your-actual-project-id",
    location: "us-central1", // or your preferred region
    apiEndpoint: "us-central1-aiplatform.googleapis.com"
};
```

## 🔧 Local Development Setup

### Step 1: Install Firebase CLI (Optional)

```bash
npm install -g firebase-tools
firebase login
firebase init
```

### Step 2: Serve Locally

You can use any local server. Examples:

**Python:**
```bash
cd d:/utp1
python -m http.server 3000
```

**Node.js (http-server):**
```bash
npm install -g http-server
cd d:/utp1
http-server -p 3000
```

**Live Server (VS Code Extension):**
- Install Live Server extension
- Right-click on `index.html`
- Select "Open with Live Server"

### Step 3: Test Authentication

1. Open `http://localhost:3000/pages/auth.html`
2. Click "Continue with Google"
3. Sign in with your Google account
4. Check browser console for logs
5. Verify user data in Firestore Console

## 🧪 Testing the Setup

### Test Firebase Authentication

1. Open browser console
2. Go to auth page
3. Click Google sign-in
4. Look for these logs:
   ```
   [INFO] Initializing Firebase Authentication
   [SUCCESS] Firebase Authentication initialized successfully
   [INFO] Firebase Google Sign-In successful
   ```

### Test Firestore Database

1. After successful login, check Firestore Console
2. You should see:
   - `users` collection with your user document
   - User data including email, displayName, etc.

### Test Vertex AI (when configured)

1. Complete the career assessment
2. Check console for AI recommendation logs
3. Verify recommendations are personalized

## 🚨 Troubleshooting

### Common Issues

**1. "Firebase not initialized"**
- Check if Firebase config is correct
- Ensure all Firebase SDKs are loaded
- Check browser console for errors

**2. "Google Sign-In popup blocked"**
- Allow popups in browser settings
- Try different browser
- Check if running on localhost or HTTPS

**3. "Permission denied" in Firestore**
- Check Firestore security rules
- Ensure user is authenticated
- Verify document path matches rules

**4. "Vertex AI API not enabled"**
- Enable Vertex AI API in Google Cloud Console
- Check project ID is correct
- Verify authentication is set up

### Debug Commands

**Check Firebase connection:**
```javascript
// In browser console
window.FirebaseService.auth().currentUser
```

**Export logs:**
```javascript
// In browser console
window.Logger.exportLogs()
```

**Check user data:**
```javascript
// In browser console
window.FirebaseService.getUser('USER_UID')
```

## 🔒 Security Best Practices

### Firebase Security

1. **Never expose API keys in client code** (Firebase web API keys are safe to expose)
2. **Use proper Firestore security rules**
3. **Enable App Check** for production
4. **Monitor usage** in Firebase Console

### Vertex AI Security

1. **Never commit service account keys**
2. **Use environment variables** for credentials
3. **Implement proper error handling**
4. **Monitor API usage and costs**

## 📊 Monitoring & Analytics

### Firebase Analytics

1. Events are automatically tracked
2. View in Firebase Console > Analytics
3. Custom events can be added

### Performance Monitoring

1. Enable Performance Monitoring in Firebase
2. Add SDK to track page loads
3. Monitor in Firebase Console

## 🚀 Deployment

### Firebase Hosting (Recommended)

```bash
firebase init hosting
firebase deploy
```

### Other Hosting Options

- Netlify
- Vercel
- GitHub Pages (for static sites)

## 💰 Cost Considerations

### Firebase (Free Tier Limits)

- **Authentication**: 50,000 MAU free
- **Firestore**: 50,000 reads, 20,000 writes per day
- **Hosting**: 10 GB storage, 360 MB/day transfer

### Vertex AI Pricing

- **Text generation**: ~$0.0025 per 1K characters
- **Predictions**: Varies by model
- **Monitor usage** in Google Cloud Console

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Firebase documentation
3. Check Google Cloud documentation
4. Look at browser console logs
5. Export and review application logs

## 🎯 Next Steps

After setup:

1. ✅ Test Google authentication
2. ✅ Verify Firestore data storage
3. ✅ Test career assessment flow
4. ✅ Configure Vertex AI for recommendations
5. ✅ Deploy to production
6. ✅ Monitor usage and performance

---

**🎉 Congratulations!** You now have a fully functional career guidance platform with real Google authentication, cloud database, and AI-powered recommendations!
