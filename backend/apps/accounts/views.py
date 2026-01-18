from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    UserProfileSerializer,
)
from .models import User

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Register a new user (Owner or Customer)
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that returns both tokens and user data
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Get user from the token
            from rest_framework_simplejwt.tokens import AccessToken
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            if access_token:
                token = AccessToken(access_token)
                user_id = token.get('user_id')
                try:
                    user = User.objects.get(id=user_id)
                    # Reformat response to match register endpoint
                    response.data = {
                        'user': UserSerializer(user).data,
                        'tokens': {
                            'access': access_token,
                            'refresh': refresh_token,
                        }
                    }
                except User.DoesNotExist:
                    pass
        return response


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """
    Get or update user profile
    """
    if request.method == 'GET':
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
