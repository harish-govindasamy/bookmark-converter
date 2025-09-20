// Background script for Bookmark Converter Pro Extension

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Bookmark Converter Pro installed');
        
        // Set default settings
        chrome.storage.local.set({
            lastFolderName: 'My Bookmarks',
            extensionVersion: '1.0.0'
        });
        
        // Open welcome page
        chrome.tabs.create({
            url: 'https://bookmark-converter-pro.onrender.com'
        });
    } else if (details.reason === 'update') {
        console.log('Bookmark Converter Pro updated');
    }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-bookmark-converter') {
        // Open the extension popup or web app
        chrome.tabs.create({
            url: 'https://bookmark-converter-pro.onrender.com'
        });
    }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'bookmarkCurrentPage') {
        bookmarkCurrentPage(sender.tab)
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
});

// Bookmark current page
async function bookmarkCurrentPage(tab) {
    try {
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('moz-extension://')) {
            throw new Error('Cannot bookmark this page');
        }
        
        const title = tab.title || new URL(tab.url).hostname;
        
        const bookmark = await chrome.bookmarks.create({
            parentId: '1', // Bookmarks bar
            title: title,
            url: tab.url
        });
        
        return { success: true, bookmark: bookmark };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Bookmark all open tabs
async function bookmarkAllTabs() {
    try {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const validTabs = tabs.filter(tab => 
            tab.url && 
            !tab.url.startsWith('chrome://') && 
            !tab.url.startsWith('moz-extension://') &&
            !tab.url.startsWith('edge://')
        );
        
        if (validTabs.length === 0) {
            throw new Error('No valid tabs to bookmark');
        }
        
        const folderName = `All Tabs - ${new Date().toLocaleDateString()}`;
        const folder = await chrome.bookmarks.create({
            title: folderName,
            parentId: '1'
        });
        
        let successCount = 0;
        const errors = [];
        
        for (const tab of validTabs) {
            try {
                const title = tab.title || new URL(tab.url).hostname;
                await chrome.bookmarks.create({
                    parentId: folder.id,
                    title: title,
                    url: tab.url
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
        
        // Create folder
        const folder = await chrome.bookmarks.create({
            title: folderName || 'My Bookmarks',
            parentId: '1'
        });
        
        // Add bookmarks
        let successCount = 0;
        const errors = [];
        
        for (const urlData of processedUrls) {
            try {
                await chrome.bookmarks.create({
                    parentId: folder.id,
                    title: urlData.title,
                    url: urlData.url
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
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
    console.log('Bookmark created:', bookmark.title);
});

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
    console.log('Bookmark removed:', removeInfo.node.title);
});

// Context menu integration
chrome.runtime.onInstalled.addListener(() => {
    // Create context menu for bookmarking
    chrome.contextMenus.create({
        id: 'bookmarkWithConverter',
        title: 'Bookmark with Converter Pro',
        contexts: ['page', 'link']
    });
    
    chrome.contextMenus.create({
        id: 'bookmarkAllTabs',
        title: 'Bookmark All Tabs',
        contexts: ['page']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'bookmarkWithConverter') {
        if (info.linkUrl) {
            // Bookmark the link
            await chrome.bookmarks.create({
                parentId: '1',
                title: info.linkText || new URL(info.linkUrl).hostname,
                url: info.linkUrl
            });
        } else {
            // Bookmark the current page
            await bookmarkCurrentPage(tab);
        }
    } else if (info.menuItemId === 'bookmarkAllTabs') {
        await bookmarkAllTabs();
    }
});
