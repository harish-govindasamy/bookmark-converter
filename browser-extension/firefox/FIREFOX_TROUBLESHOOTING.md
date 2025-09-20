# 🦊 Firefox Extension Troubleshooting Guide

## 🔧 Common Issues and Solutions

### **1. "This add-on could not be installed because it appears to be corrupt"**

**Causes:**
- Missing extension ID
- Incorrect compression method
- Unsigned extension (for some Firefox versions)

**Solutions:**

#### **Solution A: Use Temporary Installation (Recommended)**
1. **Download**: `bookmark-converter-pro-firefox-dev.zip`
2. **Extract** the ZIP file
3. **Go to**: `about:debugging`
4. **Click**: "This Firefox"
5. **Click**: "Load Temporary Add-on"
6. **Select**: `manifest.json` file from extracted folder

#### **Solution B: Enable Unsigned Extensions (Development)**
1. **Go to**: `about:config`
2. **Search for**: `xpinstall.signatures.required`
3. **Set to**: `false`
4. **Restart** Firefox
5. **Try installing** the XPI file again

#### **Solution C: Use Firefox Developer Edition**
1. **Download**: [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/)
2. **Install** the extension using any method
3. **Developer Edition** allows unsigned extensions

---

### **2. Bookmarks Not Appearing**

**Causes:**
- Incorrect bookmark bar ID
- Permission issues
- Extension not properly loaded

**Solutions:**

#### **Check Extension Status:**
1. **Go to**: `about:addons`
2. **Find**: "Bookmark Converter Pro"
3. **Ensure**: Extension is enabled
4. **Check**: Permissions are granted

#### **Check Bookmark Bar:**
1. **Right-click** on Firefox toolbar
2. **Select**: "Bookmarks Toolbar"
3. **Ensure**: Bookmark bar is visible
4. **Look for**: New bookmarks at the top

#### **Test Extension:**
1. **Click** extension icon in toolbar
2. **Try** adding a test bookmark
3. **Check** browser console for errors (F12)

---

### **3. Extension Not Loading**

**Causes:**
- Invalid manifest.json
- Missing files
- Permission issues

**Solutions:**

#### **Check Manifest:**
1. **Open**: `manifest.json` in text editor
2. **Verify**: JSON syntax is valid
3. **Check**: All required fields are present
4. **Ensure**: Extension ID is included

#### **Check Files:**
1. **Verify**: All files are present:
   - `manifest.json`
   - `background.js`
   - `popup.html`
   - `popup.js`
   - `content.js`
   - `icons/` folder

#### **Check Permissions:**
1. **Ensure**: `bookmarks` permission is included
2. **Check**: `storage` permission is included
3. **Verify**: `activeTab` permission is included

---

### **4. Popup Not Working**

**Causes:**
- JavaScript errors
- Missing popup files
- Extension context issues

**Solutions:**

#### **Check Console:**
1. **Open**: Browser console (F12)
2. **Look for**: JavaScript errors
3. **Check**: Extension-related messages
4. **Fix**: Any syntax errors

#### **Test Popup:**
1. **Click**: Extension icon
2. **Check**: Popup opens
3. **Try**: All popup functions
4. **Verify**: Folder selection works

---

### **5. Floating Button Not Appearing**

**Causes:**
- Content script not loading
- Page restrictions
- JavaScript errors

**Solutions:**

#### **Check Content Script:**
1. **Verify**: `content.js` is included
2. **Check**: Content script permissions
3. **Ensure**: Script runs on all pages

#### **Test on Different Pages:**
1. **Try**: Different websites
2. **Check**: Button appears on most pages
3. **Note**: Some pages may block extensions

---

## 🔍 Debugging Steps

### **Step 1: Check Extension Console**
1. **Go to**: `about:debugging`
2. **Click**: "This Firefox"
3. **Find**: "Bookmark Converter Pro"
4. **Click**: "Inspect"
5. **Check**: Console for errors

### **Step 2: Check Browser Console**
1. **Open**: Browser console (F12)
2. **Look for**: Extension-related errors
3. **Check**: Network requests
4. **Verify**: API calls are working

### **Step 3: Test Bookmark API**
1. **Open**: Browser console
2. **Type**: `browser.bookmarks.getTree()`
3. **Check**: Returns bookmark tree
4. **Verify**: Bookmark bar is accessible

### **Step 4: Check Permissions**
1. **Go to**: `about:addons`
2. **Click**: Extension details
3. **Check**: All permissions are granted
4. **Verify**: No permission errors

---

## 🚀 Installation Methods

### **Method 1: Temporary Installation (Recommended)**
```
1. Download ZIP file
2. Extract to folder
3. Go to about:debugging
4. Click "This Firefox"
5. Click "Load Temporary Add-on"
6. Select manifest.json
```

### **Method 2: XPI Installation**
```
1. Download XPI file
2. Go to about:addons
3. Click gear icon
4. Select "Install Add-on From File"
5. Choose XPI file
6. Click "Add"
```

### **Method 3: Developer Mode**
```
1. Go to about:config
2. Set xpinstall.signatures.required to false
3. Restart Firefox
4. Install XPI file
```

---

## 📞 Support

If you're still having issues:

1. **Check**: This troubleshooting guide
2. **Try**: Different installation methods
3. **Test**: On different Firefox versions
4. **Visit**: [Web App](https://bookmark-converter-8okt.onrender.com)
5. **Check**: [GitHub Issues](https://github.com/harish-govindasamy/bookmark-converter)

---

## ✅ Success Checklist

After installation, verify:
- [ ] Extension appears in `about:addons`
- [ ] Extension icon is visible in toolbar
- [ ] Popup opens when clicking icon
- [ ] Floating button appears on web pages
- [ ] Bookmarks are created successfully
- [ ] Bookmarks appear at top of bookmark bar
- [ ] Folder selection works
- [ ] Context menu integration works

**Happy bookmarking with Firefox! 🦊🚀**
