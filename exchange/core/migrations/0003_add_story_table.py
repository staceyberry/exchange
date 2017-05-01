#
# Add story table
#

from django.db import migrations, models
import uuid
from django.conf import settings

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0002_lengthen_csw_source')
    ]

    operations = [
        migrations.CreateModel(
            name='Story',
            fields=[
                ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)),
                ('map_id', models.IntegerField()),
                ('footer', models.CharField(max_length=128, blank=True)),
                ('selected_feature', models.CharField(max_length=128, blank=True)),
                ('icon', models.ImageField(upload_to=settings.MEDIA_ROOT, blank=True, null=True)),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
