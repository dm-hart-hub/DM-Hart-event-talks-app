import os
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# Cache dictionary to prevent hitting Google's feeds too frequently and speed up loads
feed_cache = {
    "data": None,
    "last_fetched": None
}

def fetch_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    response.raise_for_status()
    
    # Parse XML
    root = ET.fromstring(response.content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    for entry in root.findall('atom:entry', ns):
        title = entry.find('atom:title', ns)
        title_text = title.text if title is not None else "Unknown Date"
        
        updated = entry.find('atom:updated', ns)
        updated_text = updated.text if updated is not None else ""
        
        link_elem = entry.find("atom:link[@rel='alternate']", ns)
        link = link_elem.attrib['href'] if link_elem is not None else ""
        
        id_elem = entry.find('atom:id', ns)
        entry_id = id_elem.text if id_elem is not None else ""
        
        content_elem = entry.find('atom:content', ns)
        html_content = content_elem.text if content_elem is not None else ""
        
        # Parse HTML content into sub-updates
        soup = BeautifulSoup(html_content, 'html.parser')
        
        sub_updates = []
        current_type = None
        current_nodes = []
        
        for child in soup.contents:
            if getattr(child, 'name', None) == 'h3':
                if current_type is not None or current_nodes:
                    sub_updates.append({
                        'type': current_type or 'Update',
                        'content': "".join(str(n) for n in current_nodes).strip()
                    })
                    current_nodes = []
                current_type = child.get_text().strip()
            else:
                current_nodes.append(child)
                
        if current_nodes or current_type:
            sub_updates.append({
                'type': current_type or 'Update',
                'content': "".join(str(n) for n in current_nodes).strip()
            })
            
        # Fallback if no sub-updates were parsed
        if not sub_updates and html_content:
            sub_updates.append({
                'type': 'Update',
                'content': html_content.strip()
            })
            
        entries.append({
            'id': entry_id,
            'date': title_text,
            'updated': updated_text,
            'link': link,
            'sub_updates': sub_updates
        })
        
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        data = fetch_release_notes()
        feed_cache["data"] = data
        return jsonify({"success": True, "data": data})
    except Exception as e:
        # Fallback to cache if request fails
        if feed_cache["data"]:
            return jsonify({
                "success": True, 
                "data": feed_cache["data"], 
                "warning": "Failed to fetch live data; showing cached data.",
                "error": str(e)
            })
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
