from django.shortcuts import render, redirect
from django.urls import reverse
from django_ratelimit.decorators import ratelimit
from django.views.decorators.http import require_GET
from .util import *
from urllib.parse import unquote
from .exceptions import *
from django.http import Http404


@require_GET
def index(request):
    return render(request, "encyclopedia/index.html", {"no_nav": True})


@require_GET
@ratelimit(key='ip', rate='10/m', method='GET', block=True)
def article_view(request, title):
    if not title:
        return redirect('index')
    
    # Decode URL-encoded parts, e.g. "Python%20(genus)" → "Python (genus)"
    # DO NOT slugify or replace characters — Wikipedia uses parentheses!
    api_title = unquote(title)
    
    try:
        data = fetch_article_from_wikipedia(api_title)

    except WikiError as exc:
        # Handle other Wiki errors (e.g., timeout, connection) by rendering error page
        return render(request, "encyclopedia/error.html", {
            "error": exc.message,
            "http_status": exc.status_code,
            "title": exc.title or "Error",
        }, status=exc.status_code)
    
    display_article = {
        "title": data.get("title"),
        "content": data.get("content"),
        "categories": data.get("categories", []),
        "links": data.get("links", []),
        "is_disambiguation": data.get("is_disambiguation"),
        "redirected_from": data.get("redirected_from"),
    }
    
    return render(request, "encyclopedia/article.html", {"article": display_article})



@require_GET
def search_redirect(request):
    title = request.GET.get('title', '').strip()
    if not title:
        return redirect('index')
    return redirect(reverse('article_view', args=[title]))


@require_GET
def random_article(request):
    title = fetch_random_article()
    print("title: ", title)
    if not title:
        return redirect('index')
    return redirect(reverse('article_view', args=[title]))
    
@require_GET
def disclaimer(request):
    return render(request, "encyclopedia/disclaimer.html")


@require_GET
def terms(request):
    return render(request, "encyclopedia/terms.html")


@require_GET
def privacy(request):
    return render(request, "encyclopedia/privacy.html")

@require_GET
def about(request):
    return render(request, "encyclopedia/about.html")


"""
Add content page
add current event page
contact me page
Dictionary integration | Call Oxford or Merriam API for word definitions |  Working with multiple APIs
"""