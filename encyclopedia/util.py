import requests
from django.core.cache import cache
from urllib.parse import quote
from .exceptions import *

WIKI_API_URL = "https://en.wikipedia.org/w/api.php"
HEADERS = {
    "User-Agent": "WikiCloneBot/1.0 (contact: gabrielericigostope@gmail.com)",
}

session = requests.Session()
session.headers.update(HEADERS)

CACHE_TTL = 60 * 60 * 24 

def canonicalize_title(title: str) -> str:
    """Normalize title for cache consistency."""
    return title.strip().lower().replace(" ", "_")

def fetch_article_from_wikipedia(title: str):
    """Fetch article data (text, metadata, links, redirects, sections, etc.) from Wikipedia."""
    canonical_title = canonicalize_title(title)
    cache_key = f"wiki:article:{quote(canonical_title)}"
    cached = cache.get(cache_key)

    if cached:
        return cached

    # First API call gets sections and handle redirects
    sections_params = {
        "action": "parse",
        "page": title,
        "prop": "sections",
        "format": "json",
        "redirects": 1, 
    }

    try:
        sections_res = session.get(WIKI_API_URL, params=sections_params, timeout=10)
        sections_res.raise_for_status()
        sections_data = sections_res.json()
    except requests.exceptions.Timeout:
        raise WikiTimeoutError()
    except requests.exceptions.ConnectionError:
        raise WikiConnectionError()
    except requests.exceptions.HTTPError as e:
        raise WikiHTTPError(http_status=e.response.status_code)
    except Exception as e:
        raise WikiError()

    parse_data = sections_data.get("parse", {})
    sections = parse_data.get("sections", [])
    redirects = parse_data.get("redirects", [])
    resolved_title = parse_data.get("title", title) 

    if not parse_data.get("pageid"):
        raise WikiNotFoundError(f"The article '{title}' could not be found on Wiki.", title=title)

    # Second API call: Get main content
    params = {
        "action": "query",
        "format": "json",
        "titles": resolved_title,
        "prop": "extracts|links|info|categories|pageprops",
        "explaintext": 1,
        "inprop": "url",
        "pllimit": 500,
    }

    try:
        resp = session.get(WIKI_API_URL, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except requests.exceptions.Timeout:
        raise WikiTimeoutError()
    except requests.exceptions.ConnectionError:
        raise WikiConnectionError()
    except requests.exceptions.HTTPError as e:
        raise WikiHTTPError(http_status=e.response.status_code)
    except Exception as e:
        raise WikiError()

    pages = data.get("query", {}).get("pages", {})

    if "-1" in pages:
        raise WikiNotFoundError(f"The article '{resolved_title}' could not be found on Wiki.", title=resolved_title)

    page = next(iter(pages.values()))

    result = {
        "title": page.get("title"),
        "content": page.get("extract", ""),
        "links": [l["title"] for l in page.get("links", [])],
        "sections": sections,  # From first call,
        "is_disambiguation": "disambiguation" in page.get("pageprops", {}),
        "redirected_from": redirects[0]["from"] if redirects else None, 
    }

    etag = resp.headers.get("ETag")
    if etag:
        result["_etag"] = etag

    cache.set(cache_key, result, CACHE_TTL)
    return result


def fetch_random_article():
    """Fetch a random article's data (title, content) from Wikipedia in one API call."""
    params = {
    "action": "query",
    "generator": "random",
    "grnnamespace": 0,
    "format": "json",
    "grnlimit": 1,
    }

    try:
        res = session.get(WIKI_API_URL, params=params, timeout=10)
        res.raise_for_status()
        data = res.json()
    except requests.exceptions.Timeout:
        raise WikiTimeoutError()
    except requests.exceptions.ConnectionError:
        raise WikiConnectionError()
    except requests.exceptions.HTTPError as e:
        raise WikiHTTPError(http_status=e.response.status_code)
    except Exception as e:
        raise WikiError()
    
    page = next(iter(data["query"]["pages"].values()))
    title = page["title"]
    return title.split(":", 1)[1].strip() if ":" in title else title

