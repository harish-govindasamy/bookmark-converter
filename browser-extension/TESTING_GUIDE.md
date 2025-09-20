# Browser Extension Testing Guide

## 🧪 Local Testing Instructions

### Chrome Testing
1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable Developer Mode** (toggle in top-right corner)
3. **Click "Load unpacked"**
4. **Select the `browser-extension` folder**
5. **Test the extension:**
   - Click the extension icon in toolbar
   - Try bookmarking current page
   - Test "Bookmark All Tabs" feature
   - Test URL processing with messy text
   - Check floating bookmark button on webpages

### Edge Testing
1. **Open Edge** and go to `edge://extensions/`
2. **Enable Developer Mode** (toggle in left sidebar)
3. **Click "Load unpacked"**
4. **Select the `browser-extension` folder**
5. **Test all features** (same as Chrome)

### Firefox Testing
1. **Open Firefox** and go to `about:debugging`
2. **Click "This Firefox"**
3. **Click "Load Temporary Add-on"**
4. **Select the `manifest.json` file**
5. **Test all features**

## 🐛 Common Issues & Solutions

### Icons Not Showing
- **Problem:** Extension shows default icon
- **Solution:** Make sure PNG files are in `icons/` folder with correct names

### Permission Errors
- **Problem:** Extension can't access bookmarks
- **Solution:** Check that `manifest.json` has correct permissions

### Popup Not Opening
- **Problem:** Clicking extension icon does nothing
- **Solution:** Check browser console for errors

### Bookmark Creation Fails
- **Problem:** Bookmarks not being created
- **Solution:** Verify bookmark permissions are granted

## ✅ Testing Checklist

- [ ] Extension loads without errors
- [ ] Icons display correctly
- [ ] Popup opens when clicking extension icon
- [ ] Form inputs work properly
- [ ] URL processing works with messy text
- [ ] "Add to Browser" creates bookmarks
- [ ] "Download HTML" generates file
- [ ] "Bookmark Current Page" works
- [ ] "Bookmark All Tabs" works
- [ ] Floating bookmark button appears on webpages
- [ ] Context menu integration works
- [ ] Keyboard shortcuts work (Ctrl+Shift+B)

## 📝 Test Data

Use this test data to verify URL processing:

```
→ Toptal (toptal.com)
→ SkipTheDrive (skipthedrive.com)
github.com
Remote OK (remoteok.com)
https://www.google.com
```

Expected result: All URLs should be cleaned and converted to proper bookmarks.
