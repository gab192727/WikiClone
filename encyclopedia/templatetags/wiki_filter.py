import re
from django import template
from django.utils.safestring import mark_safe
from django.utils.html import escape
from urllib.parse import quote

register = template.Library()

header_re = re.compile(r"^(=+)\s*(.+?)\s*=+$", re.MULTILINE)

@register.filter
def wiki_format(article):
    """
    Convert Wikipedia plain extract text into styled HTML containers, using sections for header levels with fallback.
    """
    value = article.get("content", "")
    links = article.get("links", [])
    sections = article.get("sections", [])
    html, lines = check_disambiguation(article, value.split("\n"))
    current_section = []
    current_header = None
    current_equals = 0

    for line in lines:
        header_match = header_re.match(line)
        if header_match:
            flush_section(current_section, current_header, html, sections, current_equals)
            current_section = []
            current_header = header_match.group(2).strip()
            current_equals = len(header_match.group(1))
        else:
            if line.strip():
                current_section.append(line)

    flush_section(current_section, current_header, html, sections, current_equals)

    html_str = "\n".join(html)
    if links:
        html_str = auto_link(html_str, links)

    return mark_safe(html_str)

def flush_section(current_section, current_header, html, sections, equals_count):
    if not current_section:
        return
    
    html.append('<div class="container content-container">')
    if current_header:
        # Find matching section by 'line' (case-insensitive, stripped)
        matching_section = next((s for s in sections if s.get("line", "").strip().lower() == current_header.lower()), None)
        if matching_section:
            level = int(matching_section.get("level", 2))
            anchor = matching_section.get("anchor", slugify(current_header))
        else:
            # Fallback: Use number of = from the header
            level = equals_count
            anchor = slugify(current_header)
        
        header_tag = f"h{min(level + 1, 6)}"  # 2->h3, 3->h4, 4->h5, 5+->h6
        
        if header_tag == 'h3':
            html.append(f'<{header_tag} id="{anchor}">{escape(current_header)}</{header_tag}><hr class="side-app-bar">')
        else:
            # For h4+, no hr, bold, and margin-bottom
            html.append(f'<{header_tag} id="{anchor}" class="fw-bold mb-3">{escape(current_header)}</{header_tag}>')

    html.append('<div class="container"><ul>')
    for line in current_section:
        if line.strip():
            html.append(f'<li class="main-text-content">{escape(line.strip())}</li>')
    html.append('</ul></div></div>')

def slugify(text):
    return re.sub(r'\W+', '-', text.lower()).strip('-')

def auto_link(html, links):
    for link in sorted(links, key=len, reverse=True):
        pattern = r'(?<!\w)' + re.escape(link) + r'(?!\w)'
        url = f"/search/{quote(link)}"
        replacement = f'<a href="{url}">{link}</a>'
        html = re.sub(pattern, replacement, html)
    return html

def check_disambiguation(article, lines):
    if article.get("is_disambiguation"):
        intro_line = lines[0]
        rest_lines = lines[1:]
        intro_words = intro_line.split()
        html = [
            '<div class="container content-container">',
            '<hr class="side-app-bar">',
            f'<p class="intro-text"><span class="fw-bold">{" ".join(escape(word) for word in intro_words[0:-3])} </span>{escape(" ".join(word for word in intro_words[-3:]))}</p>',
            '</div>',
        ]
        return html, rest_lines
    else:
        return ['<hr class="side-app-bar">'], lines
