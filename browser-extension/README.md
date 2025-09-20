# 🔖 Bookmark Converter Pro - Browser Extensions

## 📁 Extension Organization

This directory contains browser extensions organized by browser type and manifest version:

```
browser-extension/
├── chrome-based/          # Manifest V3 for Chrome-based browsers
│   ├── manifest.json      # Manifest V3
│   ├── background.js      # Service worker
│   ├── popup.html         # Extension popup
│   ├── popup.js           # Popup functionality
│   ├── content.js         # Content script
│   ├── icons/             # Extension icons
│   └── bookmark-converter-pro-chrome.zip
├── firefox/               # Manifest V2 for Firefox
│   ├── manifest.json      # Manifest V2
│   ├── background.js      # Background script
│   ├── popup.html         # Extension popup
│   ├── popup.js           # Popup functionality
│   ├── content.js         # Content script
│   ├── icons/             # Extension icons
│   └── bookmark-converter-pro-firefox.zip
└── README.md              # This file
```

---

## 🌐 Browser Support

### **Chrome-based Extensions** (Manifest V3)
**Supported Browsers:**
- ✅ **Google Chrome** (Manifest V3)
- ✅ **Microsoft Edge** (Manifest V3)
- ✅ **Brave Browser** (Manifest V3)
- ✅ **Opera** (Manifest V3)
- ✅ **Vivaldi** (Manifest V3)
- ✅ **Any Chromium-based browser**

**Download:** [bookmark-converter-pro-chrome.zip](https://raw.githubusercontent.com/harish-govindasamy/bookmark-converter/main/browser-extension/bookmark-converter-pro-chrome.zip)

### **Firefox Extension** (Manifest V2)
**Supported Browsers:**
- ✅ **Mozilla Firefox** (Manifest V2)
- ✅ **Firefox Developer Edition**
- ✅ **Firefox Nightly**

**Download:** [bookmark-converter-pro-firefox.zip](https://raw.githubusercontent.com/harish-govindasamy/bookmark-converter/main/browser-extension/bookmark-converter-pro-firefox.zip)

---

## 🚀 Installation Guide

### **Chrome-based Browsers (Chrome, Edge, Brave, Opera, Vivaldi)**

1. **Download Extension:**
   - Download: [bookmark-converter-pro-chrome.zip](https://raw.githubusercontent.com/harish-govindasamy/bookmark-converter/main/browser-extension/bookmark-converter-pro-chrome.zip)

2. **Install Steps:**
   - Extract the ZIP file
   - Go to `chrome://extensions/` (or `edge://extensions/` for Edge)
   - Enable **"Developer mode"** (top-right toggle)
   - Click **"Load unpacked"**
   - Select the extracted folder
   - Pin the extension to toolbar

### **Firefox**

1. **Download Extension:**
   - Download: [bookmark-converter-pro-firefox.zip](https://raw.githubusercontent.com/harish-govindasamy/bookmark-converter/main/browser-extension/bookmark-converter-pro-firefox.zip)

2. **Install Steps:**
   - Extract the ZIP file
   - Go to `about:debugging`
   - Click **"This Firefox"**
   - Click **"Load Temporary Add-on"**
   - Select the `manifest.json` file from extracted folder
   - Pin the extension to toolbar

---

## ✨ Features

### **🎯 Smart URL Processing**
- Auto-clean messy text and add https://
- Remove bullets, arrows, and formatting
- Extract clean URLs from any text format

### **📁 Smart Folder Management**
- See all existing folders in your browser
- Create new folders on the fly
- Search and filter folders
- Visual distinction between real folders and suggestions

### **🔖 Multiple Bookmarking Methods**
1. **Extension Popup** - Click extension icon
2. **Floating Button** - Click 🔖 button on any page
3. **Context Menu** - Right-click → "Bookmark with Converter Pro"
4. **Keyboard Shortcut** - Press Ctrl+Shift+B

### **⚡ Smart Placement**
- Bookmarks added at **TOP** of bookmark bar for easy access
- Folders created at **TOP** for immediate visibility
- No more hunting for new bookmarks!

---

## 🔧 Technical Details

### **Chrome-based (Manifest V3)**
- **Manifest Version:** 3
- **Background Script:** Service Worker
- **API:** `chrome.*` APIs
- **Bookmark Bar ID:** `'1'`
- **Action:** `chrome.action` (not `browser_action`)

### **Firefox (Manifest V2)**
- **Manifest Version:** 2
- **Background Script:** Background Script (not service worker)
- **API:** `browser.*` APIs
- **Bookmark Bar ID:** `'toolbar_____'`
- **Action:** `browser.browser_action`

---

## 🛠️ Development

### **Building Extensions**

**Chrome-based:**
```bash
cd chrome-based
# Files are ready to use
```

**Firefox:**
```bash
cd firefox
# Files are ready to use
```

### **Testing**

**Chrome-based:**
1. Load unpacked extension in Chrome/Edge
2. Test all functionality
3. Check console for errors

**Firefox:**
1. Load temporary add-on in Firefox
2. Test all functionality
3. Check console for errors

---

## 📦 Packaging

### **Chrome-based Package:**
- **File:** `bookmark-converter-pro-chrome.zip`
- **Contents:** All files from `chrome-based/` folder
- **Manifest:** V3 format

### **Firefox Package:**
- **File:** `bookmark-converter-pro-firefox.zip`
- **Contents:** All files from `firefox/` folder
- **Manifest:** V2 format

---

## 🔄 Updates

To update extensions:
1. Download the latest package for your browser type
2. Extract to a new folder
3. Remove old extension
4. Install new version

---

## 📞 Support

- **Web App:** [https://bookmark-converter-8okt.onrender.com](https://bookmark-converter-8okt.onrender.com)
- **GitHub:** [https://github.com/harish-govindasamy/bookmark-converter](https://github.com/harish-govindasamy/bookmark-converter)

---

## 🎉 Success!

Once installed, you'll have:
- ✅ **Browser-specific optimization**
- ✅ **Smart URL processing**
- ✅ **Top-positioned bookmarks**
- ✅ **Folder management**
- ✅ **Multiple bookmarking methods**
- ✅ **No more browser compatibility issues!**

**Happy bookmarking! 🚀**