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

from rest_framework import serializers
from exchange.api.base import serializers as base_serializers
from geonode.layers.models import Attribute, Style
from django.utils.text import slugify

import json

class CategorySerializer(base_serializers.CategorySerializer):
    pass

class AttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attribute
        read_only_fields = ('attribute', 'attribute_type', 'last_stats_updated', 'layer')
        fields = '__all__'

class LayerSerializer(base_serializers.LayerSerializer):
    type = serializers.SerializerMethodField()
    versioned = serializers.SerializerMethodField()

    class Meta(base_serializers.LayerSerializer.Meta):
        fields = ('name', 'title', 'abstract', 'typename', 'versioned', 'type')

    def get_type(self, obj):
        return slugify(obj.display_type)

    def get_versioned(self, obj):
        return slugify(obj.geogig_enabled)

class StyleSerializer(serializers.ModelSerializer):

    def validate(self, data):

        if data['name']:
            data['name'] = (data['name'].lower().replace(" ", "_"))

        if 'mbstyle' in data['format'].lower():
            if data['body']:
                try:
                    mbstyle_doc = json.loads(data['body'])
                except Exception, e:
                    raise serializers.ValidationError("%s of field body" % e.message)

                if "version" not in mbstyle_doc or mbstyle_doc['version'] != 8:
                    if data['version'] and data['version'] == "8":
                        mbstyle_doc['version'] = int(data['version'])
                        data['body'] = json.dumps(mbstyle_doc)
                    else:
                        raise serializers.ValidationError("Style specification version number. Must be 8.")

            else:
                raise serializers.ValidationError("MBStyle document is invalid.")

        return data

    class Meta:
        model = Style
        fields = '__all__'

