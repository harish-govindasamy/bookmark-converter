// Content script for Bookmark Converter Pro Extension

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
        // Show folder selection dialog
        const folderName = await showFolderSelectionDialog();
        if (!folderName) {
            return; // User cancelled
        }
        
        const response = await chrome.runtime.sendMessage({
            action: 'bookmarkCurrentPageWithFolder',
            folderName: folderName
        });
        
        if (response.success) {
            showNotification(`✅ Page bookmarked in "${folderName}"!`, 'success');
        } else {
            showNotification('❌ ' + response.error, 'error');
        }
    } catch (error) {
        console.error('Error bookmarking page:', error);
        showNotification('❌ Error bookmarking page', 'error');
    }
}

// Show folder selection dialog
function showFolderSelectionDialog() {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
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
            max-width: 400px;
            width: 90%;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        modal.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #333; font-size: 18px;">📁 Choose Bookmark Folder</h3>
            <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">Where would you like to save this bookmark?</p>
            <input type="text" id="folderName" placeholder="Enter folder name..." 
                   style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; margin-bottom: 20px; box-sizing: border-box;"
                   value="My Bookmarks">
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelBtn" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-size: 14px;">Cancel</button>
                <button id="saveBtn" style="padding: 10px 20px; border: none; background: #4facfe; color: white; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">Save Bookmark</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Focus input
        const input = modal.querySelector('#folderName');
        input.focus();
        input.select();
        
        // Handle events
        const cancelBtn = modal.querySelector('#cancelBtn');
        const saveBtn = modal.querySelector('#saveBtn');
        
        const cleanup = () => {
            document.body.removeChild(overlay);
        };
        
        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(null);
        });
        
        saveBtn.addEventListener('click', () => {
            const folderName = input.value.trim() || 'My Bookmarks';
            cleanup();
            resolve(folderName);
        });
        
        // Handle Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const folderName = input.value.trim() || 'My Bookmarks';
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

// Add page info to window for easy access
window.bookmarkConverter = {
    bookmarkCurrentPage: bookmarkCurrentPage,
    getPageInfo: () => ({
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname
    })
};
