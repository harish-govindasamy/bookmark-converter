@echo off
echo ========================================
echo Packaging Extension for Store Submission
echo ========================================
echo.

echo Creating extension package...
echo.

REM Create ZIP file excluding development files
powershell -command "Compress-Archive -Path 'manifest.json','popup.html','popup.js','background.js','content.js','icons','README.md' -DestinationPath 'bookmark-converter-pro-extension.zip' -Force"

if exist "bookmark-converter-pro-extension.zip" (
    echo ✅ Extension packaged successfully!
    echo 📦 File: bookmark-converter-pro-extension.zip
    echo.
    echo This ZIP file is ready for:
    echo - Chrome Web Store submission
    echo - Edge Add-ons submission
    echo - Firefox Add-ons submission
    echo.
    echo Next steps:
    echo 1. Create store assets (screenshots, descriptions)
    echo 2. Write privacy policy
    echo 3. Submit to browser stores
    echo.
) else (
    echo ❌ Error creating package
    echo Make sure all required files exist:
    echo - manifest.json
    echo - popup.html
    echo - popup.js
    echo - background.js
    echo - content.js
    echo - icons/ folder with PNG files
)

echo.
pause
