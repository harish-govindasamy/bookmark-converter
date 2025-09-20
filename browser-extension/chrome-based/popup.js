// Popup JavaScript for Bookmark Converter Pro Extension

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('bookmarkForm');
    const addBookmarksBtn = document.getElementById('addBookmarksBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const loading = document.getElementById('loading');
    const status = document.getElementById('status');
    
    // Quick action buttons
    const bookmarkCurrentPage = document.getElementById('bookmarkCurrentPage');
    const bookmarkAllTabs = document.getElementById('bookmarkAllTabs');
    const openWebApp = document.getElementById('openWebApp');
    const manageBookmarks = document.getElementById('manageBookmarks');
    
    // Load saved settings
    loadSettings();
    
    // Initialize folder selector
    initializeFolderSelector();
    
    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await addBookmarksToBrowser();
    });
    
    // Download button
    downloadBtn.addEventListener('click', async function() {
        await downloadBookmarksHTML();
    });
    
    // Quick actions
    bookmarkCurrentPage.addEventListener('click', bookmarkCurrentPageAction);
    bookmarkAllTabs.addEventListener('click', bookmarkAllTabsAction);
    openWebApp.addEventListener('click', openWebAppAction);
    manageBookmarks.addEventListener('click', manageBookmarksAction);
    
    async function addBookmarksToBrowser() {
        const folderName = document.getElementById('folderName').value.trim();
        const urls = document.getElementById('urls').value.trim();
        
        if (!urls) {
            showStatus('Please enter some URLs', 'error');
            return;
        }
        
        showLoading(true);
        
        try {
            // Process URLs with smart cleaning
            const processedUrls = processUrls(urls);
            
            if (processedUrls.length === 0) {
                showStatus('No valid URLs found', 'error');
                return;
            }
            
            // Create folder
            const folder = await chrome.bookmarks.create({
                title: folderName || 'My Bookmarks',
                parentId: '1' // Bookmarks bar
            });
            
            // Add bookmarks to folder
            let successCount = 0;
            for (const urlData of processedUrls) {
                try {
                    await chrome.bookmarks.create({
                        parentId: folder.id,
                        title: urlData.title,
                        url: urlData.url
                    });
                    successCount++;
                } catch (error) {
                    console.error('Error adding bookmark:', error);
                }
            }
            
            // Save settings
            await saveSettings(folderName, urls);
            
            showStatus(`✅ Successfully added ${successCount} bookmarks to "${folderName}"!`, 'success');
            
            // Clear form after success
            document.getElementById('urls').value = '';
            
        } catch (error) {
            console.error('Error:', error);
            showStatus('❌ Error adding bookmarks: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }
    
    async function downloadBookmarksHTML() {
        const folderName = document.getElementById('folderName').value.trim();
        const urls = document.getElementById('urls').value.trim();
        
        if (!urls) {
            showStatus('Please enter some URLs', 'error');
            return;
        }
        
        showLoading(true);
        
        try {
            const processedUrls = processUrls(urls);
            
            if (processedUrls.length === 0) {
                showStatus('No valid URLs found', 'error');
                return;
            }
            
            // Generate HTML
            const html = generateBookmarksHTML(processedUrls, folderName || 'My Bookmarks');
            
            // Create and download file
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bookmarks.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showStatus(`✅ Downloaded HTML file with ${processedUrls.length} bookmarks!`, 'success');
            
        } catch (error) {
            console.error('Error:', error);
            showStatus('❌ Error downloading file: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }
    
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
    
    function generateBookmarksHTML(urls, folderName) {
        let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}" LAST_MODIFIED="${Math.floor(Date.now() / 1000)}" PERSONAL_TOOLBAR_FOLDER="true">${folderName}</H3>
    <DL><p>`;
    
        for (const urlData of urls) {
            html += `\n        <DT><A HREF="${urlData.url}" ADD_DATE="${Math.floor(Date.now() / 1000)}">${urlData.title}</A>`;
        }
        
        html += `\n    </DL><p>
</DL><p>`;
        
        return html;
    }
    
    async function bookmarkCurrentPageAction() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('moz-extension://')) {
                showStatus('Cannot bookmark this page', 'error');
                return;
            }
            
            const title = tab.title || new URL(tab.url).hostname;
            
            await chrome.bookmarks.create({
                parentId: '1', // Bookmarks bar
                title: title,
                url: tab.url
            });
            
            showStatus(`✅ Bookmarked: ${title}`, 'success');
            
        } catch (error) {
            console.error('Error:', error);
            showStatus('❌ Error bookmarking page', 'error');
        }
    }
    
    async function bookmarkAllTabsAction() {
        try {
            const tabs = await chrome.tabs.query({ currentWindow: true });
            const validTabs = tabs.filter(tab => 
                tab.url && 
                !tab.url.startsWith('chrome://') && 
                !tab.url.startsWith('moz-extension://') &&
                !tab.url.startsWith('edge://')
            );
            
            if (validTabs.length === 0) {
                showStatus('No valid tabs to bookmark', 'error');
                return;
            }
            
            const folderName = `All Tabs - ${new Date().toLocaleDateString()}`;
            const folder = await chrome.bookmarks.create({
                title: folderName,
                parentId: '1'
            });
            
            let successCount = 0;
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
                    console.error('Error bookmarking tab:', error);
                }
            }
            
            showStatus(`✅ Bookmarked ${successCount} tabs in "${folderName}"`, 'success');
            
        } catch (error) {
            console.error('Error:', error);
            showStatus('❌ Error bookmarking tabs', 'error');
        }
    }
    
    function openWebAppAction() {
        chrome.tabs.create({ url: 'https://bookmark-converter-8okt.onrender.com' });
        window.close();
    }
    
    function manageBookmarksAction() {
        chrome.tabs.create({ url: 'chrome://bookmarks/' });
        window.close();
    }
    
    function showLoading(show) {
        loading.style.display = show ? 'block' : 'none';
        addBookmarksBtn.disabled = show;
        downloadBtn.disabled = show;
    }
    
    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }
    }
    
    async function saveSettings(folderName, urls) {
        try {
            await chrome.storage.local.set({
                lastFolderName: folderName,
                lastUrls: urls
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    async function loadSettings() {
        try {
            const result = await chrome.storage.local.get(['lastFolderName', 'lastUrls']);
            
            if (result.lastFolderName) {
                document.getElementById('folderName').value = result.lastFolderName;
            }
            
            if (result.lastUrls) {
                document.getElementById('urls').value = result.lastUrls;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    async function initializeFolderSelector() {
        const folderNameInput = document.getElementById('folderName');
        const dropdownBtn = document.getElementById('folderDropdownBtn');
        const folderDropdown = document.getElementById('folderDropdown');
        const folderList = document.querySelector('.folder-list');
        const createNewBtn = document.getElementById('createNewFolder');
        
        let folders = [];
        let isDropdownOpen = true; // Start with dropdown open
        
        // Show loading state
        folderList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading folders...</div>';
        
        // Load folders
        await loadFolders();
        
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
        
        // Add debug button
        const debugBtn = document.createElement('button');
        debugBtn.id = 'debugFolders';
        debugBtn.textContent = '🔍 Debug Folders';
        debugBtn.style.cssText = `
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-top: 5px;
            width: 100%;
        `;
        debugBtn.addEventListener('click', () => {
            console.log('=== MANUAL DEBUG TRIGGERED ===');
            
            // First test: Force show fallback folders to test UI
            console.log('Testing UI with fallback folders...');
            folders = [
                { id: 'test-1', title: 'Test Folder 1', children: [], bookmarkCount: 5, isSuggestion: false },
                { id: 'test-2', title: 'Test Folder 2', children: [], bookmarkCount: 3, isSuggestion: false },
                { id: 'suggestion-1', title: 'My Bookmarks', children: [], bookmarkCount: 0, isSuggestion: true }
            ];
            renderFolders();
            
            // Then try to load real folders
            setTimeout(() => {
                console.log('Now trying to load real folders...');
                loadFolders();
            }, 2000);
        });
        
        const folderActions = document.querySelector('.folder-actions');
        if (folderActions) {
            folderActions.appendChild(debugBtn);
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.folder-selector')) {
                closeDropdown();
            }
        });
        
        async function loadFolders() {
            try {
                console.log('=== FOLDER LOADING DEBUG START ===');
                console.log('Extension context valid:', !!chrome.runtime?.id);
                console.log('Chrome bookmarks API available:', !!chrome.bookmarks);
                
                // First, try direct API call to see if it works at all
                console.log('Testing direct Chrome bookmarks API...');
                try {
                    const testTree = await chrome.bookmarks.getTree();
                    console.log('Direct API test successful! Bookmark tree:', testTree);
                    
                    // Get all possible bookmark locations
                    const root = testTree[0];
                    console.log('Root bookmark node:', root);
                    console.log('Root children:', root?.children);
                    
                    // Check different possible bookmark bar IDs
                    const possibleBookmarkBars = root?.children?.filter(node => 
                        node.id === "1" || 
                        node.title === "Bookmarks bar" || 
                        node.title === "Bookmarks Toolbar" ||
                        node.title === "Bookmark Bar"
                    );
                    console.log('Possible bookmark bars:', possibleBookmarkBars);
                    
                    // Try to find folders in any of these locations
                    let allFolders = [];
                    for (const bar of possibleBookmarkBars || []) {
                        console.log('Checking bookmark bar:', bar.title, bar.id);
                        if (bar.children) {
                            for (const node of bar.children) {
                                if (node.children && !node.url) {
                                    const bookmarkCount = node.children.filter(child => child.url).length;
                                    allFolders.push({
                                        id: node.id,
                                        title: node.title,
                                        children: node.children.filter(child => child.url),
                                        bookmarkCount: bookmarkCount,
                                        location: bar.title
                                    });
                                    console.log('Found folder:', node.title, 'in', bar.title, 'with', bookmarkCount, 'bookmarks');
                                }
                            }
                        }
                    }
                    
                    if (allFolders.length > 0) {
                        folders = allFolders;
                        console.log('Successfully loaded folders via direct API:', folders);
                        renderFolders();
                        return;
                    }
                    
                } catch (directError) {
                    console.error('Direct API test failed:', directError);
                }
                
                // If direct API didn't work, try background script
                console.log('Trying background script communication...');
                const response = await chrome.runtime.sendMessage({ action: 'getBookmarkFolders' });
                console.log('Background script response:', response);
                
                if (response && response.success && response.folders) {
                    folders = response.folders;
                    console.log('Loaded folders via background script:', folders);
                    renderFolders();
                } else {
                    console.error('Background script failed:', response);
                    throw new Error('Both direct API and background script failed');
                }
                
            } catch (error) {
                console.error('All folder loading methods failed:', error);
                console.log('Using fallback suggestions...');
                
                // Show fallback with default suggestions
                folders = [
                    { id: 'suggestion-1', title: 'My Bookmarks', children: [], bookmarkCount: 0, isSuggestion: true },
                    { id: 'suggestion-2', title: 'Work', children: [], bookmarkCount: 0, isSuggestion: true },
                    { id: 'suggestion-3', title: 'Personal', children: [], bookmarkCount: 0, isSuggestion: true },
                    { id: 'suggestion-4', title: 'Learning', children: [], bookmarkCount: 0, isSuggestion: true },
                    { id: 'suggestion-5', title: 'Favorites', children: [], bookmarkCount: 0, isSuggestion: true }
                ];
                renderFolders();
            }
            
            console.log('=== FOLDER LOADING DEBUG END ===');
        }
        
        function renderFolders() {
            console.log('=== RENDER FOLDERS START ===');
            console.log('Folders to render:', folders);
            
            // Get the folder list element again to ensure it exists
            const folderListElement = document.querySelector('.folder-list');
            console.log('Folder list element found:', !!folderListElement);
            
            if (!folderListElement) {
                console.error('Folder list element not found!');
                return;
            }
            
            folderListElement.innerHTML = '';
            console.log('Cleared folder list element');
            
            if (folders.length === 0) {
                console.log('No folders to render, showing no folders message');
                // Show message when no folders
                const noFoldersMsg = document.createElement('div');
                noFoldersMsg.className = 'no-folders-message';
                noFoldersMsg.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #666;">
                        <div style="font-size: 24px; margin-bottom: 10px;">📁</div>
                        <div style="font-weight: 600; margin-bottom: 5px;">No folders found</div>
                        <div style="font-size: 12px;">Type a name above to create your first folder!</div>
                        <div style="font-size: 10px; color: #999; margin-top: 10px;">Check browser console for debugging info</div>
                    </div>
                `;
                folderListElement.appendChild(noFoldersMsg);
                console.log('Added no folders message to UI');
                return;
            }
            
            console.log('Rendering', folders.length, 'folders');
            
            folders.forEach((folder, index) => {
                console.log(`Rendering folder ${index + 1}:`, folder.title);
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
                
                folderListElement.appendChild(folderItem);
                console.log(`Added folder item to UI: ${folder.title}`);
            });
            
            console.log('=== RENDER FOLDERS END ===');
            console.log('Total folders rendered:', folders.length);
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
});
