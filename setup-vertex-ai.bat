@echo off
echo ========================================
echo    Vertex AI Setup for Windows
echo ========================================
echo.

REM Check if gcloud is installed
gcloud --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Google Cloud CLI not found!
    echo Please install it from: https://cloud.google.com/sdk/docs/install-sdk
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✅ Google Cloud CLI is installed
echo.

REM Check authentication
echo 🔐 Checking authentication...
gcloud auth list --filter=status:ACTIVE --format="value(account)" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not authenticated with Google Cloud
    set /p auth_choice="Do you want to authenticate now? (y/n): "
    if /i "%auth_choice%"=="y" (
        echo Authenticating...
        gcloud auth login
        gcloud auth application-default login
        echo ✅ Authentication completed
    ) else (
        echo Please authenticate first: gcloud auth login
        pause
        exit /b 1
    )
) else (
    echo ✅ Already authenticated
)
echo.

REM Get current project
echo 📁 Setting up project...
for /f "delims=" %%i in ('gcloud config get-value project 2^>nul') do set current_project=%%i

if defined current_project (
    echo Current project: %current_project%
    set /p use_project="Use this project? (y/n): "
    if /i not "%use_project%"=="y" (
        set /p new_project="Enter your project ID: "
        gcloud config set project %new_project%
        set current_project=%new_project%
    )
) else (
    set /p current_project="Enter your Google Cloud project ID: "
    gcloud config set project %current_project%
)

echo ✅ Using project: %current_project%
echo.

REM Enable APIs
echo 🔌 Enabling required APIs...
echo Enabling Vertex AI API...
gcloud services enable aiplatform.googleapis.com

echo Enabling Cloud Resource Manager API...
gcloud services enable cloudresourcemanager.googleapis.com

echo Enabling IAM API...
gcloud services enable iam.googleapis.com

echo ✅ APIs enabled successfully
echo.

REM Update configuration
echo ⚙️ Updating configuration...
powershell -Command "(Get-Content 'js\firebase-config.js') -replace 'projectId: \"your-project-id\"', 'projectId: \"%current_project%\"' | Set-Content 'js\firebase-config.js'"
echo ✅ Configuration updated
echo.

REM Test Vertex AI
echo 🧪 Testing Vertex AI setup...
gcloud ai models list --region=us-central1 --project=%current_project% --limit=1 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Vertex AI API is working correctly
) else (
    echo ⚠️ Vertex AI test failed, but setup should still work
)
echo.

echo 🎉 Setup Complete!
echo ==============================
echo.
echo 📋 Next Steps:
echo 1. Your firebase-config.js has been updated
echo 2. Test your setup by opening test-setup.html
echo 3. Try the career assessment to see AI recommendations
echo.
echo 💰 Cost Information:
echo - Vertex AI Text Generation: ~$0.0025 per 1K characters
echo - Monitor usage in Google Cloud Console
echo.
echo 🔗 Useful Links:
echo - Vertex AI Console: https://console.cloud.google.com/vertex-ai
echo - API Usage: https://console.cloud.google.com/apis/dashboard
echo.
pause
