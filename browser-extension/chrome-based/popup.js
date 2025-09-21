// Bookmark Converter Pro - Enterprise-Grade Chrome Extension
// Professional bookmark management with comprehensive error handling

class BookmarkConverterPro {
    constructor() {
        this.folders = [];
        this.isDropdownOpen = false;
        this.isLoading = false;
        this.initializeElements();
        this.initializeEventListeners();
        this.loadSettings();
        this.initializeFolderSelector();
    }

    initializeElements() {
        // Form elements
        this.form = document.getElementById('bookmarkForm');
        this.folderNameInput = document.getElementById('folderName');
        this.urlsInput = document.getElementById('urls');
        this.addBookmarksBtn = document.getElementById('addBookmarksBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.status = document.getElementById('status');

        // Folder selector elements
        this.dropdownBtn = document.getElementById('folderDropdownBtn');
        this.folderDropdown = document.getElementById('folderDropdown');
        this.folderList = document.querySelector('.folder-list');
        this.createNewBtn = document.getElementById('createNewFolder');
        this.debugBtn = document.getElementById('debugFolders');

        // Quick action buttons
        this.bookmarkCurrentPage = document.getElementById('bookmarkCurrentPage');
        this.bookmarkAllTabs = document.getElementById('bookmarkAllTabs');
        this.openWebApp = document.getElementById('openWebApp');
        this.manageBookmarks = document.getElementById('manageBookmarks');

        // Import/Export buttons
        this.importBookmarks = document.getElementById('importBookmarks');
        this.exportBookmarks = document.getElementById('exportBookmarks');
        this.backupBookmarks = document.getElementById('backupBookmarks');
        this.restoreBookmarks = document.getElementById('restoreBookmarks');
    }

    initializeEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addBookmarksToBrowser();
        });

        // Download button
        this.downloadBtn.addEventListener('click', () => {
            this.downloadBookmarksHTML();
        });

        // Quick actions
        this.bookmarkCurrentPage.addEventListener('click', () => {
            this.bookmarkCurrentPageAction();
        });

        this.bookmarkAllTabs.addEventListener('click', () => {
            this.bookmarkAllTabsAction();
        });

        this.openWebApp.addEventListener('click', () => {
            this.openWebAppAction();
        });

        this.manageBookmarks.addEventListener('click', () => {
            this.manageBookmarksAction();
        });

        // Import/Export actions
        this.importBookmarks.addEventListener('click', () => {
            this.importBookmarksAction();
        });

        this.exportBookmarks.addEventListener('click', () => {
            this.exportBookmarksAction();
        });

        this.backupBookmarks.addEventListener('click', () => {
            this.backupBookmarksAction();
        });

        this.restoreBookmarks.addEventListener('click', () => {
            this.restoreBookmarksAction();
        });
    }

    async initializeFolderSelector() {
        try {
            this.showLoading('Loading folders...');
            await this.loadFolders();
            this.setupFolderSelectorEvents();
        } catch (error) {
            console.error('Error initializing folder selector:', error);
            this.showError('Failed to load folders. Using default options.');
            this.loadDefaultFolders();
        } finally {
            // Always ensure we have some folders to show
            if (this.folders.length === 0) {
                this.loadDefaultFolders();
            }
            
            // Enable input-only mode as ultimate fallback
            this.enableInputOnlyMode();
        }
    }

    enableInputOnlyMode() {
        // Make the input field always editable and functional
        this.folderNameInput.removeAttribute('readonly');
        this.folderNameInput.placeholder = 'Type folder name and press Enter...';
        
        // Add Enter key support for quick folder creation
        this.folderNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const folderName = this.folderNameInput.value.trim();
                if (folderName) {
                    this.selectFolder(folderName);
                    this.closeDropdown();
                }
            }
        });
        
        // Show helpful message
        console.log('Input-only mode enabled - users can type folder names directly');
    }

    setupFolderSelectorEvents() {
        // Toggle dropdown
        this.dropdownBtn.addEventListener('click', () => {
            this.toggleDropdown();
        });

        // Search functionality
        this.folderNameInput.addEventListener('input', (e) => {
            this.filterFolders(e.target.value.toLowerCase());
        });

        // Make input editable when clicked
        this.folderNameInput.addEventListener('click', () => {
            this.folderNameInput.removeAttribute('readonly');
            this.folderNameInput.focus();
        });

        // Create new folder
        this.createNewBtn.addEventListener('click', () => {
            this.createNewFolder();
        });

        // Debug button
        this.debugBtn.addEventListener('click', () => {
            this.debugFolders();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.folder-selector')) {
                this.closeDropdown();
            }
        });
    }

    async loadFolders() {
        try {
            console.log('=== FOLDER LOADING START ===');
            
            // Check extension context
            if (!chrome.runtime?.id) {
                throw new Error('Extension context invalidated');
            }

            // Try direct API call first (most reliable)
            const folders = await this.getFoldersDirectAPI();
            if (folders && folders.length > 0) {
                this.folders = folders;
                this.renderFolders();
                console.log('Folders loaded via direct API:', folders.length);
                return;
            }

            // Fallback 1: Try background script with timeout
            try {
                const response = await Promise.race([
                    chrome.runtime.sendMessage({ action: 'getBookmarkFolders' }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                ]);
                
                if (response && response.success && response.folders) {
                    this.folders = response.folders;
                    this.renderFolders();
                    console.log('Folders loaded via background script:', response.folders.length);
                    return;
                }
            } catch (bgError) {
                console.warn('Background script failed:', bgError);
            }

            // Fallback 2: Try alternative bookmark API approach
            try {
                const altFolders = await this.getFoldersAlternativeAPI();
                if (altFolders && altFolders.length > 0) {
                    this.folders = altFolders;
                    this.renderFolders();
                    console.log('Folders loaded via alternative API:', altFolders.length);
                    return;
                }
            } catch (altError) {
                console.warn('Alternative API failed:', altError);
            }

            // Fallback 3: Use cached folders from storage
            try {
                const cachedFolders = await this.getCachedFolders();
                if (cachedFolders && cachedFolders.length > 0) {
                    this.folders = cachedFolders;
                    this.renderFolders();
                    console.log('Folders loaded from cache:', cachedFolders.length);
                    return;
                }
            } catch (cacheError) {
                console.warn('Cache failed:', cacheError);
            }

            // Final fallback: Always show default suggestions
            throw new Error('All methods failed, using defaults');

        } catch (error) {
            console.error('Error loading folders:', error);
            this.loadDefaultFolders();
        }
    }

    async getFoldersDirectAPI() {
        try {
            const bookmarkTree = await chrome.bookmarks.getTree();
            const folders = [];
            
            // Get all possible bookmark locations
            const root = bookmarkTree[0];
            const possibleBookmarkBars = root?.children?.filter(node => 
                node.id === "1" || 
                node.title === "Bookmarks bar" || 
                node.title === "Bookmarks Toolbar" ||
                node.title === "Bookmark Bar"
            );
            
            // Find folders in all possible locations
            for (const bar of possibleBookmarkBars || []) {
                if (bar.children) {
                    for (const node of bar.children) {
                        if (node.children && !node.url) {
                            const bookmarkCount = node.children.filter(child => child.url).length;
                            folders.push({
                                id: node.id,
                                title: node.title,
                                children: node.children.filter(child => child.url),
                                bookmarkCount: bookmarkCount,
                                location: bar.title
                            });
                        }
                    }
                }
            }
            
            // Always add default suggestions for better UX
            const defaultSuggestions = [
                { id: 'suggestion-1', title: 'My Bookmarks', children: [], bookmarkCount: 0, isSuggestion: true },
                { id: 'suggestion-2', title: 'Work', children: [], bookmarkCount: 0, isSuggestion: true },
                { id: 'suggestion-3', title: 'Personal', children: [], bookmarkCount: 0, isSuggestion: true },
                { id: 'suggestion-4', title: 'Learning', children: [], bookmarkCount: 0, isSuggestion: true }
            ];
            
            // Add suggestions if no folders found, or append them for better UX
            if (folders.length === 0) {
                folders.push(...defaultSuggestions);
            } else {
                folders.push(...defaultSuggestions);
            }
            
            return folders;
        } catch (error) {
            console.error('Direct API call failed:', error);
            return null;
        }
    }

    async getFoldersAlternativeAPI() {
        try {
            // Alternative approach: Get all bookmarks and group by parent
            const allBookmarks = await chrome.bookmarks.getTree();
            const folders = [];
            
            // Look for folders in different locations
            const root = allBookmarks[0];
            if (root && root.children) {
                for (const child of root.children) {
                    if (child.children && !child.url) {
                        // This is a folder
                        const bookmarkCount = child.children.filter(item => item.url).length;
                        if (bookmarkCount > 0 || child.title.toLowerCase().includes('bookmark')) {
                            folders.push({
                                id: child.id,
                                title: child.title,
                                children: child.children.filter(item => item.url),
                                bookmarkCount: bookmarkCount
                            });
                        }
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
            console.error('Alternative API failed:', error);
            return null;
        }
    }

    async getCachedFolders() {
        try {
            const result = await chrome.storage.local.get(['cachedFolders', 'cacheTimestamp']);
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

    async cacheFolders(folders) {
        try {
            await chrome.storage.local.set({
                cachedFolders: folders,
                cacheTimestamp: Date.now()
            });
        } catch (error) {
            console.error('Cache storage failed:', error);
        }
    }

    loadDefaultFolders() {
        this.folders = [
            { id: 'suggestion-1', title: 'My Bookmarks', children: [], bookmarkCount: 0, isSuggestion: true },
            { id: 'suggestion-2', title: 'Work', children: [], bookmarkCount: 0, isSuggestion: true },
            { id: 'suggestion-3', title: 'Personal', children: [], bookmarkCount: 0, isSuggestion: true },
            { id: 'suggestion-4', title: 'Learning', children: [], bookmarkCount: 0, isSuggestion: true },
            { id: 'suggestion-5', title: 'Favorites', children: [], bookmarkCount: 0, isSuggestion: true }
        ];
        this.renderFolders();
    }

    renderFolders() {
        this.folderList.innerHTML = '';
        
        if (this.folders.length === 0) {
            this.showNoFoldersMessage();
            return;
        }
        
        this.folders.forEach((folder, index) => {
            const folderItem = this.createFolderItem(folder, index);
            this.folderList.appendChild(folderItem);
        });

        // Cache successful folder loads for future use
        if (this.folders.length > 0 && !this.folders.every(f => f.isSuggestion)) {
            this.cacheFolders(this.folders);
        }
    }

    createFolderItem(folder, index) {
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item fade-in';
        folderItem.style.animationDelay = `${index * 0.1}s`;
        
        const isSuggestion = folder.isSuggestion;
        const icon = isSuggestion ? '💡' : '📁';
        const count = folder.bookmarkCount || (folder.children ? folder.children.length : 0);
        
        folderItem.innerHTML = `
            <span class="folder-icon">${icon}</span>
            <span class="folder-name">${folder.title}</span>
            <span class="folder-count">${count}</span>
        `;
        
        if (isSuggestion) {
            folderItem.style.opacity = '0.7';
            folderItem.style.fontStyle = 'italic';
        }
        
        folderItem.addEventListener('click', () => {
            this.selectFolder(folder.title);
            this.closeDropdown();
        });
        
        return folderItem;
    }

    showNoFoldersMessage() {
        const noFoldersMsg = document.createElement('div');
        noFoldersMsg.className = 'no-folders-message';
        noFoldersMsg.innerHTML = `
            <div class="icon">📁</div>
            <div class="title">No folders found</div>
            <div class="subtitle">Type a name above to create your first folder!</div>
            <div class="debug-hint">Check browser console for debugging info</div>
            <div style="margin-top: 15px; padding: 10px; background: rgba(79, 172, 254, 0.1); border-radius: 6px; border: 1px solid rgba(79, 172, 254, 0.3);">
                <div style="font-size: 12px; color: #4facfe; font-weight: 600; margin-bottom: 5px;">💡 Quick Start:</div>
                <div style="font-size: 11px; color: #888;">Just type a folder name in the input field above and press Enter!</div>
            </div>
        `;
        this.folderList.appendChild(noFoldersMsg);
    }

    toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
        this.folderDropdown.style.display = this.isDropdownOpen ? 'block' : 'none';
        this.dropdownBtn.textContent = this.isDropdownOpen ? '▲' : '▼';
    }

    closeDropdown() {
        this.isDropdownOpen = false;
        this.folderDropdown.style.display = 'none';
        this.dropdownBtn.textContent = '▼';
    }

    filterFolders(searchTerm) {
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
        const exactMatch = this.folders.some(f => f.title.toLowerCase() === searchTerm);
        this.createNewBtn.style.display = exactMatch ? 'none' : 'block';
    }

    selectFolder(folderName) {
        this.folderNameInput.value = folderName;
        this.folderNameInput.setAttribute('readonly', 'readonly');
        
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

    createNewFolder() {
        const newFolderName = this.folderNameInput.value.trim();
        if (newFolderName) {
            this.selectFolder(newFolderName);
            this.closeDropdown();
        } else {
            this.folderNameInput.removeAttribute('readonly');
            this.folderNameInput.focus();
        }
    }

    debugFolders() {
        console.log('=== MANUAL DEBUG TRIGGERED ===');
        
        // Test UI with sample folders
        this.folders = [
            { id: 'test-1', title: 'Test Folder 1', children: [], bookmarkCount: 5, isSuggestion: false },
            { id: 'test-2', title: 'Test Folder 2', children: [], bookmarkCount: 3, isSuggestion: false },
            { id: 'suggestion-1', title: 'My Bookmarks', children: [], bookmarkCount: 0, isSuggestion: true }
        ];
        this.renderFolders();
        
        // Then try to load real folders
        setTimeout(() => {
            this.loadFolders();
        }, 2000);
    }

    async addBookmarksToBrowser() {
        const folderName = this.folderNameInput.value.trim();
        const urls = this.urlsInput.value.trim();
        
        if (!urls) {
            this.showError('Please enter some URLs');
            return;
        }
        
        this.showLoading('Adding bookmarks to browser...');
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'processAndBookmark',
                data: {
                    urls: urls,
                    folderName: folderName || 'My Bookmarks'
                }
            });
            
            if (response && response.success) {
                this.showSuccess(`✅ Successfully added ${response.count} bookmarks to "${response.folderName}"!`);
                this.urlsInput.value = '';
                this.folderNameInput.value = 'My Bookmarks';
            } else {
                this.showError(`❌ Failed to add bookmarks: ${response?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error adding bookmarks:', error);
            this.showError(`❌ Error adding bookmarks: ${error.message}`);
        }
    }

    async downloadBookmarksHTML() {
        const folderName = this.folderNameInput.value.trim();
        const urls = this.urlsInput.value.trim();
        
        if (!urls) {
            this.showError('Please enter some URLs');
            return;
        }
        
        this.showLoading('Generating HTML file...');
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'processAndBookmark',
                data: {
                    urls: urls,
                    folderName: folderName || 'My Bookmarks'
                }
            });
            
            if (response && response.success) {
                // Generate HTML content
                const htmlContent = this.generateHTMLContent(urls, folderName || 'My Bookmarks');
                
                // Create and download file
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${folderName || 'My Bookmarks'}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showSuccess(`✅ Downloaded HTML file with ${response.count} bookmarks!`);
            } else {
                this.showError(`❌ Failed to generate HTML: ${response?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error downloading HTML:', error);
            this.showError(`❌ Error downloading HTML: ${error.message}`);
        }
    }

    generateHTMLContent(urls, folderName) {
        const lines = urls.split('\n');
        const processedUrls = this.processUrls(urls);
        
        let bookmarkItems = '';
        processedUrls.forEach(urlData => {
            bookmarkItems += `        <DT><A HREF="${urlData.url}">${urlData.title}</A>\n`;
        });
        
        return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}" LAST_MODIFIED="${Math.floor(Date.now() / 1000)}" PERSONAL_TOOLBAR_FOLDER="true">${folderName}</H3>
    <DL><p>
${bookmarkItems}    </DL><p>
</DL><p>`;
    }

    processUrls(urlsText) {
        const lines = urlsText.split('\n');
        const processedUrls = [];
        
        for (const line of lines) {
            let cleanLine = line.trim();
            if (!cleanLine) continue;
            
            // Remove common prefixes and formatting
            cleanLine = cleanLine.replace(/^[→\-\*\•\d+\.\)]\s*/, '');
            cleanLine = cleanLine.replace(/^[A-Za-z\s]+\(/, '');
            cleanLine = cleanLine.replace(/\)$/, '');
            
            // Add https:// if needed
            if (cleanLine && !cleanLine.startsWith('http://') && !cleanLine.startsWith('https://')) {
                if (/^[a-zA-Z0-9][a-zA-Z0-9\-\.]*\.[a-zA-Z]{2,}/.test(cleanLine)) {
                    cleanLine = 'https://' + cleanLine;
                }
            }
            
            if (cleanLine && (cleanLine.startsWith('http://') || cleanLine.startsWith('https://'))) {
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

    async bookmarkCurrentPageAction() {
        this.showLoading('Bookmarking current page...');
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'bookmarkCurrentPage'
            });
            
            if (response && response.success) {
                this.showSuccess('✅ Current page bookmarked successfully!');
            } else {
                this.showError(`❌ Failed to bookmark page: ${response?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error bookmarking current page:', error);
            this.showError(`❌ Error bookmarking page: ${error.message}`);
        }
    }

    async bookmarkAllTabsAction() {
        this.showLoading('Bookmarking all open tabs...');
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'bookmarkAllTabs'
            });
            
            if (response && response.success) {
                this.showSuccess(`✅ Successfully bookmarked ${response.count} tabs in "${response.folderName}"!`);
            } else {
                this.showError(`❌ Failed to bookmark tabs: ${response?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error bookmarking all tabs:', error);
            this.showError(`❌ Error bookmarking tabs: ${error.message}`);
        }
    }

    openWebAppAction() {
        chrome.tabs.create({ url: 'https://bookmark-converter-8okt.onrender.com' });
        window.close();
    }

    manageBookmarksAction() {
        chrome.tabs.create({ url: 'chrome://bookmarks/' });
        window.close();
    }

    // Import/Export Functions
    async importBookmarksAction() {
        try {
            this.showLoading('Opening file selector...');
            
            // Create file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.html,.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await this.processImportFile(file);
                }
            };
            input.click();
            
            this.hideStatus();
        } catch (error) {
            this.showError('Failed to open file selector: ' + error.message);
        }
    }

    async exportBookmarksAction() {
        try {
            this.showLoading('Exporting bookmarks...');
            
            const bookmarks = await chrome.bookmarks.getTree();
            const htmlContent = this.generateHTMLBookmarks(bookmarks);
            
            // Download file
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookmarks_export_${new Date().toISOString().split('T')[0]}.html`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showSuccess('Bookmarks exported successfully!');
        } catch (error) {
            this.showError('Failed to export bookmarks: ' + error.message);
        }
    }

    async backupBookmarksAction() {
        try {
            this.showLoading('Creating backup...');
            
            const bookmarks = await chrome.bookmarks.getTree();
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
            
            this.showSuccess('Backup created successfully!');
        } catch (error) {
            this.showError('Failed to create backup: ' + error.message);
        }
    }

    async restoreBookmarksAction() {
        try {
            this.showLoading('Opening restore file selector...');
            
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await this.processRestoreFile(file);
                }
            };
            input.click();
            
            this.hideStatus();
        } catch (error) {
            this.showError('Failed to open restore file selector: ' + error.message);
        }
    }

    async processImportFile(file) {
        try {
            this.showLoading('Processing import file...');
            
            const content = await this.readFileAsText(file);
            const format = file.name.split('.').pop().toLowerCase();
            
            if (format === 'html') {
                await this.importHTMLBookmarks(content);
            } else if (format === 'json') {
                await this.importJSONBookmarks(content);
            } else {
                throw new Error('Unsupported file format');
            }
            
            this.showSuccess('Bookmarks imported successfully!');
        } catch (error) {
            this.showError('Failed to import bookmarks: ' + error.message);
        }
    }

    async processRestoreFile(file) {
        try {
            this.showLoading('Processing restore file...');
            
            const content = await this.readFileAsText(file);
            const backupData = JSON.parse(content);
            
            if (!backupData.bookmarks) {
                throw new Error('Invalid backup file format');
            }
            
            // Restore bookmarks
            await this.restoreBookmarksFromBackup(backupData.bookmarks);
            
            this.showSuccess('Bookmarks restored successfully!');
        } catch (error) {
            this.showError('Failed to restore bookmarks: ' + error.message);
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    async importHTMLBookmarks(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const links = doc.querySelectorAll('a[href]');
        
        for (const link of links) {
            if (link.href && link.href !== 'about:blank') {
                await chrome.bookmarks.create({
                    title: link.textContent || link.href,
                    url: link.href
                });
            }
        }
    }

    async importJSONBookmarks(jsonContent) {
        const data = JSON.parse(jsonContent);
        
        if (data.roots) {
            await this.importBookmarkTree(data.roots);
        } else if (Array.isArray(data)) {
            for (const item of data) {
                if (item.url) {
                    await chrome.bookmarks.create({
                        title: item.title || item.name || item.url,
                        url: item.url
                    });
                }
            }
        }
    }

    async importBookmarkTree(roots) {
        for (const [key, root] of Object.entries(roots)) {
            if (root.children) {
                for (const child of root.children) {
                    if (child.url) {
                        await chrome.bookmarks.create({
                            title: child.title || child.name || child.url,
                            url: child.url
                        });
                    } else if (child.children) {
                        await this.importBookmarkTree({child});
                    }
                }
            }
        }
    }

    async restoreBookmarksFromBackup(bookmarks) {
        for (const bookmark of bookmarks) {
            if (bookmark.url) {
                await chrome.bookmarks.create({
                    title: bookmark.title || bookmark.name || bookmark.url,
                    url: bookmark.url
                });
            }
        }
    }

    generateHTMLBookmarks(bookmarks) {
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

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['lastFolderName']);
            if (result.lastFolderName) {
                this.folderNameInput.value = result.lastFolderName;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.local.set({
                lastFolderName: this.folderNameInput.value
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    showLoading(message) {
        this.isLoading = true;
        this.status.className = 'status loading';
        this.status.innerHTML = `<div class="loading-spinner"></div>${message}`;
        this.status.style.display = 'block';
        this.addBookmarksBtn.disabled = true;
        this.downloadBtn.disabled = true;
    }

    showSuccess(message) {
        this.isLoading = false;
        this.status.className = 'status success';
        this.status.textContent = message;
        this.status.style.display = 'block';
        this.addBookmarksBtn.disabled = false;
        this.downloadBtn.disabled = false;
        
        setTimeout(() => {
            this.status.style.display = 'none';
        }, 3000);
    }

    showError(message) {
        this.isLoading = false;
        this.status.className = 'status error';
        this.status.textContent = message;
        this.status.style.display = 'block';
        this.addBookmarksBtn.disabled = false;
        this.downloadBtn.disabled = false;
        
        setTimeout(() => {
            this.status.style.display = 'none';
        }, 5000);
    }
}

// Initialize the extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BookmarkConverterPro();
});