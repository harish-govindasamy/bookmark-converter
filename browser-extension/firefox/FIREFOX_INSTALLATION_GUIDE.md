# 🦊 Firefox Extension Installation Guide

## 🔖 Bookmark Converter Pro - Firefox Extension

This guide covers **both installation methods** for Firefox extensions.

---

## 📦 Available Packages

### **1. Development Package (ZIP)**
- **File**: `bookmark-converter-pro-firefox-dev.zip`
- **Use**: Development, testing, temporary installation
- **Method**: Load Temporary Add-on
- **Duration**: Until browser restart

### **2. Distribution Package (XPI)**
- **File**: `bookmark-converter-pro.xpi`
- **Use**: Permanent installation, distribution
- **Method**: Direct XPI installation
- **Duration**: Permanent

---

## 🚀 Installation Methods

### **Method 1: Temporary Installation (Development/Testing)**

**Best for**: Testing, development, temporary use

**Steps:**
1. **Download**: `bookmark-converter-pro-firefox-dev.zip`
2. **Extract** the ZIP file to a folder
3. **Open Firefox** and go to `about:debugging`
4. **Click** "This Firefox" (left sidebar)
5. **Click** "Load Temporary Add-on"
6. **Select** the `manifest.json` file from extracted folder
7. **Pin** the extension to toolbar

**Advantages:**
- ✅ No signing required
- ✅ Easy to update during development
- ✅ Perfect for testing

**Disadvantages:**
- ❌ Removed on browser restart
- ❌ Need to reload after each restart

---

### **Method 2: Permanent Installation (XPI)**

**Best for**: Permanent use, distribution

**Steps:**
1. **Download**: `bookmark-converter-pro.xpi`
2. **Open Firefox** and go to `about:addons`
3. **Click** the gear icon (⚙️) in top-right
4. **Select** "Install Add-on From File..."
5. **Choose** the `bookmark-converter-pro.xpi` file
6. **Click** "Add" to confirm installation
7. **Pin** the extension to toolbar

**Advantages:**
- ✅ Permanent installation
- ✅ Survives browser restarts
- ✅ Professional distribution method

**Disadvantages:**
- ❌ May require signing for some versions
- ❌ Harder to update

---

## 🔧 Troubleshooting

### **"Load Temporary Add-on" Not Working:**
1. **Check** if you selected the `manifest.json` file (not the folder)
2. **Verify** the manifest.json is valid
3. **Try** extracting the ZIP file first
4. **Check** Firefox console for errors

### **XPI Installation Fails:**
1. **Check** if Firefox allows unsigned extensions:
   - Go to `about:config`
   - Search for `xpinstall.signatures.required`
   - Set to `false` (if needed)
2. **Try** the temporary installation method instead
3. **Check** if the XPI file is not corrupted

### **Extension Not Appearing:**
1. **Check** if extension is enabled in `about:addons`
2. **Try** pinning the extension to toolbar
3. **Restart** Firefox and try again
4. **Check** if extension has required permissions

---

## 🎯 Recommended Approach

### **For End Users:**
**Use Method 1 (Temporary Installation)** because:
- ✅ Easier to install
- ✅ No signing issues
- ✅ Works reliably
- ✅ Easy to update

### **For Developers:**
**Use Method 2 (XPI)** because:
- ✅ Professional distribution
- ✅ Permanent installation
- ✅ Better for end users
- ✅ Standard Firefox extension format

---

## 📋 Installation Checklist

### **Before Installation:**
- [ ] Firefox is updated to latest version
- [ ] Extension files are downloaded
- [ ] You have admin rights (if needed)

### **During Installation:**
- [ ] Follow the correct method for your needs
- [ ] Select the right file (manifest.json or .xpi)
- [ ] Grant required permissions
- [ ] Pin extension to toolbar

### **After Installation:**
- [ ] Test extension functionality
- [ ] Check if bookmarks are created correctly
- [ ] Verify folder selection works
- [ ] Test floating button on web pages

---

## 🆘 Support

If you encounter issues:

1. **Check** this troubleshooting guide
2. **Try** the alternative installation method
3. **Visit** the web app: [https://bookmark-converter-8okt.onrender.com](https://bookmark-converter-8okt.onrender.com)
4. **Check** GitHub: [https://github.com/harish-govindasamy/bookmark-converter](https://github.com/harish-govindasamy/bookmark-converter)

---

## 🎉 Success!

Once installed, you'll have:
- ✅ **Smart URL processing**
- ✅ **Folder selection and creation**
- ✅ **Bookmarks at TOP for easy access**
- ✅ **Floating bookmark button**
- ✅ **Context menu integration**
- ✅ **Keyboard shortcuts**

**Happy bookmarking with Firefox! 🦊🚀**
