# Extension Troubleshooting Guide

## Common Issues and Solutions

### 1. Service Worker Registration Failed (Status Code: 15)

**Problem:** Extension shows "Service worker registration failed. Status code: 15"

**Solutions:**
1. **Reload the extension:**
   - Go to `chrome://extensions/`
   - Find "Bookmark Converter Pro"
   - Click the reload button (🔄)

2. **Check for errors:**
   - Click "Details" on the extension
   - Click "Inspect views: service worker"
   - Check console for error messages

3. **Reinstall the extension:**
   - Remove the extension completely
   - Download fresh copy from GitHub
   - Load unpacked again

### 2. Cannot read properties of undefined (reading 'onClicked')

**Problem:** Context menu API error

**Solutions:**
1. **Check permissions:**
   - Ensure `contextMenus` permission is granted
   - Go to extension details and verify permissions

2. **Reload extension:**
   - The context menu is created on installation
   - Reloading recreates the context menu

3. **Check browser compatibility:**
   - Chrome 88+ required
   - Edge 88+ required
   - Firefox 109+ required

### 3. Extension Icon Not Working

**Problem:** Clicking extension icon doesn't show folder dialog

**Solutions:**
1. **Check content script:**
   - Go to any website
   - Open Developer Tools (F12)
   - Check Console for errors

2. **Verify permissions:**
   - `activeTab` permission required
   - `bookmarks` permission required

3. **Test on different sites:**
   - Some sites block content scripts
   - Try on simple sites like google.com

### 4. Bookmarks Not Appearing

**Problem:** Bookmarks created but not visible

**Solutions:**
1. **Check bookmark bar:**
   - Press Ctrl+Shift+B to show bookmark bar
   - Look for new bookmarks at the TOP

2. **Check bookmark manager:**
   - Go to `chrome://bookmarks/`
   - Look for "My Bookmarks" folder

3. **Refresh browser:**
   - Sometimes bookmarks need a refresh to appear

### 5. Folder Selection Dialog Not Showing

**Problem:** No dialog appears when clicking extension icon

**Solutions:**
1. **Check console errors:**
   - Open Developer Tools (F12)
   - Look for JavaScript errors

2. **Verify content script injection:**
   - Check if floating bookmark button appears
   - Button should be blue circle with 🔖 icon

3. **Test on different page:**
   - Try on a simple HTML page
   - Some sites block modal dialogs

## Testing Steps

### 1. Basic Functionality Test
1. Install extension
2. Go to any website (e.g., google.com)
3. Look for blue floating bookmark button (🔖)
4. Click the button
5. Folder selection dialog should appear

### 2. Bookmark Creation Test
1. Click extension icon
2. Enter folder name (e.g., "Test Bookmarks")
3. Click "Save Bookmark"
4. Check bookmark bar for new folder
5. Verify bookmark is at the top

### 3. Context Menu Test
1. Right-click on any page
2. Look for "Bookmark with Converter Pro"
3. Click the option
4. Verify bookmark is created

## Debug Information

### Console Logs
The extension logs important events:
- `Bookmark Converter Pro service worker starting...`
- `Message received: [action]`
- `Bookmark created: [title]`

### Error Messages
Common error messages and meanings:
- `Cannot bookmark this page` - Invalid URL (chrome://, moz-extension://)
- `No valid tabs to bookmark` - No open tabs to bookmark
- `No valid URLs found` - No URLs in input text

## Browser Compatibility

### Chrome/Edge
- Minimum version: 88
- Manifest V3 support required
- Service worker support required

### Firefox
- Minimum version: 109
- Manifest V3 support required
- Different API behavior

## Getting Help

If issues persist:
1. Check browser console for detailed errors
2. Verify all permissions are granted
3. Try on a fresh browser profile
4. Check if other extensions conflict
5. Update browser to latest version

## Extension Files Checklist

Ensure all files are present:
- ✅ `manifest.json`
- ✅ `background.js`
- ✅ `content.js`
- ✅ `popup.html`
- ✅ `popup.js`
- ✅ `icons/icon16.png`
- ✅ `icons/icon32.png`
- ✅ `icons/icon48.png`
- ✅ `icons/icon128.png`
