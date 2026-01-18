from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminPropertyViewSet, AdminUserViewSet, AdminBookingViewSet, AdminAnalyticsViewSet

router = DefaultRouter()
router.register(r'properties', AdminPropertyViewSet, basename='admin-property')
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'bookings', AdminBookingViewSet, basename='admin-booking')
router.register(r'analytics', AdminAnalyticsViewSet, basename='admin-analytics')

urlpatterns = [
    path('', include(router.urls)),
]
