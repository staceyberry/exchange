#
# Add template to story table
#

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0004_add_template_to_story_table')
    ]

    operations = [
        migrations.AddField(
            model_name='Story',
            name='positions',
            field=models.CharField(max_length=256, blank=True, null=True)
        ),
    ]
