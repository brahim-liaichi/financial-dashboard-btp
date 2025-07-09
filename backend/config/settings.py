from pathlib import Path
import os
from dotenv import load_dotenv
import tempfile
from datetime import timedelta

# Load environment variables from .env file
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "h3ebsv013ja6@#j1p)6axzy2wmzgml&4&8$&+ky704ufoxbkpo",  # Default for development only
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False") == "True"

# Railway provides RAILWAY_STATIC_URL, we'll use that to detect Railway
IS_RAILWAY = os.getenv("RAILWAY_STATIC_URL") is not None

# Configure allowed hosts for Railway and local development
ALLOWED_HOSTS = []

if IS_RAILWAY:
    # Railway deployment
    ALLOWED_HOSTS = ["*"]  # Railway handles this with their proxy
elif DEBUG:
    # Local development
    ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # "django.contrib.sites",
    "django_extensions",
    # Third-party apps
    "rest_framework",  # REST framework for API
    "drf_spectacular",  # API documentation
    "corsheaders",  # Handle CORS
    # Your custom apps
    "apps.core",
    "apps.commandes",
    "apps.controle_depenses",
    "apps.dashboard",
    "django_filters",
    "apps.facturation",
    "apps.user_management.apps.UserManagementConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # CORS middleware
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database configuration
if IS_RAILWAY:
    # Railway PostgreSQL database
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("PGDATABASE"),
            "USER": os.getenv("PGUSER"),
            "PASSWORD": os.getenv("PGPASSWORD"),
            "HOST": os.getenv("PGHOST"),
            "PORT": os.getenv("PGPORT", "5432"),
        }
    }
else:
    # Local SQLite database
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "fr-fr"  # French language
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework settings
REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
}

# API Documentation settings
SPECTACULAR_SETTINGS = {
    "TITLE": "Financial Dashboard API",
    "DESCRIPTION": "API for Financial Dashboard Project",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# CORS settings
CORS_ALLOWED_ORIGINS = []
CSRF_TRUSTED_ORIGINS = []

if IS_RAILWAY:
    # Production CORS settings - you'll update these after deploying frontend
    CORS_ALLOWED_ORIGINS = [
        "https://your-frontend-url.vercel.app",  # Update this after Vercel deployment
    ]
    CSRF_TRUSTED_ORIGINS = [
        "https://your-frontend-url.vercel.app",  # Update this after Vercel deployment
    ]
else:
    # Development CORS settings
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

CSRF_USE_SESSIONS = True
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript access
CSRF_COOKIE_NAME = "csrftoken"

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# JWT Settings
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
}

# Cache configuration
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.filebased.FileBasedCache",
        "LOCATION": tempfile.gettempdir(),
        "TIMEOUT": 300,  # 5 minutes in seconds
        "OPTIONS": {"MAX_ENTRIES": 1000},
    }
}

# Security settings for production
if not DEBUG:
    # HTTPS Security
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    # Cookie Security
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # Browser Security
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

# Logging configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "level": "DEBUG" if DEBUG else "INFO",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "file": (
            {
                "level": "DEBUG",
                "class": "logging.FileHandler",
                "filename": "debug.log",
                "formatter": "verbose",
            }
            if DEBUG
            else {
                "level": "INFO",
                "class": "logging.StreamHandler",  # Railway uses console for logs
                "formatter": "simple",
            }
        ),
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"] if DEBUG else ["console"],
            "level": "INFO",
        },
        "apps": {
            "handlers": ["console", "file"] if DEBUG else ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": True,
        },
        "apps.controle_depenses.services.evolution_service": {
            "handlers": ["console", "file"] if DEBUG else ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": True,
        },
    },
}
