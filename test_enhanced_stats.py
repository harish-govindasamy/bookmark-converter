#!/usr/bin/env python3
"""
Test script for enhanced statistics system
This script simulates multiple users making conversions to test the live statistics
"""

import requests
import time
import random
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
TEST_URLS = [
    "https://github.com",
    "https://stackoverflow.com",
    "https://developer.mozilla.org",
    "https://www.w3schools.com",
    "https://docs.python.org",
    "https://flask.palletsprojects.com",
    "https://www.sqlite.org",
    "https://socket.io",
    "https://www.javascript.com",
    "https://www.css-tricks.com"
]

FOLDER_NAMES = [
    "Development Resources",
    "Learning Materials", 
    "Documentation",
    "Tools & Utilities",
    "Reference Sites",
    "Tutorials",
    "Code Examples",
    "Best Practices"
]

def simulate_conversion():
    """Simulate a single conversion"""
    try:
        # Random number of URLs (1-10)
        num_urls = random.randint(1, 10)
        urls = random.sample(TEST_URLS, num_urls)
        
        # Random folder name
        folder_name = random.choice(FOLDER_NAMES)
        
        # Random conversion type
        conversion_type = random.choice(['download', 'quickadd'])
        
        # Prepare data
        data = {
            'urls': '\n'.join(urls),
            'folder_name': folder_name
        }
        
        # Make request
        if conversion_type == 'download':
            response = requests.post(f"{BASE_URL}/convert", json=data, timeout=10)
        else:
            response = requests.post(f"{BASE_URL}/add-to-browser", json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {conversion_type}: {result.get('url_count', 0)} URLs in '{folder_name}' - {result.get('processing_time_ms', 0)}ms")
            return True
        else:
            print(f"❌ {conversion_type}: Failed - {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def get_live_stats():
    """Get current live statistics"""
    try:
        response = requests.get(f"{BASE_URL}/analytics", timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print(f"\n📊 Live Stats:")
            print(f"   Total Conversions: {stats.get('total_conversions', 0)}")
            print(f"   Total URLs: {stats.get('total_urls', 0)}")
            print(f"   Unique Users: {stats.get('unique_users', 0)}")
            print(f"   Today's Conversions: {stats.get('today_conversions', 0)}")
            print(f"   Success Rate: {stats.get('success_rate', 0)}%")
            print(f"   Avg Processing Time: {stats.get('avg_processing_time', 0)}ms")
            return stats
        else:
            print(f"❌ Failed to get stats: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error getting stats: {e}")
        return None

def get_admin_stats():
    """Get admin dashboard statistics"""
    try:
        response = requests.get(f"{BASE_URL}/admin", timeout=5)
        if response.status_code == 200:
            admin_data = response.json()
            print(f"\n🔧 Admin Stats:")
            print(f"   Total Records: {admin_data.get('system_metrics', {}).get('total_records', 0)}")
            print(f"   Failed Conversions: {admin_data.get('system_metrics', {}).get('failed_conversions', 0)}")
            print(f"   First Record: {admin_data.get('system_metrics', {}).get('first_record', 'N/A')}")
            print(f"   Last Record: {admin_data.get('system_metrics', {}).get('last_record', 'N/A')}")
            return admin_data
        else:
            print(f"❌ Failed to get admin stats: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error getting admin stats: {e}")
        return None

def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            health = response.json()
            print(f"✅ Health Check: {health.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ Health Check Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health Check Error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Enhanced Statistics Test")
    print("=" * 50)
    
    # Test health check first
    if not test_health_check():
        print("❌ Server is not running or not healthy. Please start the server first.")
        return
    
    # Get initial stats
    print("\n📊 Initial Statistics:")
    initial_stats = get_live_stats()
    
    # Simulate multiple conversions
    print(f"\n🔄 Simulating conversions...")
    successful_conversions = 0
    total_conversions = 20
    
    for i in range(total_conversions):
        print(f"\n--- Conversion {i+1}/{total_conversions} ---")
        if simulate_conversion():
            successful_conversions += 1
        
        # Random delay between conversions (1-3 seconds)
        time.sleep(random.uniform(1, 3))
        
        # Show stats every 5 conversions
        if (i + 1) % 5 == 0:
            get_live_stats()
    
    # Final statistics
    print(f"\n📊 Final Statistics:")
    final_stats = get_live_stats()
    
    # Admin statistics
    get_admin_stats()
    
    # Summary
    print(f"\n📈 Test Summary:")
    print(f"   Successful Conversions: {successful_conversions}/{total_conversions}")
    print(f"   Success Rate: {(successful_conversions/total_conversions)*100:.1f}%")
    
    if initial_stats and final_stats:
        conversions_added = final_stats.get('total_conversions', 0) - initial_stats.get('total_conversions', 0)
        urls_added = final_stats.get('total_urls', 0) - initial_stats.get('total_urls', 0)
        print(f"   Conversions Added: {conversions_added}")
        print(f"   URLs Added: {urls_added}")
    
    print(f"\n✅ Test completed! Check the web interface at {BASE_URL}")
    print(f"   Admin Dashboard: {BASE_URL}/admin-dashboard")

if __name__ == "__main__":
    main()
