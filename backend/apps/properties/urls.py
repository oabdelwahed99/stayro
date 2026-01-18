from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet

router = DefaultRouter()
router.register(r'', PropertyViewSet, basename='property')

# Get router URLs
router_urls = router.urls

urlpatterns = [
    path('', include(router_urls)),
]
