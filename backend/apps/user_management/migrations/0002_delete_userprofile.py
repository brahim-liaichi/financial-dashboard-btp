# Generated by Django 5.1.4 on 2025-02-19 13:51

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("user_management", "0001_initial"),
    ]

    operations = [
        migrations.DeleteModel(
            name="UserProfile",
        ),
    ]
