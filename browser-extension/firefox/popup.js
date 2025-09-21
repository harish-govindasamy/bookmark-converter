// Popup script for Bookmark Converter Pro Extension (Firefox)

document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const urlsTextarea = document.getElementById('urls');
    const folderNameInput = document.getElementById('folderName');
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    const openWebAppBtn = document.getElementById('openWebApp');
    
    // Load saved settings
    loadSettings();
    
    // Initialize folder selector
    initializeFolderSelector();
    
    // Event listeners
    bookmarkBtn.addEventListener('click', bookmarkUrls);
    openWebAppBtn.addEventListener('click', openWebAppAction);
    
    // Import/Export event listeners
    document.getElementById('importBookmarks').addEventListener('click', importBookmarksAction);
    document.getElementById('exportBookmarks').addEventListener('click', exportBookmarksAction);
    document.getElementById('backupBookmarks').addEventListener('click', backupBookmarksAction);
    document.getElementById('restoreBookmarks').addEventListener('click', restoreBookmarksAction);
    
    // Load saved settings
    async function loadSettings() {
        try {
            const result = await browser.storage.local.get(['lastFolderName']);
            if (result.lastFolderName) {
                folderNameInput.value = result.lastFolderName;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    // Save settings
    async function saveSettings() {
        try {
            await browser.storage.local.set({
                lastFolderName: folderNameInput.value
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    // Bookmark URLs
    async function bookmarkUrls() {
        const urls = urlsTextarea.value.trim();
        const folderName = folderNameInput.value.trim() || 'My Bookmarks';
        
        if (!urls) {
            alert('Please enter some URLs');
            return;
        }
        
        try {
            bookmarkBtn.textContent = 'Adding...';
            bookmarkBtn.disabled = true;
            
            // Save settings
            await saveSettings();
            
            // Process and bookmark
            const response = await browser.runtime.sendMessage({
                action: 'processAndBookmark',
                data: {
                    urls: urls,
                    folderName: folderName
                }
            });
            
            if (response.success) {
                alert(`✅ Successfully added ${response.count} bookmarks to "${response.folderName}"!`);
                urlsTextarea.value = '';
            } else {
                alert(`❌ Error: ${response.error}`);
            }
        } catch (error) {
            console.error('Error bookmarking URLs:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            bookmarkBtn.textContent = 'Add Bookmarks';
            bookmarkBtn.disabled = false;
        }
    }
    
    // Open web app
    function openWebAppAction() {
        browser.tabs.create({ url: 'https://bookmark-converter-8okt.onrender.com' });
        window.close();
    }
    
    // Initialize folder selector
    async function initializeFolderSelector() {
        const folderNameInput = document.getElementById('folderName');
        const dropdownBtn = document.getElementById('folderDropdownBtn');
        const folderDropdown = document.getElementById('folderDropdown');
        const folderList = document.querySelector('.folder-list');
        const createNewBtn = document.getElementById('createNewFolder');
        
        let folders = [];
        let isDropdownOpen = false; // Start with dropdown closed
        
        // Show loading state
        folderList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading folders...</div>';
        
        // Load folders
        await loadFolders();
        
        // Always ensure we have some folders to show
        if (folders.length === 0) {
            folders = [
                { id: 'suggestion-1', title: 'My Bookmarks', children: [], bookmarkCount: 0, isSuggestion: true },
                { id: 'suggestion-2', title: 'Work', children: [], bookmarkCount: 0, isSuggestion: true },
                { id: 'suggestion-3', title: 'Personal', children: [], bookmarkCount: 0, isSuggestion: true },
                { id: 'suggestion-4', title: 'Learning', children: [], bookmarkCount: 0, isSuggestion: true }
            ];
            renderFolders();
        }
        
        // Toggle dropdown
        dropdownBtn.addEventListener('click', () => {
            isDropdownOpen = !isDropdownOpen;
            folderDropdown.style.display = isDropdownOpen ? 'block' : 'none';
            dropdownBtn.textContent = isDropdownOpen ? '▲' : '▼';
        });
        
        // Search functionality
        folderNameInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterFolders(searchTerm);
        });
        
        // Make input editable when clicked
        folderNameInput.addEventListener('click', () => {
            folderNameInput.removeAttribute('readonly');
            folderNameInput.focus();
        });
        
        // Create new folder
        createNewBtn.addEventListener('click', () => {
            const newFolderName = folderNameInput.value.trim();
            if (newFolderName) {
                selectFolder(newFolderName);
                closeDropdown();
            } else {
                folderNameInput.removeAttribute('readonly');
                folderNameInput.focus();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.folder-selector')) {
                closeDropdown();
            }
        });
        
        async function loadFolders() {
            try {
                // Check if extension context is valid
                if (!browser.runtime?.id) {
                    throw new Error('Extension context invalidated');
                }
                
                // Try direct API call first
                try {
                    const directFolders = await getFoldersDirectAPI();
                    if (directFolders && directFolders.length > 0) {
                        folders = directFolders;
                        console.log('Loaded folders via direct API:', folders);
                        renderFolders();
                        return;
                    }
                } catch (directError) {
                    console.warn('Direct API failed:', directError);
                }
                
                // Fallback 1: Try background script with timeout
                try {
                    const response = await Promise.race([
                        browser.runtime.sendMessage({ action: 'getBookmarkFolders' }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                    ]);
                    
                    console.log('Folder response:', response);
                    
                    if (response && response.success && response.folders) {
                        folders = response.folders;
                        console.log('Loaded folders via background script:', folders);
                        renderFolders();
                        return;
                    }
                } catch (bgError) {
                    console.warn('Background script failed:', bgError);
                }
                
                // Fallback 2: Try cached folders
                try {
                    const cachedFolders = await getCachedFolders();
                    if (cachedFolders && cachedFolders.length > 0) {
                        folders = cachedFolders;
                        console.log('Loaded folders from cache:', folders);
                        renderFolders();
                        return;
                    }
                } catch (cacheError) {
                    console.warn('Cache failed:', cacheError);
                }
                
                // Final fallback: Show default suggestions
                console.error('All methods failed, using defaults');
                folders = [
                    { id: 'suggestion-1', title: 'My Bookmarks', children: [], bookmarkCount: 0, isSuggestion: true },
                    { id: 'suggestion-2', title: 'Work', children: [], bookmarkCount: 0, isSuggestion: true },
                    { id: 'suggestion-3', title: 'Personal', children: [], bookmarkCount: 0, isSuggestion: true },
                    { id: 'suggestion-4', title: 'Learning', children: [], bookmarkCount: 0, isSuggestion: true }
                ];
                renderFolders();
                
            } catch (error) {
                console.error('Error loading folders:', error);
                // Show fallback with default suggestions
                folders = [
                    { id: 'suggestion-1', title: 'My Bookmarks', children: [], bookmarkCount: 0, isSuggestion: true },
                    { id: 'suggestion-2', title: 'Work', children: [], bookmarkCount: 0, isSuggestion: true },
                    { id: 'suggestion-3', title: 'Personal', children: [], bookmarkCount: 0, isSuggestion: true },
                    { id: 'suggestion-4', title: 'Learning', children: [], bookmarkCount: 0, isSuggestion: true }
                ];
                renderFolders();
            }
        }
        
        async function getFoldersDirectAPI() {
            try {
                const bookmarkTree = await browser.bookmarks.getTree();
                const folders = [];
                
                // Get bookmark toolbar
                const bookmarkToolbar = bookmarkTree[0]?.children?.find(node => 
                    node.title === 'Bookmarks Toolbar' || node.id === 'toolbar_____'
                );
                
                if (bookmarkToolbar && bookmarkToolbar.children) {
                    for (const node of bookmarkToolbar.children) {
                        if (node.children && !node.url) {
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
                
                // Always add default suggestions
                const defaultSuggestions = [
                    { id: 'suggestion-1', title: 'My Bookmarks', children: [], bookmarkCount: 0, isSuggestion: true },
                    { id: 'suggestion-2', title: 'Work', children: [], bookmarkCount: 0, isSuggestion: true },
                    { id: 'suggestion-3', title: 'Personal', children: [], bookmarkCount: 0, isSuggestion: true },
                    { id: 'suggestion-4', title: 'Learning', children: [], bookmarkCount: 0, isSuggestion: true }
                ];
                
                folders.push(...defaultSuggestions);
                return folders;
            } catch (error) {
                console.error('Direct API failed:', error);
                return null;
            }
        }
        
        async function getCachedFolders() {
            try {
                const result = await browser.storage.local.get(['cachedFolders', 'cacheTimestamp']);
                const now = Date.now();
                const cacheAge = now - (result.cacheTimestamp || 0);
                
                // Use cache if it's less than 1 hour old
                if (result.cachedFolders && cacheAge < 3600000) {
                    return result.cachedFolders;
                }
                return null;
            } catch (error) {
                console.error('Cache retrieval failed:', error);
                return null;
            }
        }
        
        async function cacheFolders(folders) {
            try {
                await browser.storage.local.set({
                    cachedFolders: folders,
                    cacheTimestamp: Date.now()
                });
            } catch (error) {
                console.error('Cache storage failed:', error);
            }
        }
        
        function renderFolders() {
            folderList.innerHTML = '';
            
            if (folders.length === 0) {
                // Show message when no folders
                const noFoldersMsg = document.createElement('div');
                noFoldersMsg.className = 'no-folders-message';
                noFoldersMsg.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #666;">
                        <div style="font-size: 24px; margin-bottom: 10px;">📁</div>
                        <div style="font-weight: 600; margin-bottom: 5px;">No folders found</div>
                        <div style="font-size: 12px;">Type a name above to create your first folder!</div>
                        <div style="margin-top: 15px; padding: 10px; background: rgba(79, 172, 254, 0.1); border-radius: 6px; border: 1px solid rgba(79, 172, 254, 0.3);">
                            <div style="font-size: 12px; color: #4facfe; font-weight: 600; margin-bottom: 5px;">💡 Quick Start:</div>
                            <div style="font-size: 11px; color: #888;">Just type a folder name in the input field above!</div>
                        </div>
                    </div>
                `;
                folderList.appendChild(noFoldersMsg);
                return;
            }
            
            folders.forEach(folder => {
                const folderItem = document.createElement('div');
                folderItem.className = 'folder-item';
                
                // Different styling for suggestions vs real folders
                const isSuggestion = folder.isSuggestion;
                const icon = isSuggestion ? '💡' : '📁';
                const count = folder.bookmarkCount || (folder.children ? folder.children.length : 0);
                
                folderItem.innerHTML = `
                    <span class="folder-icon">${icon}</span>
                    <span class="folder-name">${folder.title}</span>
                    <span class="folder-count">${count}</span>
                `;
                
                // Different styling for suggestions
                if (isSuggestion) {
                    folderItem.style.opacity = '0.7';
                    folderItem.style.fontStyle = 'italic';
                }
                
                folderItem.addEventListener('click', () => {
                    selectFolder(folder.title);
                    closeDropdown();
                });
                
                folderList.appendChild(folderItem);
            });
            
            // Cache successful folder loads for future use
            if (folders.length > 0 && !folders.every(f => f.isSuggestion)) {
                cacheFolders(folders);
            }
        }
        
        function filterFolders(searchTerm) {
            const folderItems = document.querySelectorAll('.folder-item');
            let hasVisibleFolders = false;
            
            folderItems.forEach(item => {
                const folderName = item.querySelector('.folder-name').textContent.toLowerCase();
                if (folderName.includes(searchTerm)) {
                    item.style.display = 'flex';
                    hasVisibleFolders = true;
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Show create new button if no exact match
            const exactMatch = folders.some(f => f.title.toLowerCase() === searchTerm);
            createNewBtn.style.display = exactMatch ? 'none' : 'block';
        }
        
        function selectFolder(folderName) {
            folderNameInput.value = folderName;
            folderNameInput.setAttribute('readonly', 'readonly');
            
            // Remove previous selection
            document.querySelectorAll('.folder-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Highlight selected folder
            const folderItems = document.querySelectorAll('.folder-item');
            folderItems.forEach(item => {
                if (item.querySelector('.folder-name').textContent === folderName) {
                    item.classList.add('selected');
                }
            });
        }
        
        function closeDropdown() {
            isDropdownOpen = false;
            folderDropdown.style.display = 'none';
            dropdownBtn.textContent = '▼';
        }
    }

    // Import/Export Functions
    async function importBookmarksAction() {
        try {
            showStatus('Opening file selector...', 'loading');
            
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.html,.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await processImportFile(file);
                }
            };
            input.click();
            
            hideStatus();
        } catch (error) {
            showStatus('Failed to open file selector: ' + error.message, 'error');
        }
    }

    async function exportBookmarksAction() {
        try {
            showStatus('Exporting bookmarks...', 'loading');
            
            const bookmarks = await browser.bookmarks.getTree();
            const htmlContent = generateHTMLBookmarks(bookmarks);
            
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookmarks_export_${new Date().toISOString().split('T')[0]}.html`;
            a.click();
            URL.revokeObjectURL(url);
            
            showStatus('Bookmarks exported successfully!', 'success');
        } catch (error) {
            showStatus('Failed to export bookmarks: ' + error.message, 'error');
        }
    }

    async function backupBookmarksAction() {
        try {
            showStatus('Creating backup...', 'loading');
            
            const bookmarks = await browser.bookmarks.getTree();
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                bookmarks: bookmarks
            };
            
            const jsonContent = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookmarks_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showStatus('Backup created successfully!', 'success');
        } catch (error) {
            showStatus('Failed to create backup: ' + error.message, 'error');
        }
    }

    async function restoreBookmarksAction() {
        try {
            showStatus('Opening restore file selector...', 'loading');
            
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await processRestoreFile(file);
                }
            };
            input.click();
            
            hideStatus();
        } catch (error) {
            showStatus('Failed to open restore file selector: ' + error.message, 'error');
        }
    }

    async function processImportFile(file) {
        try {
            showStatus('Processing import file...', 'loading');
            
            const content = await readFileAsText(file);
            const format = file.name.split('.').pop().toLowerCase();
            
            if (format === 'html') {
                await importHTMLBookmarks(content);
            } else if (format === 'json') {
                await importJSONBookmarks(content);
            } else {
                throw new Error('Unsupported file format');
            }
            
            showStatus('Bookmarks imported successfully!', 'success');
        } catch (error) {
            showStatus('Failed to import bookmarks: ' + error.message, 'error');
        }
    }

    async function processRestoreFile(file) {
        try {
            showStatus('Processing restore file...', 'loading');
            
            const content = await readFileAsText(file);
            const backupData = JSON.parse(content);
            
            if (!backupData.bookmarks) {
                throw new Error('Invalid backup file format');
            }
            
            await restoreBookmarksFromBackup(backupData.bookmarks);
            
            showStatus('Bookmarks restored successfully!', 'success');
        } catch (error) {
            showStatus('Failed to restore bookmarks: ' + error.message, 'error');
        }
    }

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    async function importHTMLBookmarks(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const links = doc.querySelectorAll('a[href]');
        
        for (const link of links) {
            if (link.href && link.href !== 'about:blank') {
                await browser.bookmarks.create({
                    title: link.textContent || link.href,
                    url: link.href
                });
            }
        }
    }

    async function importJSONBookmarks(jsonContent) {
        const data = JSON.parse(jsonContent);
        
        if (data.roots) {
            await importBookmarkTree(data.roots);
        } else if (Array.isArray(data)) {
            for (const item of data) {
                if (item.url) {
                    await browser.bookmarks.create({
                        title: item.title || item.name || item.url,
                        url: item.url
                    });
                }
            }
        }
    }

    async function importBookmarkTree(roots) {
        for (const [key, root] of Object.entries(roots)) {
            if (root.children) {
                for (const child of root.children) {
                    if (child.url) {
                        await browser.bookmarks.create({
                            title: child.title || child.name || child.url,
                            url: child.url
                        });
                    } else if (child.children) {
                        await importBookmarkTree({child});
                    }
                }
            }
        }
    }

    async function restoreBookmarksFromBackup(bookmarks) {
        for (const bookmark of bookmarks) {
            if (bookmark.url) {
                await browser.bookmarks.create({
                    title: bookmark.title || bookmark.name || bookmark.url,
                    url: bookmark.url
                });
            }
        }
    }

    function generateHTMLBookmarks(bookmarks) {
        let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;
        
        const extractBookmarks = (nodes) => {
            for (const node of nodes) {
                if (node.url) {
                    html += `    <DT><A HREF="${node.url}">${node.title || node.url}</A>\n`;
                }
                if (node.children) {
                    extractBookmarks(node.children);
                }
            }
        };
        
        extractBookmarks(bookmarks);
        html += `</DL><p>`;
        return html;
    }

    function showStatus(message, type) {
        // Create or update status element
        let statusEl = document.getElementById('status');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'status';
            statusEl.style.cssText = `
                padding: 10px;
                margin: 10px 0;
                border-radius: 4px;
                font-size: 12px;
                text-align: center;
            `;
            document.querySelector('.container').appendChild(statusEl);
        }
        
        statusEl.textContent = message;
        statusEl.className = type;
        
        if (type === 'success') {
            statusEl.style.background = '#d4edda';
            statusEl.style.color = '#155724';
            statusEl.style.border = '1px solid #c3e6cb';
        } else if (type === 'error') {
            statusEl.style.background = '#f8d7da';
            statusEl.style.color = '#721c24';
            statusEl.style.border = '1px solid #f5c6cb';
        } else if (type === 'loading') {
            statusEl.style.background = '#d1ecf1';
            statusEl.style.color = '#0c5460';
            statusEl.style.border = '1px solid #bee5eb';
        }
    }

    function hideStatus() {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.style.display = 'none';
        }
    }
});
