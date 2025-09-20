@echo off
echo ========================================
echo Bookmark Converter Pro - Extension Test
echo ========================================
echo.

echo Step 1: Generating Icons...
echo Please open generate-icons.html in your browser
echo Click "Generate All Icons" then "Download All Icons"
echo Save the PNG files to the icons/ folder
echo.
pause

echo Step 2: Testing in Chrome...
echo 1. Open Chrome and go to chrome://extensions/
echo 2. Enable "Developer mode" (toggle in top-right)
echo 3. Click "Load unpacked"
echo 4. Select this browser-extension folder
echo 5. Test the extension features
echo.
pause

echo Step 3: Testing in Edge...
echo 1. Open Edge and go to edge://extensions/
echo 2. Enable "Developer mode" (toggle in left sidebar)
echo 3. Click "Load unpacked"
echo 4. Select this browser-extension folder
echo 5. Test the extension features
echo.
pause

echo Step 4: Testing in Firefox...
echo 1. Open Firefox and go to about:debugging
echo 2. Click "This Firefox"
echo 3. Click "Load Temporary Add-on"
echo 4. Select the manifest.json file
echo 5. Test the extension features
echo.
pause

echo ========================================
echo Testing Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Fix any issues found during testing
echo 2. Create store assets (screenshots, descriptions)
echo 3. Submit to Chrome Web Store first
echo 4. Then submit to Edge and Firefox stores
echo.
echo See PUBLISHING_GUIDE.md for detailed instructions
echo.
pause
