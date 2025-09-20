# Bookmark Converter Pro - Browser Extension

A powerful browser extension that allows users to convert URLs to organized bookmarks with smart processing and direct browser integration.

## Features

### 🚀 Core Features
- **Smart URL Processing** - Automatically cleans messy text and adds https://
- **Direct Browser Integration** - Add bookmarks directly without manual import
- **Multiple Folder Support** - Organize bookmarks into custom folders
- **Bulk Operations** - Process multiple URLs at once
- **Cross-Browser Support** - Works on Chrome, Firefox, Edge, and Safari

### ⚡ Quick Actions
- **Bookmark Current Page** - One-click bookmarking
- **Bookmark All Tabs** - Save all open tabs as bookmarks
- **Floating Bookmark Button** - Quick access on any webpage
- **Keyboard Shortcuts** - Ctrl+Shift+B for quick bookmarking
- **Context Menu Integration** - Right-click to bookmark

### 🎨 User Experience
- **Beautiful UI** - Modern glassmorphism design
- **Smart Processing** - Handles messy text input automatically
- **Real-time Feedback** - Instant success/error notifications
- **Settings Persistence** - Remembers your preferences
- **Mobile Responsive** - Works on all devices

## Installation

### For Developers (Chrome/Edge)
1. Download or clone this extension
2. Open Chrome/Edge and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your toolbar

### For Developers (Firefox)
1. Download or clone this extension
2. Open Firefox and go to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file

### For Users (Chrome Web Store)
*Coming soon - will be published to Chrome Web Store*

## Usage

### Basic Bookmarking
1. Click the extension icon in your toolbar
2. Enter a folder name (optional)
3. Paste your URLs (one per line)
4. Click "🚀 Add to Browser"
5. Your bookmarks will be added directly to your browser!

### Quick Actions
- **Floating Button**: Click the floating bookmark button on any webpage
- **Keyboard Shortcut**: Press `Ctrl+Shift+B` to bookmark current page
- **Context Menu**: Right-click on any page and select "Bookmark with Converter Pro"
- **All Tabs**: Use "Bookmark All Tabs" to save all open tabs

### Smart URL Processing
The extension automatically:
- Removes bullet points, arrows, and numbering
- Extracts clean URLs from messy text
- Adds `https://` to domain names
- Creates meaningful titles from URLs

## File Structure

```
browser-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── content.js            # Content script for page interaction
├── icons/                # Extension icons
│   ├── icon16.png        # 16x16 icon
│   ├── icon32.png        # 32x32 icon
│   ├── icon48.png        # 48x48 icon
│   ├── icon128.png       # 128x128 icon
│   └── icon.svg          # Source SVG icon
├── generate-icons.html   # Icon generator tool
└── README.md            # This file
```

## Creating Icons

To create the required PNG icons:

1. Open `generate-icons.html` in your browser
2. Click "Generate All Icons"
3. Click "Download All Icons"
4. Save the downloaded files to the `icons/` folder

Or create your own icons with these specifications:
- **16x16px** - Toolbar icon
- **32x32px** - Windows taskbar
- **48x48px** - Extension management page
- **128x128px** - Chrome Web Store

## Permissions

The extension requires these permissions:
- **bookmarks** - To create and manage bookmarks
- **storage** - To save user settings
- **activeTab** - To access current page information
- **tabs** - To bookmark all open tabs

## Browser Compatibility

- ✅ **Chrome** 88+ (Manifest V3)
- ✅ **Edge** 88+ (Chromium-based)
- ✅ **Firefox** 109+ (Manifest V3)
- ✅ **Safari** 16+ (with modifications)

## Development

### Local Development
1. Clone the repository
2. Make your changes
3. Load the extension in developer mode
4. Test your changes
5. Reload the extension to see updates

### Building for Production
1. Create icons using `generate-icons.html`
2. Test on all target browsers
3. Package for Chrome Web Store
4. Submit for review

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: Report bugs on GitHub
- **Features**: Request features on GitHub
- **Documentation**: Check this README
- **Web App**: Use the full web version at [bookmark-converter-pro.onrender.com](https://bookmark-converter-pro.onrender.com)

## Changelog

### v1.0.0
- Initial release
- Smart URL processing
- Direct browser integration
- Cross-browser support
- Beautiful UI with glassmorphism design
- Quick actions and keyboard shortcuts
- Context menu integration
- Settings persistence
