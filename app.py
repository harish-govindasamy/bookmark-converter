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
import sqlite3
import threading

app = Flask(__name__)

# Database setup
DATABASE = 'bookmark_stats.db'
lock = threading.Lock()

def init_database():
    """Initialize the SQLite database for statistics tracking"""
    with lock:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Create statistics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usage_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                url_count INTEGER NOT NULL,
                folder_name TEXT,
                conversion_type TEXT DEFAULT 'download'
            )
        ''')
        
        # Create daily summary table for better performance
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS daily_stats (
                date TEXT PRIMARY KEY,
                total_conversions INTEGER DEFAULT 0,
                total_urls INTEGER DEFAULT 0,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()

def log_conversion(url_count, folder_name, conversion_type='download'):
    """Log a conversion to the database"""
    with lock:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Insert the conversion record
        cursor.execute('''
            INSERT INTO usage_stats (url_count, folder_name, conversion_type)
            VALUES (?, ?, ?)
        ''', (url_count, folder_name, conversion_type))
        
        # Update daily stats
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute('''
            INSERT OR REPLACE INTO daily_stats (date, total_conversions, total_urls, last_updated)
            VALUES (
                ?,
                COALESCE((SELECT total_conversions FROM daily_stats WHERE date = ?), 0) + 1,
                COALESCE((SELECT total_urls FROM daily_stats WHERE date = ?), 0) + ?,
                CURRENT_TIMESTAMP
            )
        ''', (today, today, today, url_count))
        
        conn.commit()
        conn.close()

def get_live_stats():
    """Get live statistics from the database"""
    with lock:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Get total stats
        cursor.execute('''
            SELECT 
                COUNT(*) as total_conversions,
                SUM(url_count) as total_urls
            FROM usage_stats
        ''')
        total_stats = cursor.fetchone()
        
        # Get today's stats
        today = datetime.now().strftime('%Y-%m-%d')
        cursor.execute('''
            SELECT total_conversions, total_urls
            FROM daily_stats
            WHERE date = ?
        ''', (today,))
        today_stats = cursor.fetchone()
        
        # Get recent activity (last 10 conversions)
        cursor.execute('''
            SELECT timestamp, url_count, folder_name, conversion_type
            FROM usage_stats
            ORDER BY timestamp DESC
            LIMIT 10
        ''')
        recent_activity = cursor.fetchall()
        
        # Get daily stats for the last 7 days
        cursor.execute('''
            SELECT date, total_conversions, total_urls
            FROM daily_stats
            ORDER BY date DESC
            LIMIT 7
        ''')
        weekly_stats = cursor.fetchall()
        
        conn.close()
        
        return {
            'total_conversions': total_stats[0] or 0,
            'total_urls': total_stats[1] or 0,
            'today_conversions': today_stats[0] if today_stats else 0,
            'today_urls': today_stats[1] if today_stats else 0,
            'recent_activity': [
                {
                    'timestamp': activity[0],
                    'url_count': activity[1],
                    'folder_name': activity[2],
                    'conversion_type': activity[3]
                }
                for activity in recent_activity
            ],
            'weekly_stats': [
                {
                    'date': stat[0],
                    'conversions': stat[1],
                    'urls': stat[2]
                }
                for stat in weekly_stats
            ]
        }

# Initialize database on startup
init_database()

def add_sample_data():
    """Add some sample data to demonstrate live statistics"""
    try:
        # Check if we already have data
        stats = get_live_stats()
        if stats['total_conversions'] > 0:
            return  # Already has data
        
        # Add sample conversions
        sample_conversions = [
            (15, "Job Sites", "download"),
            (8, "Tech Resources", "quickadd"),
            (23, "News Sites", "download"),
            (12, "Learning Resources", "quickadd"),
            (31, "Remote Work", "download"),
            (7, "Design Tools", "quickadd"),
            (19, "Development", "download"),
            (14, "Productivity", "quickadd"),
            (26, "Research", "download"),
            (9, "Social Media", "quickadd"),
        ]
        
        for url_count, folder_name, conversion_type in sample_conversions:
            log_conversion(url_count, folder_name, conversion_type)
            
        print("Sample data added to demonstrate live statistics")
    except Exception as e:
        print(f"Error adding sample data: {e}")

# Add sample data for demonstration
add_sample_data()

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
        log_conversion(url_count, folder_name, 'download')
        
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
        log_conversion(len(bookmarks_data), folder_name, 'quickadd')
        
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
    """Live analytics endpoint with database statistics"""
    try:
        stats = get_live_stats()
        return jsonify(stats)
    except Exception as e:
        print(f"Analytics error: {e}")
        return jsonify({
            'total_conversions': 0, 
            'total_urls': 0, 
            'today_conversions': 0,
            'today_urls': 0,
            'recent_activity': [],
            'weekly_stats': []
        })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)

