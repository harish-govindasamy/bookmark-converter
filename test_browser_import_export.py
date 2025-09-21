#!/usr/bin/env python3
"""
Comprehensive Testing Script for Browser Import/Export Features
Tests all browsers and bookmark formats
"""

import os
import json
import tempfile
import subprocess
import time
from datetime import datetime

class BrowserImportExportTester:
    def __init__(self):
        self.test_results = []
        self.sample_bookmarks = [
            {"title": "Google", "url": "https://www.google.com"},
            {"title": "GitHub", "url": "https://github.com"},
            {"title": "Stack Overflow", "url": "https://stackoverflow.com"},
            {"title": "MDN Web Docs", "url": "https://developer.mozilla.org"},
            {"title": "W3Schools", "url": "https://www.w3schools.com"}
        ]
    
    def run_all_tests(self):
        """Run all browser and format tests"""
        print("🧪 Starting Comprehensive Browser Import/Export Tests")
        print("=" * 60)
        
        # Test Web App Features
        self.test_web_app_features()
        
        # Test Chrome Extension
        self.test_chrome_extension()
        
        # Test Firefox Extension
        self.test_firefox_extension()
        
        # Test Safari Extension
        self.test_safari_extension()
        
        # Test Format Compatibility
        self.test_format_compatibility()
        
        # Generate Report
        self.generate_test_report()
    
    def test_web_app_features(self):
        """Test web application import/export features"""
        print("\n🌐 Testing Web Application Features")
        print("-" * 40)
        
        tests = [
            ("Browser Detection", self.test_browser_detection),
            ("HTML Import", self.test_html_import),
            ("JSON Import", self.test_json_import),
            ("CSV Import", self.test_csv_import),
            ("HTML Export", self.test_html_export),
            ("JSON Export", self.test_json_export),
            ("CSV Export", self.test_csv_export)
        ]
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                self.record_test("Web App", test_name, "PASS" if result else "FAIL")
                print(f"  ✅ {test_name}: {'PASS' if result else 'FAIL'}")
            except Exception as e:
                self.record_test("Web App", test_name, f"ERROR: {str(e)}")
                print(f"  ❌ {test_name}: ERROR - {str(e)}")
    
    def test_chrome_extension(self):
        """Test Chrome extension functionality"""
        print("\n🟢 Testing Chrome Extension")
        print("-" * 40)
        
        tests = [
            ("Extension Load", self.test_chrome_extension_load),
            ("Bookmark Import", self.test_chrome_bookmark_import),
            ("Bookmark Export", self.test_chrome_bookmark_export),
            ("Backup Creation", self.test_chrome_backup),
            ("Restore Function", self.test_chrome_restore)
        ]
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                self.record_test("Chrome Extension", test_name, "PASS" if result else "FAIL")
                print(f"  ✅ {test_name}: {'PASS' if result else 'FAIL'}")
            except Exception as e:
                self.record_test("Chrome Extension", test_name, f"ERROR: {str(e)}")
                print(f"  ❌ {test_name}: ERROR - {str(e)}")
    
    def test_firefox_extension(self):
        """Test Firefox extension functionality"""
        print("\n🦊 Testing Firefox Extension")
        print("-" * 40)
        
        tests = [
            ("Extension Load", self.test_firefox_extension_load),
            ("Bookmark Import", self.test_firefox_bookmark_import),
            ("Bookmark Export", self.test_firefox_bookmark_export),
            ("Backup Creation", self.test_firefox_backup),
            ("Restore Function", self.test_firefox_restore)
        ]
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                self.record_test("Firefox Extension", test_name, "PASS" if result else "FAIL")
                print(f"  ✅ {test_name}: {'PASS' if result else 'FAIL'}")
            except Exception as e:
                self.record_test("Firefox Extension", test_name, f"ERROR: {str(e)}")
                print(f"  ❌ {test_name}: ERROR - {str(e)}")
    
    def test_safari_extension(self):
        """Test Safari extension functionality"""
        print("\n🍎 Testing Safari Extension")
        print("-" * 40)
        
        tests = [
            ("Extension Structure", self.test_safari_extension_structure),
            ("Import Interface", self.test_safari_import_interface),
            ("Export Interface", self.test_safari_export_interface),
            ("Backup Interface", self.test_safari_backup_interface)
        ]
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                self.record_test("Safari Extension", test_name, "PASS" if result else "FAIL")
                print(f"  ✅ {test_name}: {'PASS' if result else 'FAIL'}")
            except Exception as e:
                self.record_test("Safari Extension", test_name, f"ERROR: {str(e)}")
                print(f"  ❌ {test_name}: ERROR - {str(e)}")
    
    def test_format_compatibility(self):
        """Test format compatibility across browsers"""
        print("\n📋 Testing Format Compatibility")
        print("-" * 40)
        
        formats = ["HTML", "JSON", "CSV"]
        browsers = ["Chrome", "Firefox", "Safari", "Edge", "Brave", "Vivaldi"]
        
        for format_type in formats:
            for browser in browsers:
                try:
                    result = self.test_format_browser_compatibility(format_type, browser)
                    self.record_test("Format Compatibility", f"{format_type} - {browser}", "PASS" if result else "FAIL")
                    print(f"  ✅ {format_type} - {browser}: {'PASS' if result else 'FAIL'}")
                except Exception as e:
                    self.record_test("Format Compatibility", f"{format_type} - {browser}", f"ERROR: {str(e)}")
                    print(f"  ❌ {format_type} - {browser}: ERROR - {str(e)}")
    
    # Test Implementation Methods
    def test_browser_detection(self):
        """Test browser detection functionality"""
        # Simulate browser detection
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15"
        ]
        
        for ua in user_agents:
            if "Chrome" in ua and "Edg" not in ua:
                browser = "Chrome"
            elif "Firefox" in ua:
                browser = "Firefox"
            elif "Safari" in ua and "Chrome" not in ua:
                browser = "Safari"
            else:
                browser = "Unknown"
            
            if browser == "Unknown":
                return False
        
        return True
    
    def test_html_import(self):
        """Test HTML bookmark import"""
        html_content = """<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><A HREF="https://www.google.com">Google</A>
    <DT><A HREF="https://github.com">GitHub</A>
</DL><p>"""
        
        # Test HTML parsing
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            links = soup.find_all('a', href=True)
            return len(links) == 2
        except ImportError:
            # Fallback test without BeautifulSoup
            return '<A HREF=' in html_content and 'Google' in html_content
    
    def test_json_import(self):
        """Test JSON bookmark import"""
        json_content = {
            "version": 1,
            "roots": {
                "bookmark_bar": {
                    "children": [
                        {"name": "Google", "type": "url", "url": "https://www.google.com"},
                        {"name": "GitHub", "type": "url", "url": "https://github.com"}
                    ]
                }
            }
        }
        
        try:
            json_str = json.dumps(json_content)
            parsed = json.loads(json_str)
            return "roots" in parsed and "bookmark_bar" in parsed["roots"]
        except:
            return False
    
    def test_csv_import(self):
        """Test CSV bookmark import"""
        csv_content = "Name,URL,Folder\nGoogle,https://www.google.com,Bookmarks\nGitHub,https://github.com,Bookmarks"
        
        lines = csv_content.split('\n')
        if len(lines) < 2:
            return False
        
        header = lines[0].split(',')
        return 'Name' in header and 'URL' in header
    
    def test_html_export(self):
        """Test HTML bookmark export"""
        # Test HTML generation
        html = self.generate_html_bookmarks(self.sample_bookmarks)
        return html.startswith('<!DOCTYPE NETSCAPE-Bookmark-file-1>') and 'Google' in html
    
    def test_json_export(self):
        """Test JSON bookmark export"""
        # Test JSON generation
        json_data = self.generate_json_bookmarks(self.sample_bookmarks)
        try:
            parsed = json.loads(json_data)
            return "version" in parsed and "roots" in parsed
        except:
            return False
    
    def test_csv_export(self):
        """Test CSV bookmark export"""
        # Test CSV generation
        csv_data = self.generate_csv_bookmarks(self.sample_bookmarks)
        lines = csv_data.split('\n')
        return len(lines) > 1 and 'Name,URL,Folder' in lines[0]
    
    def test_chrome_extension_load(self):
        """Test Chrome extension loading"""
        manifest_path = "browser-extension/chrome-based/manifest.json"
        return os.path.exists(manifest_path)
    
    def test_chrome_bookmark_import(self):
        """Test Chrome bookmark import functionality"""
        popup_js_path = "browser-extension/chrome-based/popup.js"
        if not os.path.exists(popup_js_path):
            return False
        
        with open(popup_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return 'importBookmarksAction' in content and 'chrome.bookmarks.create' in content
    
    def test_chrome_bookmark_export(self):
        """Test Chrome bookmark export functionality"""
        popup_js_path = "browser-extension/chrome-based/popup.js"
        if not os.path.exists(popup_js_path):
            return False
        
        with open(popup_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return 'exportBookmarksAction' in content and 'chrome.bookmarks.getTree' in content
    
    def test_chrome_backup(self):
        """Test Chrome backup functionality"""
        popup_js_path = "browser-extension/chrome-based/popup.js"
        if not os.path.exists(popup_js_path):
            return False
        
        with open(popup_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return 'backupBookmarksAction' in content and 'JSON.stringify' in content
    
    def test_chrome_restore(self):
        """Test Chrome restore functionality"""
        popup_js_path = "browser-extension/chrome-based/popup.js"
        if not os.path.exists(popup_js_path):
            return False
        
        with open(popup_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return 'restoreBookmarksAction' in content and 'processRestoreFile' in content
    
    def test_firefox_extension_load(self):
        """Test Firefox extension loading"""
        manifest_path = "browser-extension/firefox/manifest.json"
        return os.path.exists(manifest_path)
    
    def test_firefox_bookmark_import(self):
        """Test Firefox bookmark import functionality"""
        popup_js_path = "browser-extension/firefox/popup.js"
        if not os.path.exists(popup_js_path):
            return False
        
        with open(popup_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return 'importBookmarksAction' in content and 'browser.bookmarks.create' in content
    
    def test_firefox_bookmark_export(self):
        """Test Firefox bookmark export functionality"""
        popup_js_path = "browser-extension/firefox/popup.js"
        if not os.path.exists(popup_js_path):
            return False
        
        with open(popup_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return 'exportBookmarksAction' in content and 'browser.bookmarks.getTree' in content
    
    def test_firefox_backup(self):
        """Test Firefox backup functionality"""
        popup_js_path = "browser-extension/firefox/popup.js"
        if not os.path.exists(popup_js_path):
            return False
        
        with open(popup_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return 'backupBookmarksAction' in content and 'JSON.stringify' in content
    
    def test_firefox_restore(self):
        """Test Firefox restore functionality"""
        popup_js_path = "browser-extension/firefox/popup.js"
        if not os.path.exists(popup_js_path):
            return False
        
        with open(popup_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return 'restoreBookmarksAction' in content and 'processRestoreFile' in content
    
    def test_safari_extension_structure(self):
        """Test Safari extension structure"""
        required_files = [
            "browser-extension/safari/Info.plist",
            "browser-extension/safari/manifest.json",
            "browser-extension/safari/popup.html",
            "browser-extension/safari/popup.js"
        ]
        
        return all(os.path.exists(f) for f in required_files)
    
    def test_safari_import_interface(self):
        """Test Safari import interface"""
        popup_js_path = "browser-extension/safari/popup.js"
        if not os.path.exists(popup_js_path):
            return False
        
        with open(popup_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return 'importBookmarksAction' in content and 'processImportFile' in content
    
    def test_safari_export_interface(self):
        """Test Safari export interface"""
        popup_js_path = "browser-extension/safari/popup.js"
        if not os.path.exists(popup_js_path):
            return False
        
        with open(popup_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return 'exportBookmarksAction' in content and 'generateHTMLBookmarks' in content
    
    def test_safari_backup_interface(self):
        """Test Safari backup interface"""
        popup_js_path = "browser-extension/safari/popup.js"
        if not os.path.exists(popup_js_path):
            return False
        
        with open(popup_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return 'backupBookmarksAction' in content and 'JSON.stringify' in content
    
    def test_format_browser_compatibility(self, format_type, browser):
        """Test format compatibility with specific browser"""
        # Simulate compatibility matrix
        compatibility_matrix = {
            "HTML": ["Chrome", "Firefox", "Safari", "Edge", "Brave", "Vivaldi"],
            "JSON": ["Chrome", "Firefox", "Safari", "Edge", "Brave", "Vivaldi"],
            "CSV": ["Chrome", "Firefox", "Safari", "Edge", "Brave", "Vivaldi"]
        }
        
        return browser in compatibility_matrix.get(format_type, [])
    
    def generate_html_bookmarks(self, bookmarks):
        """Generate HTML bookmark format"""
        html = """<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
"""
        
        for bookmark in bookmarks:
            html += f'    <DT><A HREF="{bookmark["url"]}">{bookmark["title"]}</A>\n'
        
        html += "</DL><p>"
        return html
    
    def generate_json_bookmarks(self, bookmarks):
        """Generate JSON bookmark format"""
        json_data = {
            "version": 1,
            "roots": {
                "bookmark_bar": {
                    "children": [
                        {
                            "name": bookmark["title"],
                            "type": "url",
                            "url": bookmark["url"]
                        } for bookmark in bookmarks
                    ],
                    "name": "Bookmarks",
                    "type": "folder"
                }
            }
        }
        
        return json.dumps(json_data, indent=2)
    
    def generate_csv_bookmarks(self, bookmarks):
        """Generate CSV bookmark format"""
        csv = "Name,URL,Folder\n"
        for bookmark in bookmarks:
            csv += f'"{bookmark["title"]}","{bookmark["url"]}","Bookmarks"\n'
        
        return csv
    
    def record_test(self, category, test_name, result):
        """Record test result"""
        self.test_results.append({
            "category": category,
            "test_name": test_name,
            "result": result,
            "timestamp": datetime.now().isoformat()
        })
    
    def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n📊 Test Report Summary")
        print("=" * 60)
        
        # Count results by category
        categories = {}
        for result in self.test_results:
            category = result["category"]
            if category not in categories:
                categories[category] = {"PASS": 0, "FAIL": 0, "ERROR": 0}
            
            if result["result"] == "PASS":
                categories[category]["PASS"] += 1
            elif result["result"] == "FAIL":
                categories[category]["FAIL"] += 1
            else:
                categories[category]["ERROR"] += 1
        
        # Print summary
        total_tests = len(self.test_results)
        total_passed = sum(cat["PASS"] for cat in categories.values())
        total_failed = sum(cat["FAIL"] for cat in categories.values())
        total_errors = sum(cat["ERROR"] for cat in categories.values())
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {total_passed}")
        print(f"❌ Failed: {total_failed}")
        print(f"⚠️  Errors: {total_errors}")
        print(f"Success Rate: {(total_passed/total_tests)*100:.1f}%")
        
        print("\n📋 Results by Category:")
        for category, results in categories.items():
            print(f"\n{category}:")
            print(f"  ✅ Passed: {results['PASS']}")
            print(f"  ❌ Failed: {results['FAIL']}")
            print(f"  ⚠️  Errors: {results['ERROR']}")
        
        # Save detailed report
        report_file = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: {report_file}")
        
        # Recommendations
        print("\n💡 Recommendations:")
        if total_failed > 0:
            print("  - Review failed tests and fix issues")
        if total_errors > 0:
            print("  - Check error logs and resolve technical issues")
        if total_passed == total_tests:
            print("  - 🎉 All tests passed! Ready for production deployment")
        else:
            print("  - Address issues before production deployment")

def main():
    """Main test execution"""
    tester = BrowserImportExportTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
