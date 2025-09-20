# Extension Files Guide - What You Need to Install

## 📦 Direct Download Links

### Option 1: Complete Repository (Recommended)
**Download Link:** [https://github.com/harish-govindasamy/bookmark-converter/archive/refs/heads/main.zip](https://github.com/harish-govindasamy/bookmark-converter/archive/refs/heads/main.zip)

This downloads the entire repository. After extraction:
1. Navigate to `bookmark-converter-main/browser-extension/` folder
2. Use this folder for installation

### Option 2: Individual Files
If you prefer to download individual files, here are the direct links:

**Core Extension Files:**
- [manifest.json](https://raw.githubusercontent.com/harish-govindasamy/bookmark-converter/main/browser-extension/manifest.json)
- [popup.html](https://raw.githubusercontent.com/harish-govindasamy/bookmark-converter/main/browser-extension/popup.html)
- [popup.js](https://raw.githubusercontent.com/harish-govindasamy/bookmark-converter/main/browser-extension/popup.js)
- [background.js](https://raw.githubusercontent.com/harish-govindasamy/bookmark-converter/main/browser-extension/background.js)
- [content.js](https://raw.githubusercontent.com/harish-govindasamy/bookmark-converter/main/browser-extension/content.js)

**Icon Files:**
- [icon16.png](https://raw.githubusercontent.com/harish-govindasamy/bookmark-converter/main/browser-extension/icons/icon16.png)
- [icon32.png](https://raw.githubusercontent.com/harish-govindasamy/bookmark-converter/main/browser-extension/icons/icon32.png)
- [icon48.png](https://raw.githubusercontent.com/harish-govindasamy/bookmark-converter/main/browser-extension/icons/icon48.png)
- [icon128.png](https://raw.githubusercontent.com/harish-govindasamy/bookmark-converter/main/browser-extension/icons/icon128.png)

## 📁 Required Files for Installation

### Essential Files (Must Have)
```
browser-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── content.js            # Content script for page interaction
└── icons/                # Extension icons folder
    ├── icon16.png        # 16x16 icon (required)
    ├── icon32.png        # 32x32 icon (required)
    ├── icon48.png        # 48x48 icon (required)
    └── icon128.png       # 128x128 icon (required)
```

### Optional Files (Nice to Have)
```
browser-extension/
├── README.md             # Documentation
├── INSTALL.md            # Installation guide
├── TESTING_GUIDE.md      # Testing instructions
├── PUBLISHING_GUIDE.md   # Publishing guide
├── package.json          # Package metadata
├── generate-icons.html   # Icon generator tool
├── test-extension.bat    # Testing script
└── package-extension.bat # Packaging script
```

## 🚀 Quick Installation Steps

### Method 1: Using Complete Download
1. **Download:** [Complete Repository ZIP](https://github.com/harish-govindasamy/bookmark-converter/archive/refs/heads/main.zip)
2. **Extract** the ZIP file
3. **Navigate** to `bookmark-converter-main/browser-extension/` folder
4. **Install** using browser developer mode

### Method 2: Using Individual Files
1. **Create folder** named `bookmark-converter-extension`
2. **Download** all essential files listed above
3. **Create** `icons` subfolder
4. **Download** all icon files to `icons` folder
5. **Install** using browser developer mode

## 🔧 Browser Installation

### Chrome/Edge
1. Go to `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `browser-extension` folder

### Firefox
1. Go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file

## ✅ Verification Checklist

Before installation, ensure you have:
- [ ] `manifest.json` file
- [ ] `popup.html` file
- [ ] `popup.js` file
- [ ] `background.js` file
- [ ] `content.js` file
- [ ] `icons` folder with 4 PNG files (16, 32, 48, 128px)

## 🐛 Troubleshooting

### Missing Icons
If icons don't show:
1. Check that all 4 PNG files are in `icons/` folder
2. Verify file names are exactly: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
3. Ensure files are not corrupted

### Extension Won't Load
If extension fails to load:
1. Check browser console for errors
2. Verify `manifest.json` is valid
3. Ensure all required files are present
4. Try reloading the extension

### Permissions Issues
If bookmarks can't be created:
1. Grant bookmark permissions when prompted
2. Check extension permissions in browser settings
3. Restart browser after installation

## 📞 Support

If you encounter issues:
1. Check the [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing instructions
2. Review the [INSTALL.md](INSTALL.md) for installation help
3. Check browser console for error messages
4. Ensure you're using a supported browser (Chrome 88+, Edge 88+, Firefox 109+)
