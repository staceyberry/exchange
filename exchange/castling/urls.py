
from django.conf.urls import patterns, url, include
from django.conf.urls.static import static

from . import views

urlpatterns = [
    # TODO: make these one regex.
    url(r'^castling/$', views.index, name='index'),
    url(r'^castling/index.html$', views.index, name='index'),
] + static('castling', document_root='/mnt/castling/build')
