# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_auto_20170531_1026'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cswrecord',
            name='category',
            field=models.CharField(blank=True, max_length=128, choices=[(b'Elevation', b'Elevation'), (b'EnvironmentalIssues', b'Environmental Issues'), (b'HumanGeog', b'Human Geography'), (b'Military', b'Military'), (b'MiscellaneousFeatures', b'Miscellaneous Features'), (b'NaturalFeatures', b'Natural Features'), (b'Safety', b'Safety'), (b'Transporation', b'Transportation'), (b'Weather', b'Weather')]),
        ),
    ]
