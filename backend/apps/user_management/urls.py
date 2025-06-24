from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, UserProjectViewSet, EnsureProjectExistsView

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"user-projects", UserProjectViewSet, basename="user-project")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "ensure-project/<str:project_code>/",
        EnsureProjectExistsView.as_view(),
        name="ensure-project",
    ),
]
