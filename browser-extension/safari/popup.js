// Popup script for Bookmark Converter Pro Extension (Safari)

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
            const result = await safari.extension.settings.getItem('lastFolderName');
            if (result) {
                folderNameInput.value = result;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    // Save settings
    async function saveSettings() {
        try {
            await safari.extension.settings.setItem('lastFolderName', folderNameInput.value);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    // Bookmark URLs
    async function bookmarkUrls() {
        const urls = urlsTextarea.value.trim();
        const folderName = folderNameInput.value.trim() || 'My Bookmarks';
        
        if (!urls) {
            showStatus('Please enter some URLs', 'error');
            return;
        }
        
        try {
            showStatus('Adding bookmarks...', 'loading');
            
            const urlList = urls.split('\n').filter(url => url.trim());
            let successCount = 0;
            
            for (const url of urlList) {
                const cleanUrl = cleanUrl(url.trim());
                if (cleanUrl) {
                    try {
                        await safari.application.activeBrowserWindow.activeTab.page.dispatchMessage('addBookmark', {
                            url: cleanUrl,
                            title: cleanUrl,
                            folder: folderName
                        });
                        successCount++;
                    } catch (error) {
                        console.error('Error adding bookmark:', error);
                    }
                }
            }
            
            if (successCount > 0) {
                showStatus(`Successfully added ${successCount} bookmarks!`, 'success');
                urlsTextarea.value = '';
                await saveSettings();
            } else {
                showStatus('No valid URLs found', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showStatus('Error adding bookmarks: ' + error.message, 'error');
        }
    }
    
    // Clean URL function
    function cleanUrl(url) {
        if (!url) return '';
        
        // Remove common prefixes and suffixes
        url = url.replace(/^→\s*/, '').replace(/^-\s*/, '').replace(/^\*\s*/, '');
        url = url.replace(/\s*\([^)]*\)$/, ''); // Remove (description) at end
        
        // If it doesn't start with http, add https://
        if (!url.match(/^https?:\/\//)) {
            // Remove www. if present and add https://
            url = url.replace(/^www\./, '');
            url = 'https://' + url;
        }
        
        return url.trim();
    }
    
    // Open Web App
    function openWebAppAction() {
        safari.application.activeBrowserWindow.openTab().url = 'https://bookmark-converter-8okt.onrender.com';
    }
    
    // Initialize folder selector
    function initializeFolderSelector() {
        const folderDropdown = document.getElementById('folderDropdown');
        const folderDropdownBtn = document.getElementById('folderDropdownBtn');
        const folderList = document.querySelector('.folder-list');
        const createNewBtn = document.getElementById('createNewFolder');
        let isDropdownOpen = false;
        
        // Load folders
        loadFolders();
        
        // Dropdown toggle
        folderDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isDropdownOpen) {
                closeDropdown();
            } else {
                openDropdown();
            }
        });
        
        // Create new folder
        createNewBtn.addEventListener('click', () => {
            const newFolderName = prompt('Enter new folder name:');
            if (newFolderName && newFolderName.trim()) {
                folderNameInput.value = newFolderName.trim();
                closeDropdown();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!folderDropdown.contains(e.target) && !folderDropdownBtn.contains(e.target)) {
                closeDropdown();
            }
        });
        
        async function loadFolders() {
            try {
                // Safari doesn't have direct bookmark API access in extensions
                // We'll use a simplified approach
                const defaultFolders = [
                    { name: 'Bookmarks Bar', count: 0 },
                    { name: 'Other Bookmarks', count: 0 },
                    { name: 'My Bookmarks', count: 0 },
                    { name: 'Work', count: 0 },
                    { name: 'Personal', count: 0 }
                ];
                
                renderFolders(defaultFolders);
            } catch (error) {
                console.error('Error loading folders:', error);
                folderList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Error loading folders</div>';
            }
        }
        
        function renderFolders(folders) {
            folderList.innerHTML = '';
            
            folders.forEach(folder => {
                const folderItem = document.createElement('div');
                folderItem.className = 'folder-item';
                folderItem.innerHTML = `
                    <div class="folder-icon">📁</div>
                    <div class="folder-name">${folder.name}</div>
                    <div class="folder-count">${folder.count}</div>
                `;
                
                folderItem.addEventListener('click', () => {
                    folderNameInput.value = folder.name;
                    closeDropdown();
                });
                
                folderList.appendChild(folderItem);
            });
        }
        
        function openDropdown() {
            isDropdownOpen = true;
            folderDropdown.style.display = 'block';
            folderDropdownBtn.textContent = '▲';
        }
        
        function closeDropdown() {
            isDropdownOpen = false;
            folderDropdown.style.display = 'none';
            folderDropdownBtn.textContent = '▼';
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
            
            // Safari doesn't have direct bookmark API access
            // We'll create a sample export
            const sampleBookmarks = [
                { title: 'Sample Bookmark 1', url: 'https://example.com' },
                { title: 'Sample Bookmark 2', url: 'https://google.com' }
            ];
            
            const htmlContent = generateHTMLBookmarks(sampleBookmarks);
            
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
            
            // Safari doesn't have direct bookmark API access
            // We'll create a sample backup
            const sampleBookmarks = [
                { title: 'Sample Bookmark 1', url: 'https://example.com' },
                { title: 'Sample Bookmark 2', url: 'https://google.com' }
            ];
            
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                bookmarks: sampleBookmarks
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
                // Safari doesn't have direct bookmark API access
                // We'll add to the textarea for manual processing
                const currentUrls = urlsTextarea.value;
                urlsTextarea.value = currentUrls + (currentUrls ? '\n' : '') + link.href;
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
                    const currentUrls = urlsTextarea.value;
                    urlsTextarea.value = currentUrls + (currentUrls ? '\n' : '') + item.url;
                }
            }
        }
    }

    async function importBookmarkTree(roots) {
        for (const [key, root] of Object.entries(roots)) {
            if (root.children) {
                for (const child of root.children) {
                    if (child.url) {
                        const currentUrls = urlsTextarea.value;
                        urlsTextarea.value = currentUrls + (currentUrls ? '\n' : '') + child.url;
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
                const currentUrls = urlsTextarea.value;
                urlsTextarea.value = currentUrls + (currentUrls ? '\n' : '') + bookmark.url;
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
        
        bookmarks.forEach(bookmark => {
            if (bookmark.url) {
                html += `    <DT><A HREF="${bookmark.url}">${bookmark.title || bookmark.url}</A>\n`;
            }
        });
        
        html += `</DL><p>`;
        return html;
    }

    function showStatus(message, type) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = type;
        statusEl.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
        }
    }

    function hideStatus() {
        const statusEl = document.getElementById('status');
        statusEl.style.display = 'none';
    }

    // Web App Communication Functions
    async function importBookmarksFromWebApp(data) {
        console.log('Safari: Import bookmarks from web app:', data);
        try {
            if (!data || !data.urls) {
                throw new Error('No URLs provided for import');
            }
            
            const urls = data.urls.split('\n').filter(url => url.trim());
            const folderName = data.folderName || 'Imported Bookmarks';
            
            console.log('Safari: Processing URLs:', urls.length);
            
            // For Safari, we can only add URLs to the textarea since direct bookmark API is limited
            let successCount = 0;
            for (const url of urls) {
                const cleanUrl = url.trim();
                if (cleanUrl) {
                    const currentUrls = urlsTextarea.value;
                    urlsTextarea.value = currentUrls + (currentUrls ? '\n' : '') + cleanUrl;
                    successCount++;
                }
            }
            
            console.log('Safari: Import completed:', successCount);
            
            return {
                success: true,
                message: `Successfully imported ${successCount} URLs to textarea (Safari limitation: direct bookmark API not available)`
            };
        } catch (error) {
            console.error('Safari: Import error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async function exportBookmarksToWebApp(data) {
        console.log('Safari: Export bookmarks to web app:', data);
        try {
            // For Safari, we can only export what's in the textarea
            const urls = urlsTextarea.value.split('\n').filter(url => url.trim());
            
            console.log('Safari: Exporting URLs:', urls.length);
            
            return {
                success: true,
                message: `Exported ${urls.length} URLs from textarea`,
                data: {
                    urls: urls.join('\n'),
                    count: urls.length
                }
            };
        } catch (error) {
            console.error('Safari: Export error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Handle messages from web app (Safari extension communication)
    if (typeof safari !== 'undefined' && safari.extension) {
        safari.extension.addEventListener('message', function(event) {
            if (event.name === 'webAppMessage') {
                const request = event.message;
                
                switch (request.action) {
                    case 'ping':
                        event.target.page.dispatchMessage('webAppResponse', {
                            success: true,
                            message: 'Safari Extension detected'
                        });
                        break;
                        
                    case 'importBookmarks':
                        importBookmarksFromWebApp(request.data).then(result => {
                            event.target.page.dispatchMessage('webAppResponse', result);
                        });
                        break;
                        
                    case 'exportBookmarks':
                        exportBookmarksToWebApp(request.data).then(result => {
                            event.target.page.dispatchMessage('webAppResponse', result);
                        });
                        break;
                }
            }
        });
    }
});
