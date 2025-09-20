// Universal Background script for Bookmark Converter Pro Extension
// Supports Chrome, Edge, Firefox, Safari, and other Chromium-based browsers

// Browser detection and API compatibility
const BrowserAPI = (() => {
    // Detect browser
    const isChrome = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled;
    const isFirefox = typeof browser !== 'undefined' && browser.runtime && browser.runtime.onInstalled;
    const isEdge = isChrome && navigator.userAgent.includes('Edg');
    const isSafari = typeof safari !== 'undefined';
    
    // Use appropriate API
    const api = isFirefox ? browser : chrome;
    
    return {
        api: api,
        isChrome: isChrome,
        isFirefox: isFirefox,
        isEdge: isEdge,
        isSafari: isSafari,
        browserName: isFirefox ? 'Firefox' : (isEdge ? 'Edge' : (isSafari ? 'Safari' : 'Chrome'))
    };
})();

console.log(`Bookmark Converter Pro universal background script starting for ${BrowserAPI.browserName}...`);

// Handle extension installation
BrowserAPI.api.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log(`Bookmark Converter Pro installed on ${BrowserAPI.browserName}`);
        
        // Set default settings
        BrowserAPI.api.storage.local.set({
            lastFolderName: 'My Bookmarks',
            extensionVersion: '1.0.0',
            browserType: BrowserAPI.browserName
        });
        
        // Open welcome page
        BrowserAPI.api.tabs.create({
            url: 'https://bookmark-converter-8okt.onrender.com'
        });
    } else if (details.reason === 'update') {
        console.log(`Bookmark Converter Pro updated on ${BrowserAPI.browserName}`);
    }
});

// Handle keyboard shortcuts
BrowserAPI.api.commands.onCommand.addListener((command) => {
    if (command === 'open-bookmark-converter') {
        // Open the extension popup or web app
        BrowserAPI.api.tabs.create({
            url: 'https://bookmark-converter-8okt.onrender.com'
        });
    }
});

// Handle messages from content scripts and popup
BrowserAPI.api.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request.action);
    
    if (request.action === 'bookmarkCurrentPage') {
        bookmarkCurrentPage(sender.tab)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'bookmarkCurrentPageWithFolder') {
        bookmarkCurrentPageWithFolder(sender.tab, request.folderName)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'bookmarkAllTabs') {
        bookmarkAllTabs()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
    
    if (request.action === 'processAndBookmark') {
        processAndBookmark(request.data)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
    
    if (request.action === 'getBookmarkFolders') {
        getBookmarkFolders()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
});

// Get the correct bookmark bar ID for different browsers
function getBookmarkBarId() {
    if (BrowserAPI.isFirefox) {
        return 'toolbar_____'; // Firefox bookmark toolbar
    } else {
        return '1'; // Chrome/Edge/Safari bookmarks bar
    }
}

// Bookmark current page
async function bookmarkCurrentPage(tab) {
    try {
        const invalidProtocols = BrowserAPI.isFirefox ? 
            ['about:', 'moz-extension:'] : 
            ['chrome:', 'moz-extension:', 'edge:'];
            
        if (!tab.url || invalidProtocols.some(protocol => tab.url.startsWith(protocol))) {
            throw new Error('Cannot bookmark this page');
        }
        
        const title = tab.title || new URL(tab.url).hostname;
        const bookmarkBarId = getBookmarkBarId();
        
        const bookmark = await BrowserAPI.api.bookmarks.create({
            parentId: bookmarkBarId,
            title: title,
            url: tab.url,
            index: 0 // Add at the beginning (top) instead of end
        });
        
        return { success: true, bookmark: bookmark };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Bookmark current page with folder
async function bookmarkCurrentPageWithFolder(tab, folderName) {
    try {
        const invalidProtocols = BrowserAPI.isFirefox ? 
            ['about:', 'moz-extension:'] : 
            ['chrome:', 'moz-extension:', 'edge:'];
            
        if (!tab.url || invalidProtocols.some(protocol => tab.url.startsWith(protocol))) {
            throw new Error('Cannot bookmark this page');
        }
        
        const title = tab.title || new URL(tab.url).hostname;
        const bookmarkBarId = getBookmarkBarId();
        
        // Check if folder already exists
        let folder = null;
        const bookmarks = await BrowserAPI.api.bookmarks.getChildren(bookmarkBarId);
        folder = bookmarks.find(b => b.title === folderName && !b.url);
        
        // Create folder if it doesn't exist
        if (!folder) {
            folder = await BrowserAPI.api.bookmarks.create({
                title: folderName,
                parentId: bookmarkBarId,
                index: 0 // Add folder at the beginning (top)
            });
        }
        
        // Add bookmark to folder
        const bookmark = await BrowserAPI.api.bookmarks.create({
            parentId: folder.id,
            title: title,
            url: tab.url,
            index: 0 // Add at the beginning of folder
        });
        
        return { success: true, bookmark: bookmark, folderName: folderName };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Bookmark all open tabs
async function bookmarkAllTabs() {
    try {
        const tabs = await BrowserAPI.api.tabs.query({ currentWindow: true });
        const invalidProtocols = BrowserAPI.isFirefox ? 
            ['about:', 'moz-extension:'] : 
            ['chrome:', 'moz-extension:', 'edge:'];
            
        const validTabs = tabs.filter(tab => 
            tab.url && !invalidProtocols.some(protocol => tab.url.startsWith(protocol))
        );
        
        if (validTabs.length === 0) {
            throw new Error('No valid tabs to bookmark');
        }
        
        const folderName = `All Tabs - ${new Date().toLocaleDateString()}`;
        const bookmarkBarId = getBookmarkBarId();
        
        const folder = await BrowserAPI.api.bookmarks.create({
            title: folderName,
            parentId: bookmarkBarId,
            index: 0 // Add folder at the beginning (top) instead of end
        });
        
        let successCount = 0;
        const errors = [];
        
        for (const tab of validTabs) {
            try {
                const title = tab.title || new URL(tab.url).hostname;
                await BrowserAPI.api.bookmarks.create({
                    parentId: folder.id,
                    title: title,
                    url: tab.url,
                    index: 0 // Add at the beginning of folder
                });
                successCount++;
            } catch (error) {
                errors.push({ tab: tab.title, error: error.message });
            }
        }
        
        return { 
            success: true, 
            count: successCount, 
            folderName: folderName,
            errors: errors
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Process URLs and create bookmarks
async function processAndBookmark(data) {
    try {
        const { urls, folderName } = data;
        const processedUrls = processUrls(urls);
        
        if (processedUrls.length === 0) {
            throw new Error('No valid URLs found');
        }
        
        const bookmarkBarId = getBookmarkBarId();
        
        // Create folder
        const folder = await BrowserAPI.api.bookmarks.create({
            title: folderName || 'My Bookmarks',
            parentId: bookmarkBarId,
            index: 0 // Add folder at the beginning (top) instead of end
        });
        
        // Add bookmarks
        let successCount = 0;
        const errors = [];
        
        for (const urlData of processedUrls) {
            try {
                await BrowserAPI.api.bookmarks.create({
                    parentId: folder.id,
                    title: urlData.title,
                    url: urlData.url,
                    index: 0 // Add at the beginning of folder
                });
                successCount++;
            } catch (error) {
                errors.push({ url: urlData.url, error: error.message });
            }
        }
        
        return {
            success: true,
            count: successCount,
            folderName: folderName,
            errors: errors
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get bookmark bar folders (main folders users see)
async function getBookmarkFolders() {
    try {
        const bookmarkTree = await BrowserAPI.api.bookmarks.getTree();
        const folders = [];
        const bookmarkBarId = getBookmarkBarId();
        
        // Get bookmark bar - this is what users see in their browser
        const bookmarkBar = bookmarkTree[0]?.children?.find(node => node.id === bookmarkBarId);
        
        if (bookmarkBar && bookmarkBar.children) {
            // Find folders in bookmark bar
            for (const node of bookmarkBar.children) {
                if (node.children && !node.url) {
                    // This is a folder in bookmark bar
                    const bookmarkCount = node.children.filter(child => child.url).length;
                    folders.push({
                        id: node.id,
                        title: node.title,
                        children: node.children.filter(child => child.url),
                        bookmarkCount: bookmarkCount
                    });
                }
            }
        }
        
        // If no folders found, add some default suggestions
        if (folders.length === 0) {
            folders.push(
                { id: 'suggestion-1', title: 'My Bookmarks', children: [], bookmarkCount: 0, isSuggestion: true },
                { id: 'suggestion-2', title: 'Work', children: [], bookmarkCount: 0, isSuggestion: true },
                { id: 'suggestion-3', title: 'Personal', children: [], bookmarkCount: 0, isSuggestion: true },
                { id: 'suggestion-4', title: 'Learning', children: [], bookmarkCount: 0, isSuggestion: true }
            );
        }
        
        // Sort folders by name
        folders.sort((a, b) => a.title.localeCompare(b.title));
        
        return { success: true, folders: folders, browser: BrowserAPI.browserName };
    } catch (error) {
        return { success: false, error: error.message, browser: BrowserAPI.browserName };
    }
}

// Smart URL processing function
function processUrls(urlsText) {
    const lines = urlsText.split('\n');
    const processedUrls = [];
    
    for (const line of lines) {
        let cleanLine = line.trim();
        if (!cleanLine) continue;
        
        // Remove common prefixes and formatting
        cleanLine = cleanLine.replace(/^[→\-\*\•\d+\.\)]\s*/, ''); // Remove arrows, bullets, numbers
        cleanLine = cleanLine.replace(/^[A-Za-z\s]+\(/, ''); // Remove text before parentheses
        cleanLine = cleanLine.replace(/\)$/, ''); // Remove trailing parentheses
        
        // Add https:// if needed
        if (cleanLine && !cleanLine.startsWith('http://') && !cleanLine.startsWith('https://')) {
            if (/^[a-zA-Z0-9][a-zA-Z0-9\-\.]*\.[a-zA-Z]{2,}/.test(cleanLine)) {
                cleanLine = 'https://' + cleanLine;
            }
        }
        
        if (cleanLine && (cleanLine.startsWith('http://') || cleanLine.startsWith('https://'))) {
            // Extract title from URL
            try {
                const url = new URL(cleanLine);
                const title = url.hostname.replace('www.', '');
                processedUrls.push({
                    title: title,
                    url: cleanLine
                });
            } catch {
                processedUrls.push({
                    title: cleanLine,
                    url: cleanLine
                });
            }
        }
    }
    
    return processedUrls;
}

// Handle bookmark events for analytics
BrowserAPI.api.bookmarks.onCreated.addListener((id, bookmark) => {
    console.log('Bookmark created:', bookmark.title);
});

BrowserAPI.api.bookmarks.onRemoved.addListener((id, removeInfo) => {
    console.log('Bookmark removed:', removeInfo.node.title);
});

// Context menu integration
BrowserAPI.api.runtime.onInstalled.addListener(() => {
    // Create context menu for bookmarking
    try {
        BrowserAPI.api.contextMenus.create({
            id: 'bookmarkWithConverter',
            title: 'Bookmark with Converter Pro',
            contexts: ['page', 'link']
        });
        
        BrowserAPI.api.contextMenus.create({
            id: 'bookmarkAllTabs',
            title: 'Bookmark All Tabs',
            contexts: ['page']
        });
    } catch (error) {
        console.log('Context menu creation failed:', error);
    }
});

// Handle context menu clicks
BrowserAPI.api.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
        if (info.menuItemId === 'bookmarkWithConverter') {
            if (info.linkUrl) {
                // Bookmark the link
                const bookmarkBarId = getBookmarkBarId();
                await BrowserAPI.api.bookmarks.create({
                    parentId: bookmarkBarId,
                    title: info.linkText || new URL(info.linkUrl).hostname,
                    url: info.linkUrl,
                    index: 0 // Add at the beginning (top) instead of end
                });
            } else {
                // Bookmark the current page
                await bookmarkCurrentPage(tab);
            }
        } else if (info.menuItemId === 'bookmarkAllTabs') {
            await bookmarkAllTabs();
        }
    } catch (error) {
        console.error('Context menu action failed:', error);
    }
});
