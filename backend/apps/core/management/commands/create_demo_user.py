from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Create superuser for demo'

    def handle(self, *args, **options):
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@demo.com', 'admin123')
            self.stdout.write('Demo superuser created: admin/admin123')
        else:
            self.stdout.write('Demo superuser already exists')
