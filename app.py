#!/usr/bin/env python3
"""
Bookmark Converter Web App
A simple Flask web application for converting URLs to HTML bookmarks
Enhanced with secure database and live statistics
"""

from flask import Flask, render_template, request, send_file, jsonify, Response
from flask_socketio import SocketIO, emit
import os
import tempfile
from datetime import datetime, timedelta
import json
import sqlite3
import threading
import hashlib
import secrets
import re
from functools import wraps
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# Initialize SocketIO for real-time updates
socketio = SocketIO(app, cors_allowed_origins="*")

# Database setup with enhanced security
DATABASE = 'bookmark_stats.db'
lock = threading.Lock()

# Rate limiting storage (in production, use Redis)
rate_limit_storage = {}
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 10  # per window

def rate_limit(f):
    """Rate limiting decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        current_time = time.time()
        
        # Clean old entries
        rate_limit_storage[client_ip] = [
            req_time for req_time in rate_limit_storage.get(client_ip, [])
            if current_time - req_time < RATE_LIMIT_WINDOW
        ]
        
        # Check rate limit
        if len(rate_limit_storage.get(client_ip, [])) >= RATE_LIMIT_MAX_REQUESTS:
            return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429
        
        # Add current request
        if client_ip not in rate_limit_storage:
            rate_limit_storage[client_ip] = []
        rate_limit_storage[client_ip].append(current_time)
        
        return f(*args, **kwargs)
    return decorated_function

def validate_input(data, max_length=10000):
    """Validate and sanitize input data"""
    if not isinstance(data, str):
        return False, "Invalid data type"
    
    if len(data) > max_length:
        return False, f"Data too long (max {max_length} characters)"
    
    # Check for potentially malicious content
    dangerous_patterns = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'data:text/html',
        r'vbscript:',
        r'onload\s*=',
        r'onerror\s*='
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, data, re.IGNORECASE):
            return False, "Potentially malicious content detected"
    
    return True, data

def get_client_info():
    """Get client information for analytics"""
    client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    user_agent = request.headers.get('User-Agent', 'Unknown')
    
    # Create a hash of the IP for privacy
    ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:16]
    
    return {
        'ip_hash': ip_hash,
        'user_agent': user_agent[:200],  # Limit length
        'timestamp': datetime.now().isoformat()
    }

def init_database():
    """Initialize the SQLite database for statistics tracking with enhanced security"""
    with lock:
        conn = sqlite3.connect(DATABASE, timeout=30.0)
        cursor = conn.cursor()
        
        # Enable WAL mode for better concurrency
        cursor.execute('PRAGMA journal_mode=WAL')
        cursor.execute('PRAGMA synchronous=NORMAL')
        cursor.execute('PRAGMA cache_size=10000')
        cursor.execute('PRAGMA temp_store=MEMORY')
        
        # Create enhanced usage statistics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usage_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                url_count INTEGER NOT NULL CHECK (url_count > 0 AND url_count <= 1000),
                folder_name TEXT CHECK (length(folder_name) <= 100),
                conversion_type TEXT DEFAULT 'download' CHECK (conversion_type IN ('download', 'quickadd')),
                client_ip_hash TEXT,
                user_agent TEXT,
                session_id TEXT,
                processing_time_ms INTEGER,
                success BOOLEAN DEFAULT 1
            )
        ''')
        
        # Create daily summary table for better performance
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS daily_stats (
                date TEXT PRIMARY KEY,
                total_conversions INTEGER DEFAULT 0,
                total_urls INTEGER DEFAULT 0,
                unique_users INTEGER DEFAULT 0,
                avg_processing_time REAL DEFAULT 0,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create user sessions table for better analytics
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                session_id TEXT PRIMARY KEY,
                first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                total_conversions INTEGER DEFAULT 0,
                total_urls INTEGER DEFAULT 0,
                client_ip_hash TEXT,
                user_agent TEXT
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_stats(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_usage_conversion_type ON usage_stats(conversion_type)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON user_sessions(last_seen)')
        
        conn.commit()
        conn.close()

def log_conversion(url_count, folder_name, conversion_type='download', processing_time_ms=None, success=True):
    """Log a conversion to the database with enhanced tracking"""
    client_info = get_client_info()
    session_id = request.cookies.get('session_id', secrets.token_hex(16))
    
    with lock:
        conn = sqlite3.connect(DATABASE, timeout=30.0)
        cursor = conn.cursor()
        
        try:
            # Insert the conversion record with enhanced data
            cursor.execute('''
                INSERT INTO usage_stats (
                    url_count, folder_name, conversion_type, 
                    client_ip_hash, user_agent, session_id, 
                    processing_time_ms, success
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                url_count, folder_name, conversion_type,
                client_info['ip_hash'], client_info['user_agent'], session_id,
                processing_time_ms, success
            ))
            
            # Update or create user session
            cursor.execute('''
                INSERT OR REPLACE INTO user_sessions (
                    session_id, first_seen, last_seen, 
                    total_conversions, total_urls, 
                    client_ip_hash, user_agent
                )
                VALUES (
                    ?,
                    COALESCE((SELECT first_seen FROM user_sessions WHERE session_id = ?), CURRENT_TIMESTAMP),
                    CURRENT_TIMESTAMP,
                    COALESCE((SELECT total_conversions FROM user_sessions WHERE session_id = ?), 0) + 1,
                    COALESCE((SELECT total_urls FROM user_sessions WHERE session_id = ?), 0) + ?,
                    ?, ?
                )
            ''', (session_id, session_id, session_id, session_id, url_count, 
                  client_info['ip_hash'], client_info['user_agent']))
            
            # Update daily stats with enhanced metrics
            today = datetime.now().strftime('%Y-%m-%d')
            cursor.execute('''
                INSERT OR REPLACE INTO daily_stats (
                    date, total_conversions, total_urls, unique_users, 
                    avg_processing_time, last_updated
                )
                VALUES (
                    ?,
                    COALESCE((SELECT total_conversions FROM daily_stats WHERE date = ?), 0) + 1,
                    COALESCE((SELECT total_urls FROM daily_stats WHERE date = ?), 0) + ?,
                    (SELECT COUNT(DISTINCT client_ip_hash) FROM usage_stats WHERE DATE(timestamp) = ?),
                    COALESCE((SELECT AVG(processing_time_ms) FROM usage_stats WHERE DATE(timestamp) = ? AND processing_time_ms IS NOT NULL), 0),
                    CURRENT_TIMESTAMP
                )
            ''', (today, today, today, url_count, today, today))
            
            conn.commit()
            
            # Emit real-time update via WebSocket
            socketio.emit('stats_update', {
                'type': 'conversion',
                'url_count': url_count,
                'conversion_type': conversion_type,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            conn.rollback()
            print(f"Database error in log_conversion: {e}")
        finally:
            conn.close()

def get_live_stats():
    """Get comprehensive live statistics from the database"""
    with lock:
        conn = sqlite3.connect(DATABASE, timeout=30.0)
        cursor = conn.cursor()
        
        try:
            # Get total stats with enhanced metrics
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_conversions,
                    COALESCE(SUM(url_count), 0) as total_urls,
                    COUNT(DISTINCT client_ip_hash) as unique_users,
                    COALESCE(AVG(processing_time_ms), 0) as avg_processing_time,
                    COUNT(CASE WHEN success = 1 THEN 1 END) as successful_conversions
                FROM usage_stats
            ''')
            total_stats = cursor.fetchone()
            
            # Get today's stats
            today = datetime.now().strftime('%Y-%m-%d')
            cursor.execute('''
                SELECT total_conversions, total_urls, unique_users, avg_processing_time
                FROM daily_stats
                WHERE date = ?
            ''', (today,))
            today_stats = cursor.fetchone()
            
            # Get hourly stats for today
            cursor.execute('''
                SELECT 
                    strftime('%H', timestamp) as hour,
                    COUNT(*) as conversions,
                    SUM(url_count) as urls
                FROM usage_stats
                WHERE DATE(timestamp) = ?
                GROUP BY strftime('%H', timestamp)
                ORDER BY hour
            ''', (today,))
            hourly_stats = cursor.fetchall()
            
            # Get recent activity (last 15 conversions)
            cursor.execute('''
                SELECT timestamp, url_count, folder_name, conversion_type, processing_time_ms
                FROM usage_stats
                WHERE success = 1
                ORDER BY timestamp DESC
                LIMIT 15
            ''')
            recent_activity = cursor.fetchall()
            
            # Get daily stats for the last 14 days
            cursor.execute('''
                SELECT date, total_conversions, total_urls, unique_users
                FROM daily_stats
                ORDER BY date DESC
                LIMIT 14
            ''')
            daily_stats = cursor.fetchall()
            
            # Get conversion type breakdown
            cursor.execute('''
                SELECT conversion_type, COUNT(*) as count, SUM(url_count) as total_urls
                FROM usage_stats
                WHERE success = 1
                GROUP BY conversion_type
            ''')
            conversion_breakdown = cursor.fetchall()
            
            # Get top folder names
            cursor.execute('''
                SELECT folder_name, COUNT(*) as count, SUM(url_count) as total_urls
                FROM usage_stats
                WHERE success = 1 AND folder_name IS NOT NULL
                GROUP BY folder_name
                ORDER BY count DESC
                LIMIT 10
            ''')
            top_folders = cursor.fetchall()
            
            # Get active sessions (last 24 hours)
            cursor.execute('''
                SELECT COUNT(DISTINCT session_id) as active_sessions
                FROM user_sessions
                WHERE last_seen > datetime('now', '-24 hours')
            ''')
            active_sessions = cursor.fetchone()
            
            conn.close()
            
            return {
                'total_conversions': total_stats[0] or 0,
                'total_urls': total_stats[1] or 0,
                'unique_users': total_stats[2] or 0,
                'avg_processing_time': round(total_stats[3] or 0, 2),
                'success_rate': round((total_stats[4] or 0) / max(total_stats[0] or 1, 1) * 100, 1),
                'today_conversions': today_stats[0] if today_stats else 0,
                'today_urls': today_stats[1] if today_stats else 0,
                'today_unique_users': today_stats[2] if today_stats else 0,
                'today_avg_processing_time': round(today_stats[3] or 0, 2),
                'active_sessions': active_sessions[0] if active_sessions else 0,
                'hourly_stats': [
                    {
                        'hour': int(stat[0]),
                        'conversions': stat[1],
                        'urls': stat[2]
                    }
                    for stat in hourly_stats
                ],
                'recent_activity': [
                    {
                        'timestamp': activity[0],
                        'url_count': activity[1],
                        'folder_name': activity[2],
                        'conversion_type': activity[3],
                        'processing_time_ms': activity[4]
                    }
                    for activity in recent_activity
                ],
                'daily_stats': [
                    {
                        'date': stat[0],
                        'conversions': stat[1],
                        'urls': stat[2],
                        'unique_users': stat[3]
                    }
                    for stat in daily_stats
                ],
                'conversion_breakdown': [
                    {
                        'type': breakdown[0],
                        'count': breakdown[1],
                        'total_urls': breakdown[2]
                    }
                    for breakdown in conversion_breakdown
                ],
                'top_folders': [
                    {
                        'name': folder[0],
                        'count': folder[1],
                        'total_urls': folder[2]
                    }
                    for folder in top_folders
                ],
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting live stats: {e}")
            conn.close()
            return {
                'total_conversions': 0,
                'total_urls': 0,
                'unique_users': 0,
                'avg_processing_time': 0,
                'success_rate': 0,
                'today_conversions': 0,
                'today_urls': 0,
                'today_unique_users': 0,
                'today_avg_processing_time': 0,
                'active_sessions': 0,
                'hourly_stats': [],
                'recent_activity': [],
                'daily_stats': [],
                'conversion_breakdown': [],
                'top_folders': [],
                'last_updated': datetime.now().isoformat()
            }

# Initialize database on startup
init_database()

def add_sample_data():
    """Add some sample data to demonstrate live statistics"""
    try:
        # Check if we already have data
        with lock:
            conn = sqlite3.connect(DATABASE, timeout=30.0)
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM usage_stats')
            count = cursor.fetchone()[0]
            conn.close()
            
        if count > 0:
            return  # Already has data
        
        # Add sample conversions directly to database (without request context)
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
        
        with lock:
            conn = sqlite3.connect(DATABASE, timeout=30.0)
            cursor = conn.cursor()
            
            for url_count, folder_name, conversion_type in sample_conversions:
                # Insert directly without request context
                cursor.execute('''
                    INSERT INTO usage_stats (
                        url_count, folder_name, conversion_type, 
                        client_ip_hash, user_agent, session_id, 
                        processing_time_ms, success
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    url_count, folder_name, conversion_type,
                    'sample_data', 'Sample Data Generator', 'sample_session',
                    150, True
                ))
                
                # Update daily stats
                today = datetime.now().strftime('%Y-%m-%d')
                cursor.execute('''
                    INSERT OR REPLACE INTO daily_stats (
                        date, total_conversions, total_urls, unique_users, 
                        avg_processing_time, last_updated
                    )
                    VALUES (
                        ?,
                        COALESCE((SELECT total_conversions FROM daily_stats WHERE date = ?), 0) + 1,
                        COALESCE((SELECT total_urls FROM daily_stats WHERE date = ?), 0) + ?,
                        1,
                        150.0,
                        CURRENT_TIMESTAMP
                    )
                ''', (today, today, today, url_count))
            
            conn.commit()
            conn.close()
            
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

@app.route('/admin-dashboard')
def admin_dashboard_page():
    """Serve the admin dashboard page"""
    return render_template('admin.html')

@app.route('/convert', methods=['POST'])
@rate_limit
def convert():
    start_time = time.time()
    try:
        data = request.get_json()
        urls_text = data.get('urls', '')
        folder_name = data.get('folder_name', 'Imported Bookmarks')
        
        # Validate input
        is_valid, validation_result = validate_input(urls_text)
        if not is_valid:
            return jsonify({'error': validation_result}), 400
        
        is_valid, validation_result = validate_input(folder_name, max_length=100)
        if not is_valid:
            return jsonify({'error': validation_result}), 400
        
        if not urls_text.strip():
            return jsonify({'error': 'Please provide some URLs'}), 400
        
        html_content, url_count = txt_to_bookmarks_html(urls_text, folder_name)
        
        if url_count == 0:
            return jsonify({'error': 'No valid URLs found in the provided text'}), 400
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
            f.write(html_content)
            temp_file = f.name
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Log usage for analytics
        log_conversion(url_count, folder_name, 'download', processing_time_ms, True)
        
        return jsonify({
            'success': True,
            'url_count': url_count,
            'download_url': f'/download/{os.path.basename(temp_file)}',
            'processing_time_ms': processing_time_ms
        })
        
    except Exception as e:
        processing_time_ms = int((time.time() - start_time) * 1000)
        log_conversion(0, 'Error', 'download', processing_time_ms, False)
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>')
def download_file(filename):
    try:
        file_path = os.path.join(tempfile.gettempdir(), filename)
        return send_file(file_path, as_attachment=True, download_name='bookmarks.html')
    except Exception as e:
        return jsonify({'error': 'File not found'}), 404

@app.route('/add-to-browser', methods=['POST'])
@rate_limit
def add_to_browser():
    """Add bookmarks directly to browser using JavaScript"""
    start_time = time.time()
    try:
        data = request.get_json()
        urls_text = data.get('urls', '')
        folder_name = data.get('folder_name', 'Imported Bookmarks')
        
        # Validate input
        is_valid, validation_result = validate_input(urls_text)
        if not is_valid:
            return jsonify({'error': validation_result}), 400
        
        is_valid, validation_result = validate_input(folder_name, max_length=100)
        if not is_valid:
            return jsonify({'error': validation_result}), 400
        
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
        
        if len(bookmarks_data) == 0:
            return jsonify({'error': 'No valid URLs found in the provided text'}), 400
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Log usage for analytics
        log_conversion(len(bookmarks_data), folder_name, 'quickadd', processing_time_ms, True)
        
        return jsonify({
            'success': True,
            'bookmarks': bookmarks_data,
            'folder_name': folder_name,
            'count': len(bookmarks_data),
            'processing_time_ms': processing_time_ms
        })
        
    except Exception as e:
        processing_time_ms = int((time.time() - start_time) * 1000)
        log_conversion(0, 'Error', 'quickadd', processing_time_ms, False)
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
            'unique_users': 0,
            'avg_processing_time': 0,
            'success_rate': 0,
            'today_conversions': 0,
            'today_urls': 0,
            'today_unique_users': 0,
            'today_avg_processing_time': 0,
            'active_sessions': 0,
            'hourly_stats': [],
            'recent_activity': [],
            'daily_stats': [],
            'conversion_breakdown': [],
            'top_folders': [],
            'last_updated': datetime.now().isoformat()
        })

@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection"""
    print(f'Client connected: {request.sid}')
    emit('connected', {'message': 'Connected to live statistics'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    print(f'Client disconnected: {request.sid}')

@socketio.on('request_stats')
def handle_stats_request():
    """Handle real-time stats request"""
    try:
        stats = get_live_stats()
        emit('stats_update', stats)
    except Exception as e:
        emit('error', {'message': 'Failed to fetch statistics'})

@app.route('/admin')
def admin_dashboard():
    """Admin dashboard for monitoring statistics"""
    try:
        stats = get_live_stats()
        
        # Get additional admin data
        with lock:
            conn = sqlite3.connect(DATABASE, timeout=30.0)
            cursor = conn.cursor()
            
            # Get system health metrics
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_records,
                    MIN(timestamp) as first_record,
                    MAX(timestamp) as last_record,
                    AVG(processing_time_ms) as avg_processing_time,
                    COUNT(CASE WHEN success = 0 THEN 1 END) as failed_conversions
                FROM usage_stats
            ''')
            system_metrics = cursor.fetchone()
            
            # Get hourly distribution for today
            cursor.execute('''
                SELECT 
                    strftime('%H', timestamp) as hour,
                    COUNT(*) as conversions,
                    SUM(url_count) as urls,
                    AVG(processing_time_ms) as avg_time
                FROM usage_stats
                WHERE DATE(timestamp) = DATE('now')
                GROUP BY strftime('%H', timestamp)
                ORDER BY hour
            ''')
            hourly_data = cursor.fetchall()
            
            # Get top performing hours
            cursor.execute('''
                SELECT 
                    strftime('%H', timestamp) as hour,
                    COUNT(*) as conversions
                FROM usage_stats
                WHERE DATE(timestamp) >= DATE('now', '-7 days')
                GROUP BY strftime('%H', timestamp)
                ORDER BY conversions DESC
                LIMIT 5
            ''')
            top_hours = cursor.fetchall()
            
            conn.close()
        
        admin_data = {
            'system_metrics': {
                'total_records': system_metrics[0] or 0,
                'first_record': system_metrics[1],
                'last_record': system_metrics[2],
                'avg_processing_time': round(system_metrics[3] or 0, 2),
                'failed_conversions': system_metrics[4] or 0
            },
            'hourly_distribution': [
                {
                    'hour': int(hour[0]),
                    'conversions': hour[1],
                    'urls': hour[2],
                    'avg_time': round(hour[3] or 0, 2)
                }
                for hour in hourly_data
            ],
            'top_hours': [
                {
                    'hour': int(hour[0]),
                    'conversions': hour[1]
                }
                for hour in top_hours
            ],
            'current_stats': stats
        }
        
        return jsonify(admin_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        stats = get_live_stats()
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # Use SocketIO with production-safe settings
    socketio.run(app, debug=False, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)

