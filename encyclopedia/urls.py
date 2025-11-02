from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("search/", views.search_redirect, name="search_redirect"),
    path("search/<str:title>/", views.article_view, name="article_view"),
    path("random/", views.random_article, name="random_article"),
    path("Disclaimer", views.disclaimer, name="disclaimer"),
    path("Terms_of_Condition", views.terms, name="terms"),
    path("Privacy_Policy", views.privacy, name="privacy"),
    path("About", views.about, name="about"),
]