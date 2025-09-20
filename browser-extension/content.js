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

// Bookmark current page
async function bookmarkCurrentPage() {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'bookmarkCurrentPage'
        });
        
        if (response.success) {
            showNotification('✅ Page bookmarked!', 'success');
        } else {
            showNotification('❌ ' + response.error, 'error');
        }
    } catch (error) {
        console.error('Error bookmarking page:', error);
        showNotification('❌ Error bookmarking page', 'error');
    }
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
