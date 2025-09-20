#!/usr/bin/env python3
"""
Text to HTML Bookmarks Converter
Converts a plain text file containing URLs (one per line) to HTML bookmarks format
that can be imported into any modern browser.
"""

def txt_to_bookmarks_html(txt_file_path, output_html_path="bookmarks.html"):
    """
    Convert a text file containing URLs to HTML bookmarks format
    
    Args:
        txt_file_path: Path to text file with URLs (one per line)
        output_html_path: Path for output HTML file
    """
    
    html_template = """<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3>Imported Bookmarks</H3>
    <DL><p>
{bookmark_items}
    </DL><p>
</DL><p>"""
    
    bookmark_items = []
    
    try:
        with open(txt_file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            
        for line in lines:
            url = line.strip()
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
        final_html = html_template.format(bookmark_items='\n'.join(bookmark_items))
        
        # Write to output file
        with open(output_html_path, 'w', encoding='utf-8') as output_file:
            output_file.write(final_html)
            
        print(f"Successfully converted {len(bookmark_items)} URLs to {output_html_path}")
        print("You can now import this HTML file into your browser.")
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python bookmark-converter.py input_file.txt [output_file.html]")
        print("Example: python bookmark-converter.py my_urls.txt my_bookmarks.html")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "bookmarks.html"
    
    txt_to_bookmarks_html(input_file, output_file)

if __name__ == "__main__":
    main()