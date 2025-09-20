// Background script for Bookmark Converter Pro Extension (Firefox)

console.log('Bookmark Converter Pro Firefox background script starting...');

// Handle extension installation
browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Bookmark Converter Pro installed on Firefox');
        
        // Set default settings
        browser.storage.local.set({
            lastFolderName: 'My Bookmarks',
            extensionVersion: '1.0.0',
            browserType: 'Firefox'
        });
        
        // Open welcome page
        browser.tabs.create({
            url: 'https://bookmark-converter-8okt.onrender.com'
        });
    } else if (details.reason === 'update') {
        console.log('Bookmark Converter Pro updated on Firefox');
    }
});

// Handle keyboard shortcuts
browser.commands.onCommand.addListener((command) => {
    if (command === 'open-bookmark-converter') {
        // Open the extension popup or web app
        browser.tabs.create({
            url: 'https://bookmark-converter-8okt.onrender.com'
        });
    }
});

// Handle messages from content scripts and popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

// Bookmark current page
async function bookmarkCurrentPage(tab) {
    try {
        if (!tab.url || tab.url.startsWith('about:') || tab.url.startsWith('moz-extension://')) {
            throw new Error('Cannot bookmark this page');
        }
        
        const title = tab.title || new URL(tab.url).hostname;
        
        // Get the correct bookmark bar ID
        const bookmarkTree = await browser.bookmarks.getTree();
        const bookmarkBar = bookmarkTree[0]?.children?.find(node => 
            node.title === 'Bookmarks Toolbar' || node.id === 'toolbar_____'
        );
        const parentId = bookmarkBar ? bookmarkBar.id : 'toolbar_____';
        
        const bookmark = await browser.bookmarks.create({
            parentId: parentId, // Firefox bookmarks toolbar
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
        if (!tab.url || tab.url.startsWith('about:') || tab.url.startsWith('moz-extension://')) {
            throw new Error('Cannot bookmark this page');
        }
        
        const title = tab.title || new URL(tab.url).hostname;
        
        // Get the correct bookmark bar ID
        const bookmarkTree = await browser.bookmarks.getTree();
        const bookmarkBar = bookmarkTree[0]?.children?.find(node => 
            node.title === 'Bookmarks Toolbar' || node.id === 'toolbar_____'
        );
        const toolbarId = bookmarkBar ? bookmarkBar.id : 'toolbar_____';
        
        // Check if folder already exists
        let folder = null;
        const bookmarks = await browser.bookmarks.getChildren(toolbarId); // Get bookmarks toolbar children
        folder = bookmarks.find(b => b.title === folderName && !b.url);
        
        // Create folder if it doesn't exist
        if (!folder) {
            folder = await browser.bookmarks.create({
                title: folderName,
                parentId: toolbarId,
                index: 0 // Add folder at the beginning (top)
            });
        }
        
        // Add bookmark to folder
        const bookmark = await browser.bookmarks.create({
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
        const tabs = await browser.tabs.query({ currentWindow: true });
        const validTabs = tabs.filter(tab => 
            tab.url && 
            !tab.url.startsWith('about:') && 
            !tab.url.startsWith('moz-extension://')
        );
        
        if (validTabs.length === 0) {
            throw new Error('No valid tabs to bookmark');
        }
        
        // Get the correct bookmark bar ID
        const bookmarkTree = await browser.bookmarks.getTree();
        const bookmarkBar = bookmarkTree[0]?.children?.find(node => 
            node.title === 'Bookmarks Toolbar' || node.id === 'toolbar_____'
        );
        const toolbarId = bookmarkBar ? bookmarkBar.id : 'toolbar_____';
        
        const folderName = `All Tabs - ${new Date().toLocaleDateString()}`;
        const folder = await browser.bookmarks.create({
            title: folderName,
            parentId: toolbarId,
            index: 0 // Add folder at the beginning (top) instead of end
        });
        
        let successCount = 0;
        const errors = [];
        
        for (const tab of validTabs) {
            try {
                const title = tab.title || new URL(tab.url).hostname;
                await browser.bookmarks.create({
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
        
        // Get the correct bookmark bar ID
        const bookmarkTree = await browser.bookmarks.getTree();
        const bookmarkBar = bookmarkTree[0]?.children?.find(node => 
            node.title === 'Bookmarks Toolbar' || node.id === 'toolbar_____'
        );
        const toolbarId = bookmarkBar ? bookmarkBar.id : 'toolbar_____';
        
        // Create folder
        const folder = await browser.bookmarks.create({
            title: folderName || 'My Bookmarks',
            parentId: toolbarId,
            index: 0 // Add folder at the beginning (top) instead of end
        });
        
        // Add bookmarks
        let successCount = 0;
        const errors = [];
        
        for (const urlData of processedUrls) {
            try {
                await browser.bookmarks.create({
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

// Get bookmark toolbar folders (main folders users see)
async function getBookmarkFolders() {
    try {
        const bookmarkTree = await browser.bookmarks.getTree();
        const folders = [];
        
        // Get bookmark toolbar - this is what users see in their browser
        const bookmarkToolbar = bookmarkTree[0]?.children?.find(node => 
            node.title === 'Bookmarks Toolbar' || node.id === 'toolbar_____'
        );
        
        if (bookmarkToolbar && bookmarkToolbar.children) {
            // Find folders in bookmark toolbar
            for (const node of bookmarkToolbar.children) {
                if (node.children && !node.url) {
                    // This is a folder in bookmark toolbar
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
        
        return { success: true, folders: folders, browser: 'Firefox' };
    } catch (error) {
        return { success: false, error: error.message, browser: 'Firefox' };
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
browser.bookmarks.onCreated.addListener((id, bookmark) => {
    console.log('Bookmark created:', bookmark.title);
});

browser.bookmarks.onRemoved.addListener((id, removeInfo) => {
    console.log('Bookmark removed:', removeInfo.node.title);
});

// Context menu integration
browser.runtime.onInstalled.addListener(() => {
    // Create context menu for bookmarking
    try {
        browser.contextMenus.create({
            id: 'bookmarkWithConverter',
            title: 'Bookmark with Converter Pro',
            contexts: ['page', 'link']
        });
        
        browser.contextMenus.create({
            id: 'bookmarkAllTabs',
            title: 'Bookmark All Tabs',
            contexts: ['page']
        });
    } catch (error) {
        console.log('Context menu creation failed:', error);
    }
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
        if (info.menuItemId === 'bookmarkWithConverter') {
            if (info.linkUrl) {
                // Get the correct bookmark bar ID
                const bookmarkTree = await browser.bookmarks.getTree();
                const bookmarkBar = bookmarkTree[0]?.children?.find(node => 
                    node.title === 'Bookmarks Toolbar' || node.id === 'toolbar_____'
                );
                const toolbarId = bookmarkBar ? bookmarkBar.id : 'toolbar_____';
                
                // Bookmark the link
                await browser.bookmarks.create({
                    parentId: toolbarId,
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
