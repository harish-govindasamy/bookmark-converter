// Background script for Bookmark Converter Pro Extension (Chrome-based browsers)
// Supports Chrome, Edge, Brave, Opera, Vivaldi with Manifest V3

console.log('🚀 Bookmark Converter Pro - Enterprise-Grade Background Service Worker Starting...');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Bookmark Converter Pro installed on Chrome-based browser');
        
        // Set default settings
        chrome.storage.local.set({
            lastFolderName: 'My Bookmarks',
            extensionVersion: '1.0.0',
            browserType: 'Chrome-based'
        });
        
        // Open welcome page
        chrome.tabs.create({
            url: 'https://bookmark-converter-8okt.onrender.com'
        });
    } else if (details.reason === 'update') {
        console.log('Bookmark Converter Pro updated on Chrome-based browser');
    }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-bookmark-converter') {
        // Open the extension popup or web app
        chrome.tabs.create({
            url: 'https://bookmark-converter-8okt.onrender.com'
        });
    }
});

// Handle messages from content scripts and popup with comprehensive error handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received:', request.action, 'from:', sender.tab?.url || 'popup');
    
    try {
        switch (request.action) {
            case 'ping':
                // Respond to web app ping to detect extension
                sendResponse({success: true, message: 'Extension detected'});
                return true;
                
            case 'importBookmarks':
                importBookmarksFromWebApp(request.data)
                    .then(result => {
                        console.log('✅ Import bookmarks result:', result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('❌ Import bookmarks error:', error);
                        sendResponse({success: false, error: error.message});
                    });
                return true;
                
            case 'exportBookmarks':
                exportBookmarksToWebApp(request.data)
                    .then(result => {
                        console.log('✅ Export bookmarks result:', result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('❌ Export bookmarks error:', error);
                        sendResponse({success: false, error: error.message});
                    });
                return true;
                
            case 'bookmarkCurrentPage':
                bookmarkCurrentPage(sender.tab)
                    .then(result => {
                        console.log('✅ Bookmark current page result:', result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('❌ Bookmark current page error:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true; // Keep message channel open for async response
                
            case 'bookmarkCurrentPageWithFolder':
                bookmarkCurrentPageWithFolder(sender.tab, request.folderName)
                    .then(result => {
                        console.log('✅ Bookmark with folder result:', result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('❌ Bookmark with folder error:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
                
            case 'bookmarkAllTabs':
                bookmarkAllTabs()
                    .then(result => {
                        console.log('✅ Bookmark all tabs result:', result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('❌ Bookmark all tabs error:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
                
            case 'processAndBookmark':
                processAndBookmark(request.data)
                    .then(result => {
                        console.log('✅ Process and bookmark result:', result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('❌ Process and bookmark error:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
                
            case 'getBookmarkFolders':
                getBookmarkFolders()
                    .then(result => {
                        console.log('✅ Get bookmark folders result:', result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('❌ Get bookmark folders error:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
                
            default:
                console.warn('⚠️ Unknown action:', request.action);
                sendResponse({ success: false, error: 'Unknown action' });
                return false;
        }
    } catch (error) {
        console.error('💥 Critical error in message handler:', error);
        sendResponse({ success: false, error: 'Critical error: ' + error.message });
        return false;
    }
});

// Bookmark current page
async function bookmarkCurrentPage(tab) {
    try {
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('moz-extension://') || tab.url.startsWith('edge://')) {
            throw new Error('Cannot bookmark this page');
        }
        
        const title = tab.title || new URL(tab.url).hostname;
        
        const bookmark = await chrome.bookmarks.create({
            parentId: '1', // Chrome/Edge bookmarks bar
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
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('moz-extension://') || tab.url.startsWith('edge://')) {
            throw new Error('Cannot bookmark this page');
        }
        
        const title = tab.title || new URL(tab.url).hostname;
        
        // Check if folder already exists
        let folder = null;
        const bookmarks = await chrome.bookmarks.getChildren('1'); // Get bookmarks bar children
        folder = bookmarks.find(b => b.title === folderName && !b.url);
        
        // Create folder if it doesn't exist
        if (!folder) {
            folder = await chrome.bookmarks.create({
                title: folderName,
                parentId: '1',
                index: 0 // Add folder at the beginning (top)
            });
        }
        
        // Add bookmark to folder
        const bookmark = await chrome.bookmarks.create({
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
            parentId: '1',
            index: 0 // Add folder at the beginning (top) instead of end
        });
        
        let successCount = 0;
        const errors = [];
        
        for (const tab of validTabs) {
            try {
                const title = tab.title || new URL(tab.url).hostname;
                await chrome.bookmarks.create({
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
        
        // Create folder
        const folder = await chrome.bookmarks.create({
            title: folderName || 'My Bookmarks',
            parentId: '1',
            index: 0 // Add folder at the beginning (top) instead of end
        });
        
        // Add bookmarks
        let successCount = 0;
        const errors = [];
        
        for (const urlData of processedUrls) {
            try {
                await chrome.bookmarks.create({
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
        console.log('Getting bookmark folders...');
        const bookmarkTree = await chrome.bookmarks.getTree();
        console.log('Bookmark tree:', bookmarkTree);
        
        const folders = [];
        
        // Get bookmark bar (id: "1") - this is what users see in their browser
        const bookmarkBar = bookmarkTree[0]?.children?.find(node => node.id === "1");
        console.log('Bookmark bar:', bookmarkBar);
        
        if (bookmarkBar && bookmarkBar.children) {
            console.log('Bookmark bar children:', bookmarkBar.children);
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
                    console.log('Found folder:', node.title, 'with', bookmarkCount, 'bookmarks');
                }
            }
        } else {
            console.log('No bookmark bar or children found');
        }
        
        // Always add some default suggestions for better UX
        const defaultSuggestions = [
            { id: 'suggestion-1', title: 'My Bookmarks', children: [], bookmarkCount: 0, isSuggestion: true },
            { id: 'suggestion-2', title: 'Work', children: [], bookmarkCount: 0, isSuggestion: true },
            { id: 'suggestion-3', title: 'Personal', children: [], bookmarkCount: 0, isSuggestion: true },
            { id: 'suggestion-4', title: 'Learning', children: [], bookmarkCount: 0, isSuggestion: true }
        ];
        
        // Add default suggestions if no folders found, or append them for better UX
        if (folders.length === 0) {
            console.log('No folders found, adding default suggestions');
            folders.push(...defaultSuggestions);
        } else {
            // Add suggestions at the end for better UX
            folders.push(...defaultSuggestions);
        }
        
        // Sort folders by name
        folders.sort((a, b) => a.title.localeCompare(b.title));
        
        console.log('Returning folders:', folders);
        return { success: true, folders: folders, browser: 'Chrome-based' };
    } catch (error) {
        console.error('Error getting bookmark folders:', error);
        // Return default suggestions even on error
        const defaultSuggestions = [
            { id: 'suggestion-1', title: 'My Bookmarks', children: [], bookmarkCount: 0, isSuggestion: true },
            { id: 'suggestion-2', title: 'Work', children: [], bookmarkCount: 0, isSuggestion: true },
            { id: 'suggestion-3', title: 'Personal', children: [], bookmarkCount: 0, isSuggestion: true },
            { id: 'suggestion-4', title: 'Learning', children: [], bookmarkCount: 0, isSuggestion: true }
        ];
        return { success: true, folders: defaultSuggestions, browser: 'Chrome-based' };
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
    try {
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
    } catch (error) {
        console.log('Context menu creation failed:', error);
    }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
        if (info.menuItemId === 'bookmarkWithConverter') {
            if (info.linkUrl) {
                // Bookmark the link
                await chrome.bookmarks.create({
                    parentId: '1',
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

// Web App Communication Functions
async function importBookmarksFromWebApp(data) {
    try {
        if (!data || !data.urls) {
            throw new Error('No URLs provided for import');
        }
        
        const urls = data.urls.split('\n').filter(url => url.trim());
        const folderName = data.folderName || 'Imported Bookmarks';
        
        // Create folder if it doesn't exist
        let folderId = '1'; // Default to bookmark bar
        try {
            const folders = await chrome.bookmarks.getChildren('1');
            const existingFolder = folders.find(folder => folder.title === folderName);
            
            if (existingFolder) {
                folderId = existingFolder.id;
            } else {
                const newFolder = await chrome.bookmarks.create({
                    parentId: '1',
                    title: folderName
                });
                folderId = newFolder.id;
            }
        } catch (error) {
            console.log('Using default folder:', error);
        }
        
        // Add bookmarks
        let successCount = 0;
        for (const url of urls) {
            const cleanUrl = url.trim();
            if (cleanUrl) {
                try {
                    await chrome.bookmarks.create({
                        parentId: folderId,
                        title: cleanUrl,
                        url: cleanUrl,
                        index: 0 // Add at the beginning
                    });
                    successCount++;
                } catch (error) {
                    console.error('Failed to bookmark:', cleanUrl, error);
                }
            }
        }
        
        return {
            success: true,
            message: `Successfully imported ${successCount} bookmarks to "${folderName}" folder`
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function exportBookmarksToWebApp(data) {
    try {
        const bookmarks = await chrome.bookmarks.getTree();
        const urls = [];
        
        // Extract URLs from bookmark tree
        const extractUrls = (nodes) => {
            for (const node of nodes) {
                if (node.url) {
                    urls.push(node.url);
                }
                if (node.children) {
                    extractUrls(node.children);
                }
            }
        };
        
        extractUrls(bookmarks);
        
        // Update web app with exported URLs
        return {
            success: true,
            message: `Exported ${urls.length} bookmarks`,
            data: {
                urls: urls.join('\n'),
                count: urls.length
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
