# -*- coding: utf-8 -*-
#########################################################################
#
# Copyright (C) 2017 Boundless Spatial
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.
#
#########################################################################

from exchange.api.base import views as base_views
from . import serializers as v2_serializers
from rest_framework import viewsets

from geonode.layers.models import Style, Attribute


class LayerViewSet(base_views.LayerViewSet):
    serializer_class = v2_serializers.LayerSerializer

class CategoryViewSet(base_views.CategoryViewSet):
    serializer_class = v2_serializers.CategorySerializer

class AttributeViewSet(viewsets.ModelViewSet):
    queryset = Attribute.objects.all()
    serializer_class = v2_serializers.AttributeSerializer
    http_method_names = ['get', 'put', 'head', 'options']

class StyleViewSet(viewsets.ModelViewSet):
    queryset = Style.objects.all()
    serializer_class = v2_serializers.StyleSerializer
    lookup_field = 'name'