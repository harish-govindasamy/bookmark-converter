#!/usr/bin/env python3
"""
Bookmark Converter Web App
A simple Flask web application for converting URLs to HTML bookmarks
"""

from flask import Flask, render_template, request, send_file, jsonify
import os
import tempfile
from datetime import datetime
import json

app = Flask(__name__)

def clean_and_process_urls(text):
    """
    Smart URL processing: clean up messy text and convert to proper URLs
    """
    import re
    
    # Split by lines and process each line
    lines = text.split('\n')
    processed_urls = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Remove common prefixes and formatting
        line = re.sub(r'^[→\-\*\•\d+\.\)]\s*', '', line)  # Remove arrows, bullets, numbers
        line = re.sub(r'^[A-Za-z\s]+\(', '', line)  # Remove text before parentheses
        line = re.sub(r'\)$', '', line)  # Remove trailing parentheses
        
        # Extract domain from various formats
        # Pattern 1: Already has http/https
        if re.match(r'https?://', line):
            processed_urls.append(line)
            continue
            
        # Pattern 2: Domain with path (e.g., "example.com/path")
        if re.match(r'^[a-zA-Z0-9][a-zA-Z0-9\-\.]*\.[a-zA-Z]{2,}', line):
            if not line.startswith('http'):
                line = 'https://' + line
            processed_urls.append(line)
            continue
            
        # Pattern 3: Just domain name (e.g., "example.com")
        if re.match(r'^[a-zA-Z0-9][a-zA-Z0-9\-\.]*\.[a-zA-Z]{2,}$', line):
            line = 'https://' + line
            processed_urls.append(line)
            continue
    
    return processed_urls

def txt_to_bookmarks_html(urls_text, folder_name="Imported Bookmarks"):
    """
    Convert URLs text to HTML bookmarks format with smart processing
    """
    html_template = """<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3>{folder_name}</H3>
    <DL><p>
{bookmark_items}
    </DL><p>
</DL><p>"""
    
    bookmark_items = []
    
    # Use smart URL processing
    processed_urls = clean_and_process_urls(urls_text)
    
    for url in processed_urls:
        if url and (url.startswith('http://') or url.startswith('https://')):
            # Extract domain name for bookmark title
            try:
                from urllib.parse import urlparse
                parsed = urlparse(url)
                title = parsed.netloc.replace('www.', '') or url
            except:
                title = url
            
            bookmark_item = f'        <DT><A HREF="{url}">{title}</A>'
            bookmark_items.append(bookmark_item)
    
    # Generate final HTML
    final_html = html_template.format(
        folder_name=folder_name,
        bookmark_items='\n'.join(bookmark_items)
    )
    
    return final_html, len(bookmark_items)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert():
    try:
        data = request.get_json()
        urls_text = data.get('urls', '')
        folder_name = data.get('folder_name', 'Imported Bookmarks')
        
        if not urls_text.strip():
            return jsonify({'error': 'Please provide some URLs'}), 400
        
        html_content, url_count = txt_to_bookmarks_html(urls_text, folder_name)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
            f.write(html_content)
            temp_file = f.name
        
        # Log usage for analytics
        log_usage(url_count, folder_name)
        
        return jsonify({
            'success': True,
            'url_count': url_count,
            'download_url': f'/download/{os.path.basename(temp_file)}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>')
def download_file(filename):
    try:
        file_path = os.path.join(tempfile.gettempdir(), filename)
        return send_file(file_path, as_attachment=True, download_name='bookmarks.html')
    except Exception as e:
        return jsonify({'error': 'File not found'}), 404

@app.route('/add-to-browser', methods=['POST'])
def add_to_browser():
    """Add bookmarks directly to browser using JavaScript"""
    try:
        data = request.get_json()
        urls_text = data.get('urls', '')
        folder_name = data.get('folder_name', 'Imported Bookmarks')
        
        if not urls_text.strip():
            return jsonify({'error': 'Please provide some URLs'}), 400
        
        # Process URLs
        processed_urls = clean_and_process_urls(urls_text)
        
        # Create bookmark data for JavaScript
        bookmarks_data = []
        for url in processed_urls:
            if url and (url.startswith('http://') or url.startswith('https://')):
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(url)
                    title = parsed.netloc.replace('www.', '') or url
                except:
                    title = url
                
                bookmarks_data.append({
                    'title': title,
                    'url': url
                })
        
        # Log usage for analytics
        log_usage(len(bookmarks_data), folder_name)
        
        return jsonify({
            'success': True,
            'bookmarks': bookmarks_data,
            'folder_name': folder_name,
            'count': len(bookmarks_data)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analytics')
def analytics():
    """Simple analytics endpoint"""
    try:
        with open('usage_log.json', 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except:
        return jsonify({'total_conversions': 0, 'total_urls': 0, 'recent_activity': []})

def log_usage(url_count, folder_name):
    """Log usage for analytics"""
    try:
        # Try to read existing data
        try:
            with open('usage_log.json', 'r') as f:
                data = json.load(f)
        except:
            data = {'total_conversions': 0, 'total_urls': 0, 'recent_activity': []}
        
        # Update data
        data['total_conversions'] += 1
        data['total_urls'] += url_count
        data['recent_activity'].append({
            'timestamp': datetime.now().isoformat(),
            'url_count': url_count,
            'folder_name': folder_name
        })
        
        # Keep only last 50 activities
        data['recent_activity'] = data['recent_activity'][-50:]
        
        # Write back
        with open('usage_log.json', 'w') as f:
            json.dump(data, f, indent=2)
            
    except Exception as e:
        print(f"Analytics logging error: {e}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)

