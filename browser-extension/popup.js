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
        let isDropdownOpen = false;
        
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
        
        // Create new folder
        createNewBtn.addEventListener('click', () => {
            const newFolderName = folderNameInput.value.trim();
            if (newFolderName) {
                selectFolder(newFolderName);
                closeDropdown();
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
                const response = await chrome.runtime.sendMessage({ action: 'getBookmarkFolders' });
                if (response && response.folders) {
                    folders = response.folders;
                    renderFolders();
                }
            } catch (error) {
                console.error('Error loading folders:', error);
            }
        }
        
        function renderFolders() {
            folderList.innerHTML = '';
            folders.forEach(folder => {
                const folderItem = document.createElement('div');
                folderItem.className = 'folder-item';
                folderItem.innerHTML = `
                    <span class="folder-icon">📁</span>
                    <span class="folder-name">${folder.title}</span>
                    <span class="folder-count">${folder.children ? folder.children.length : 0}</span>
                `;
                
                folderItem.addEventListener('click', () => {
                    selectFolder(folder.title);
                    closeDropdown();
                });
                
                folderList.appendChild(folderItem);
            });
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
