#!/usr/bin/env python3
"""
Enhanced parser for Chroniques Oubliées rules HTML to JSON
Extracts all sections with their content including tables
"""

import re
import json
from html.parser import HTMLParser
from pathlib import Path

class EnhancedRulesParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sections = []
        self.current_section = None
        self.current_content = []
        
        # State tracking
        self.in_heading = False
        self.in_body = False
        self.in_paragraph = False
        self.in_list = False
        self.in_list_item = False
        self.in_table = False
        self.in_table_row = False
        self.in_table_cell = False
        self.in_strong = False
        self.in_em = False
        
        # Current data
        self.current_text = []
        self.current_table = None
        self.current_row = []
        self.table_headers = []
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        
        # Section heading
        if tag == 'h3' and attrs_dict.get('class') == 'book-heading':
            self.in_heading = True
            if self.current_section:
                self.sections.append(self.current_section)
            self.current_section = {
                'title': '',
                'content': []
            }
            self.current_content = []
            
        # Body content
        elif tag == 'div' and 'field--name-body' in attrs_dict.get('class', ''):
            self.in_body = True
            
        # Paragraph
        elif tag == 'p' and self.in_body:
            self.in_paragraph = True
            self.current_text = []
            
        # List
        elif tag == 'ul' and self.in_body:
            self.in_list = True
            self.current_content.append({'type': 'list', 'items': []})
            
        # List item
        elif tag == 'li' and self.in_list:
            self.in_list_item = True
            self.current_text = []
            
        # Table
        elif tag == 'table' and self.in_body:
            self.in_table = True
            self.current_table = {'type': 'table', 'headers': [], 'rows': []}
            self.table_headers = []
            
        # Table row
        elif tag == 'tr' and self.in_table:
            self.in_table_row = True
            self.current_row = []
            
        # Table header
        elif tag == 'th' and self.in_table_row:
            self.in_table_cell = True
            self.current_text = []
            
        # Table cell
        elif tag == 'td' and self.in_table_row:
            self.in_table_cell = True
            self.current_text = []
            
        # Formatting
        elif tag == 'strong':
            self.in_strong = True
            
        elif tag == 'em':
            self.in_em = True
            
    def handle_endtag(self, tag):
        if tag == 'h3' and self.in_heading:
            self.in_heading = False
            
        elif tag == 'div' and self.in_body:
            self.in_body = False
            if self.current_section and self.current_content:
                self.current_section['content'] = self.current_content
                
        elif tag == 'p' and self.in_paragraph:
            self.in_paragraph = False
            text = ''.join(self.current_text).strip()
            if text:
                self.current_content.append({'type': 'text', 'content': text})
            self.current_text = []
            
        elif tag == 'ul' and self.in_list:
            self.in_list = False
            
        elif tag == 'li' and self.in_list_item:
            self.in_list_item = False
            text = ''.join(self.current_text).strip()
            if text and self.current_content:
                for item in reversed(self.current_content):
                    if item.get('type') == 'list':
                        item['items'].append(text)
                        break
            self.current_text = []
            
        elif tag == 'table' and self.in_table:
            self.in_table = False
            if self.current_table and (self.current_table['headers'] or self.current_table['rows']):
                self.current_content.append(self.current_table)
            self.current_table = None
            
        elif tag == 'tr' and self.in_table_row:
            self.in_table_row = False
            if self.current_row:
                # If we haven't set headers yet, this row is headers
                if not self.current_table['headers']:
                    self.current_table['headers'] = self.current_row
                else:
                    self.current_table['rows'].append(self.current_row)
            self.current_row = []
            
        elif (tag == 'th' or tag == 'td') and self.in_table_cell:
            self.in_table_cell = False
            text = ''.join(self.current_text).strip()
            self.current_row.append(text)
            self.current_text = []
            
        elif tag == 'strong':
            self.in_strong = False
            
        elif tag == 'em':
            self.in_em = False
            
    def handle_data(self, data):
        if self.in_heading:
            self.current_section['title'] = data.strip()
        elif self.in_paragraph or self.in_list_item or self.in_table_cell:
            # Clean up whitespace but preserve structure
            cleaned = re.sub(r'\s+', ' ', data)
            
            # Add formatting markers
            if self.in_strong:
                cleaned = f'<strong>{cleaned}</strong>'
            elif self.in_em:
                cleaned = f'<em>{cleaned}</em>'
                
            self.current_text.append(cleaned)
            
    def get_sections(self):
        if self.current_section:
            self.sections.append(self.current_section)
        return self.sections

def parse_rules_html(html_path):
    """Parse the HTML file and return structured data"""
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    parser = EnhancedRulesParser()
    parser.feed(html_content)
    sections = parser.get_sections()
    
    # Filter out empty sections
    sections = [s for s in sections if s['title'] and s['content']]
    
    return sections

def main():
    html_path = Path('app/public/Règles/Règles.htm')
    output_path = Path('app/src/data/Rules.json')
    
    print(f"Parsing {html_path}...")
    sections = parse_rules_html(html_path)
    
    print(f"Found {len(sections)} sections")
    
    # Count content types
    total_text = sum(1 for s in sections for c in s['content'] if c['type'] == 'text')
    total_lists = sum(1 for s in sections for c in s['content'] if c['type'] == 'list')
    total_tables = sum(1 for s in sections for c in s['content'] if c['type'] == 'table')
    
    print(f"  Text blocks: {total_text}")
    print(f"  Lists: {total_lists}")
    print(f"  Tables: {total_tables}")
    
    # Write to JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(sections, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Wrote {output_path}")
    
    # Show first few sections
    print(f"\nFirst sections:")
    for s in sections[:5]:
        content_types = [c['type'] for c in s['content']]
        print(f"  - {s['title']}: {len(s['content'])} items ({', '.join(set(content_types))})")

if __name__ == '__main__':
    main()
