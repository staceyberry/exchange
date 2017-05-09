#
# Add template to story table
#

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0003_add_story_table')
    ]

    operations = [
        migrations.AddField(
            model_name='Story',
            name='template',
            field=models.CharField(max_length=128, blank=True, null=True)
        ),
    ]
