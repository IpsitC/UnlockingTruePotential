#!/usr/bin/env node

/**
 * Vertex AI Setup Script for Unlocking True Potential
 * 
 * This script helps you set up Vertex AI step by step
 * Run with: node setup-vertex-ai.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function checkGCloudInstalled() {
    try {
        execSync('gcloud --version', { stdio: 'pipe' });
        return true;
    } catch (error) {
        return false;
    }
}

async function checkGCloudAuth() {
    try {
        const output = execSync('gcloud auth list --filter=status:ACTIVE --format="value(account)"', { encoding: 'utf8' });
        return output.trim().length > 0;
    } catch (error) {
        return false;
    }
}

async function getCurrentProject() {
    try {
        const output = execSync('gcloud config get-value project', { encoding: 'utf8' });
        return output.trim();
    } catch (error) {
        return null;
    }
}

async function enableAPI(apiName) {
    try {
        colorLog(`Enabling ${apiName}...`, 'yellow');
        execSync(`gcloud services enable ${apiName}`, { stdio: 'inherit' });
        colorLog(`✅ ${apiName} enabled successfully`, 'green');
        return true;
    } catch (error) {
        colorLog(`❌ Failed to enable ${apiName}`, 'red');
        return false;
    }
}

async function updateFirebaseConfig(projectId, location) {
    const configPath = path.join(__dirname, 'js', 'firebase-config.js');
    
    try {
        let content = fs.readFileSync(configPath, 'utf8');
        
        // Update project ID
        content = content.replace(
            /projectId: "your-project-id"/g,
            `projectId: "${projectId}"`
        );
        
        // Update location if different from default
        if (location !== 'us-central1') {
            content = content.replace(
                /location: "us-central1"/g,
                `location: "${location}"`
            );
            
            content = content.replace(
                /us-central1-aiplatform\.googleapis\.com/g,
                `${location}-aiplatform.googleapis.com`
            );
        }
        
        fs.writeFileSync(configPath, content);
        colorLog('✅ Firebase config updated successfully', 'green');
        return true;
        
    } catch (error) {
        colorLog('❌ Failed to update Firebase config: ' + error.message, 'red');
        return false;
    }
}

async function createServiceAccount(projectId) {
    const serviceAccountName = 'vertex-ai-service';
    const serviceAccountEmail = `${serviceAccountName}@${projectId}.iam.gserviceaccount.com`;
    
    try {
        // Create service account
        colorLog('Creating service account...', 'yellow');
        execSync(`gcloud iam service-accounts create ${serviceAccountName} --display-name="Vertex AI Service Account"`, { stdio: 'inherit' });
        
        // Grant roles
        const roles = [
            'roles/aiplatform.user',
            'roles/ml.developer',
            'roles/storage.objectViewer'
        ];
        
        for (const role of roles) {
            colorLog(`Granting role: ${role}`, 'yellow');
            execSync(`gcloud projects add-iam-policy-binding ${projectId} --member="serviceAccount:${serviceAccountEmail}" --role="${role}"`, { stdio: 'inherit' });
        }
        
        // Create and download key
        const keyPath = path.join(__dirname, 'vertex-ai-key.json');
        colorLog('Creating service account key...', 'yellow');
        execSync(`gcloud iam service-accounts keys create "${keyPath}" --iam-account="${serviceAccountEmail}"`, { stdio: 'inherit' });
        
        colorLog('✅ Service account created successfully', 'green');
        colorLog(`📁 Key saved to: ${keyPath}`, 'cyan');
        colorLog('⚠️  IMPORTANT: Keep this key file secure and never commit it to version control!', 'yellow');
        
        return keyPath;
        
    } catch (error) {
        colorLog('❌ Failed to create service account: ' + error.message, 'red');
        return null;
    }
}

async function testVertexAI(projectId, location) {
    try {
        colorLog('Testing Vertex AI API...', 'yellow');
        
        const testCommand = `gcloud ai models list --region=${location} --project=${projectId} --limit=1`;
        execSync(testCommand, { stdio: 'pipe' });
        
        colorLog('✅ Vertex AI API is working correctly', 'green');
        return true;
        
    } catch (error) {
        colorLog('❌ Vertex AI API test failed: ' + error.message, 'red');
        return false;
    }
}

async function main() {
    colorLog('🚀 Vertex AI Setup for Unlocking True Potential', 'bright');
    colorLog('=' .repeat(50), 'cyan');
    
    // Step 1: Check gcloud installation
    colorLog('\n📋 Step 1: Checking Google Cloud CLI...', 'blue');
    const gcloudInstalled = await checkGCloudInstalled();
    
    if (!gcloudInstalled) {
        colorLog('❌ Google Cloud CLI not found!', 'red');
        colorLog('Please install it from: https://cloud.google.com/sdk/docs/install', 'yellow');
        colorLog('Then run this script again.', 'yellow');
        process.exit(1);
    }
    
    colorLog('✅ Google Cloud CLI is installed', 'green');
    
    // Step 2: Check authentication
    colorLog('\n🔐 Step 2: Checking authentication...', 'blue');
    const isAuthenticated = await checkGCloudAuth();
    
    if (!isAuthenticated) {
        colorLog('❌ Not authenticated with Google Cloud', 'red');
        const shouldAuth = await question('Do you want to authenticate now? (y/n): ');
        
        if (shouldAuth.toLowerCase() === 'y') {
            try {
                execSync('gcloud auth login', { stdio: 'inherit' });
                execSync('gcloud auth application-default login', { stdio: 'inherit' });
                colorLog('✅ Authentication completed', 'green');
            } catch (error) {
                colorLog('❌ Authentication failed', 'red');
                process.exit(1);
            }
        } else {
            colorLog('Please authenticate first: gcloud auth login', 'yellow');
            process.exit(1);
        }
    } else {
        colorLog('✅ Already authenticated', 'green');
    }
    
    // Step 3: Get/Set project
    colorLog('\n📁 Step 3: Setting up project...', 'blue');
    let currentProject = await getCurrentProject();
    
    if (currentProject) {
        colorLog(`Current project: ${currentProject}`, 'cyan');
        const useCurrentProject = await question('Use this project? (y/n): ');
        
        if (useCurrentProject.toLowerCase() !== 'y') {
            const newProject = await question('Enter your project ID: ');
            try {
                execSync(`gcloud config set project ${newProject}`, { stdio: 'inherit' });
                currentProject = newProject;
            } catch (error) {
                colorLog('❌ Failed to set project', 'red');
                process.exit(1);
            }
        }
    } else {
        const projectId = await question('Enter your Google Cloud project ID: ');
        try {
            execSync(`gcloud config set project ${projectId}`, { stdio: 'inherit' });
            currentProject = projectId;
        } catch (error) {
            colorLog('❌ Failed to set project', 'red');
            process.exit(1);
        }
    }
    
    colorLog(`✅ Using project: ${currentProject}`, 'green');
    
    // Step 4: Choose region
    colorLog('\n🌍 Step 4: Choosing region...', 'blue');
    colorLog('Available regions for Vertex AI:');
    colorLog('1. us-central1 (Iowa, USA)');
    colorLog('2. us-east1 (South Carolina, USA)');
    colorLog('3. us-west1 (Oregon, USA)');
    colorLog('4. europe-west1 (Belgium)');
    colorLog('5. asia-southeast1 (Singapore)');
    
    const regionChoice = await question('Choose region (1-5, default: 1): ') || '1';
    const regions = {
        '1': 'us-central1',
        '2': 'us-east1',
        '3': 'us-west1',
        '4': 'europe-west1',
        '5': 'asia-southeast1'
    };
    
    const selectedRegion = regions[regionChoice] || 'us-central1';
    colorLog(`✅ Selected region: ${selectedRegion}`, 'green');
    
    // Step 5: Enable APIs
    colorLog('\n🔌 Step 5: Enabling required APIs...', 'blue');
    const requiredAPIs = [
        'aiplatform.googleapis.com',
        'cloudresourcemanager.googleapis.com',
        'iam.googleapis.com'
    ];
    
    for (const api of requiredAPIs) {
        await enableAPI(api);
    }
    
    // Step 6: Create service account
    colorLog('\n👤 Step 6: Service account setup...', 'blue');
    const createSA = await question('Create service account for production? (y/n): ');
    
    let keyPath = null;
    if (createSA.toLowerCase() === 'y') {
        keyPath = await createServiceAccount(currentProject);
    }
    
    // Step 7: Update configuration
    colorLog('\n⚙️  Step 7: Updating configuration...', 'blue');
    await updateFirebaseConfig(currentProject, selectedRegion);
    
    // Step 8: Test setup
    colorLog('\n🧪 Step 8: Testing Vertex AI setup...', 'blue');
    await testVertexAI(currentProject, selectedRegion);
    
    // Final instructions
    colorLog('\n🎉 Setup Complete!', 'bright');
    colorLog('=' .repeat(30), 'green');
    
    colorLog('\n📋 Next Steps:', 'blue');
    colorLog('1. Your firebase-config.js has been updated', 'cyan');
    colorLog('2. Test your setup by opening test-setup.html', 'cyan');
    colorLog('3. Try the career assessment to see AI recommendations', 'cyan');
    
    if (keyPath) {
        colorLog('\n🔒 Production Deployment:', 'blue');
        colorLog(`1. Set environment variable: GOOGLE_APPLICATION_CREDENTIALS="${keyPath}"`, 'cyan');
        colorLog('2. Never commit the key file to version control', 'cyan');
        colorLog('3. Use proper secret management in production', 'cyan');
    }
    
    colorLog('\n💰 Cost Information:', 'blue');
    colorLog('- Vertex AI Text Generation: ~$0.0025 per 1K characters', 'cyan');
    colorLog('- Monitor usage in Google Cloud Console', 'cyan');
    
    colorLog('\n🔗 Useful Links:', 'blue');
    colorLog('- Vertex AI Console: https://console.cloud.google.com/vertex-ai', 'cyan');
    colorLog('- API Usage: https://console.cloud.google.com/apis/dashboard', 'cyan');
    colorLog('- Billing: https://console.cloud.google.com/billing', 'cyan');
    
    rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
    colorLog('❌ Unhandled error: ' + error.message, 'red');
    process.exit(1);
});

// Run the setup
main().catch((error) => {
    colorLog('❌ Setup failed: ' + error.message, 'red');
    process.exit(1);
});
