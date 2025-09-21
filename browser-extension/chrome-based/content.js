// Bookmark Converter Pro - Enterprise-Grade Content Script
// Professional bookmark integration with comprehensive error handling

console.log('🚀 Bookmark Converter Pro content script loaded');
console.log('Content script running on:', window.location.href);
console.log('Chrome runtime available:', typeof chrome !== 'undefined' && chrome.runtime);

// Inject bookmark button into pages
function injectBookmarkButton() {
    // Check if button already exists
    if (document.getElementById('bookmark-converter-btn')) {
        return;
    }
    
    // Only inject on valid pages
    if (window.location.protocol === 'chrome:' || 
        window.location.protocol === 'moz-extension:' ||
        window.location.protocol === 'edge:') {
        return;
    }
    
    // Create floating bookmark button
    const button = document.createElement('div');
    button.id = 'bookmark-converter-btn';
    button.innerHTML = '🔖';
    button.title = 'Bookmark with Converter Pro';
    
    // Style the button
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
        transition: all 0.3s ease;
        user-select: none;
    `;
    
    // Add hover effects
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 6px 20px rgba(79, 172, 254, 0.4)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.3)';
    });
    
    // Add click handler
    button.addEventListener('click', function() {
        bookmarkCurrentPage();
    });
    
    // Add to page
    document.body.appendChild(button);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (button && button.parentNode) {
            button.style.opacity = '0.7';
        }
    }, 5000);
}

// Bookmark current page with folder selection
async function bookmarkCurrentPage() {
    try {
        // Check if extension context is still valid
        if (!chrome.runtime?.id) {
            showNotification('❌ Extension context invalidated. Please reload the page.', 'error');
            return;
        }
        
        // Show folder selection dialog
        const folderName = await showFolderSelectionDialog();
        if (!folderName) {
            return; // User cancelled
        }
        
        const response = await chrome.runtime.sendMessage({
            action: 'bookmarkCurrentPageWithFolder',
            folderName: folderName
        });
        
        if (response && response.success) {
            showNotification(`✅ Page bookmarked in "${folderName}"!`, 'success');
        } else {
            const errorMsg = response?.error || 'Unknown error occurred';
            showNotification('❌ ' + errorMsg, 'error');
        }
    } catch (error) {
        console.error('Error bookmarking page:', error);
        if (error.message.includes('Extension context invalidated')) {
            showNotification('❌ Extension was reloaded. Please refresh the page.', 'error');
        } else {
            showNotification('❌ Error bookmarking page', 'error');
        }
    }
}

// Show smart folder selection dialog
function showFolderSelectionDialog() {
    return new Promise((resolve) => {
        // Check if dialog is already open
        if (document.getElementById('bookmark-folder-dialog')) {
            resolve(null);
            return;
        }
        
        // Get existing folders first
        chrome.runtime.sendMessage({ action: 'getBookmarkFolders' }, (response) => {
            // Handle extension context invalidation
            if (chrome.runtime.lastError) {
                console.error('Extension context error:', chrome.runtime.lastError);
                resolve(null);
                return;
            }
            
            if (!response || !response.folders) {
                response = { folders: [] };
            }
            
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.id = 'bookmark-folder-dialog';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10002;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            // Create modal
            const modal = document.createElement('div');
            modal.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            `;
            
            // Generate folder options HTML
            const folderOptionsHTML = response.folders.map(folder => {
                const isSuggestion = folder.isSuggestion;
                const icon = isSuggestion ? '💡' : '📁';
                const count = folder.bookmarkCount || (folder.children ? folder.children.length : 0);
                const opacity = isSuggestion ? '0.7' : '1';
                const fontStyle = isSuggestion ? 'italic' : 'normal';
                
                return `<div class="folder-option" data-folder="${folder.title}" style="padding: 12px; border: 1px solid #eee; border-radius: 6px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 10px; opacity: ${opacity}; font-style: ${fontStyle};">
                    <span style="font-size: 16px;">${icon}</span>
                    <span style="flex: 1; font-size: 14px; color: #333;">${folder.title}</span>
                    <span style="font-size: 12px; color: #666; background: #f0f0f0; padding: 2px 8px; border-radius: 12px;">${count} bookmarks</span>
                </div>`;
            }).join('');
            
            modal.innerHTML = `
                <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">📁 Choose Bookmark Folder</h3>
                <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">Select an existing folder or create a new one</p>
                
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <input type="text" id="folderSearch" placeholder="Search folders or type new folder name..." 
                               style="flex: 1; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;">
                        <button id="createNewBtn" style="padding: 12px 20px; border: none; background: #28a745; color: white; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; white-space: nowrap;">
                            ➕ New Folder
                        </button>
                    </div>
                    
                    <div id="folderList" style="max-height: 200px; overflow-y: auto; border: 1px solid #eee; border-radius: 6px; padding: 10px;">
                        ${folderOptionsHTML}
                        <div id="noFolders" style="text-align: center; color: #666; padding: 20px; font-style: italic; display: ${response.folders.length === 0 ? 'block' : 'none'};">
                            No folders found. Create a new one above!
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cancelBtn" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-size: 14px;">Cancel</button>
                    <button id="saveBtn" style="padding: 10px 20px; border: none; background: #4facfe; color: white; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">Save Bookmark</button>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            // Get elements
            const searchInput = modal.querySelector('#folderSearch');
            const folderList = modal.querySelector('#folderList');
            const noFolders = modal.querySelector('#noFolders');
            const createNewBtn = modal.querySelector('#createNewBtn');
            const cancelBtn = modal.querySelector('#cancelBtn');
            const saveBtn = modal.querySelector('#saveBtn');
            const folderOptions = modal.querySelectorAll('.folder-option');
            
            let selectedFolder = null;
            let isCreatingNew = false;
            
            // Focus search input
            searchInput.focus();
            
            // Search functionality
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                let hasVisibleFolders = false;
                
                folderOptions.forEach(option => {
                    const folderName = option.dataset.folder.toLowerCase();
                    if (folderName.includes(searchTerm)) {
                        option.style.display = 'flex';
                        hasVisibleFolders = true;
                    } else {
                        option.style.display = 'none';
                    }
                });
                
                noFolders.style.display = hasVisibleFolders ? 'none' : 'block';
                
                // If typing something new, show create new option
                if (searchTerm && !response.folders.some(f => f.title.toLowerCase() === searchTerm)) {
                    isCreatingNew = true;
                    selectedFolder = searchTerm;
                } else {
                    isCreatingNew = false;
                    selectedFolder = null;
                }
            });
            
            // Folder selection
            folderOptions.forEach(option => {
                option.addEventListener('click', () => {
                    // Remove previous selection
                    folderOptions.forEach(opt => opt.style.background = 'white');
                    
                    // Select this folder
                    option.style.background = '#e3f2fd';
                    option.style.borderColor = '#4facfe';
                    selectedFolder = option.dataset.folder;
                    isCreatingNew = false;
                    searchInput.value = selectedFolder;
                });
                
                // Hover effects
                option.addEventListener('mouseenter', () => {
                    if (option.style.background !== '#e3f2fd') {
                        option.style.background = '#f8f9fa';
                    }
                });
                
                option.addEventListener('mouseleave', () => {
                    if (option.style.background !== '#e3f2fd') {
                        option.style.background = 'white';
                    }
                });
            });
            
            // Create new folder
            createNewBtn.addEventListener('click', () => {
                const newFolderName = searchInput.value.trim();
                if (newFolderName) {
                    selectedFolder = newFolderName;
                    isCreatingNew = true;
                    saveBtn.click();
                } else {
                    searchInput.focus();
                }
            });
            
            // Handle events
            const cleanup = () => {
                document.body.removeChild(overlay);
            };
            
            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(null);
            });
            
            saveBtn.addEventListener('click', () => {
                const folderName = selectedFolder || searchInput.value.trim() || 'My Bookmarks';
                cleanup();
                resolve(folderName);
            });
            
            // Handle Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const folderName = selectedFolder || searchInput.value.trim() || 'My Bookmarks';
                    cleanup();
                    resolve(folderName);
                }
            });
            
            // Handle Escape key
            overlay.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(null);
                }
            });
            
            // Handle click outside
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(null);
                }
            });
        });
    });
}

// Show notification
function showNotification(message, type) {
    // Remove existing notification
    const existing = document.getElementById('bookmark-converter-notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.id = 'bookmark-converter-notification';
    notification.textContent = message;
    
    // Style notification
    const bgColor = type === 'success' ? '#28a745' : '#dc3545';
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10001;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Keyboard shortcut handler
document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+B to bookmark current page
    if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        bookmarkCurrentPage();
    }
});

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBookmarkButton);
} else {
    injectBookmarkButton();
}

// Re-inject on navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(injectBookmarkButton, 1000);
    }
}).observe(document, { subtree: true, childList: true });

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'bookmarkCurrentPage') {
        bookmarkCurrentPage();
        sendResponse({ success: true });
    }
    
    if (request.action === 'getPageInfo') {
        sendResponse({
            title: document.title,
            url: window.location.href,
            domain: window.location.hostname
        });
    }
});

// Listen for messages from web app
window.addEventListener('message', function(event) {
    console.log('Content script received message:', event.data);
    
    if (event.data && event.data.type === 'BOOKMARK_CONVERTER_PING') {
        console.log('Responding to ping');
        // Respond to ping
        window.postMessage({
            type: 'BOOKMARK_CONVERTER_RESPONSE',
            success: true,
            message: 'Extension detected'
        }, '*');
    } else if (event.data && event.data.type === 'BOOKMARK_CONVERTER_MESSAGE') {
        console.log('Handling web app message:', event.data);
        // Handle web app messages
        const { action, data } = event.data;
        
        if (action === 'importBookmarks' || action === 'exportBookmarks') {
            console.log('Forwarding to background script:', { action, data });
            
            // Check if we have access to chrome.runtime
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                console.log('Sending message to background script...');
                // Forward to background script
                chrome.runtime.sendMessage({
                    action: action,
                    data: data
                }, (response) => {
                    console.log('Background script response received:', response);
                    console.log('Chrome runtime last error:', chrome.runtime.lastError);
                    
                    // Check for errors
                    if (chrome.runtime.lastError) {
                        console.error('Extension communication error:', chrome.runtime.lastError);
                        window.postMessage({
                            type: 'BOOKMARK_CONVERTER_RESPONSE',
                            success: false,
                            message: 'Extension communication failed: ' + chrome.runtime.lastError.message
                        }, '*');
                    } else {
                        console.log('Sending success response to web app');
                        // Send response back to web app
                        window.postMessage({
                            type: 'BOOKMARK_CONVERTER_RESPONSE',
                            success: response ? response.success : false,
                            message: response ? response.message : 'Extension communication failed',
                            data: response ? response.data : null
                        }, '*');
                    }
                });
            } else {
                console.error('chrome.runtime not available');
                window.postMessage({
                    type: 'BOOKMARK_CONVERTER_RESPONSE',
                    success: false,
                    message: 'Extension runtime not available'
                }, '*');
            }
        }
    }
});

// Add page info to window for easy access
window.bookmarkConverter = {
    bookmarkCurrentPage: bookmarkCurrentPage,
    getPageInfo: () => ({
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname
    })
};

// Mark extension as available for web app detection
window.bookmarkConverterExtension = true;