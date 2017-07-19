#
# Add template to story table
#

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0005_add_sizing_to_story_table')
    ]

    operations = [
        migrations.AddField(
            model_name='Story',
            name='chart_layer',
            field=models.CharField(max_length=128, blank=True, null=True)
        ),
        migrations.AddField(
            model_name='Story',
            name='chart_attribute',
            field=models.CharField(max_length=128, blank=True, null=True)
        ),
    ]
