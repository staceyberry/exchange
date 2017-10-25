
from django.conf.urls import patterns, url, include
from django.conf.urls.static import static

from . import views

urlpatterns = [
    url(r'^castling/$', views.index, name='index'),
] + static('castling', document_root='/mnt/castling/build')
