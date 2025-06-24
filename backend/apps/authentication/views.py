from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample


@extend_schema(
    description="User Login Endpoint",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "username": {"type": "string", "description": "User's username"},
                "password": {"type": "string", "description": "User's password"},
            },
            "required": ["username", "password"],
        }
    },
    responses={
        200: OpenApiResponse(
            description="Successful login",
            response={
                "type": "object",
                "properties": {
                    "token": {"type": "string", "description": "JWT access token"},
                    "user": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer"},
                            "username": {"type": "string"},
                            "is_staff": {"type": "boolean"},
                            "permissions": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                        },
                    },
                },
            },
            examples=[
                OpenApiExample(
                    "Successful Login",
                    value={
                        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "user": {
                            "id": 1,
                            "username": "admin",
                            "is_staff": True,
                            "permissions": ["can_view_dashboard"],
                        },
                    },
                )
            ],
        ),
        401: OpenApiResponse(
            description="Invalid credentials",
            response={"type": "object", "properties": {"error": {"type": "string"}}},
        ),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    Authenticate user and generate access token.

    Validates user credentials and returns:
    - JWT access token
    - User details including ID, username, staff status, and permissions

    Args:
        request (Request): HTTP request object with username and password

    Returns:
        Response: Authentication token and user information or error message
    """
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user is not None:
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "token": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "is_staff": user.is_staff,
                    "permissions": list(user.get_all_permissions()),
                },
            }
        )

    return Response(
        {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
    )


@extend_schema(
    description="Get Current User Details",
    responses={
        200: OpenApiResponse(
            description="Successfully retrieved current user details",
            response={
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "username": {"type": "string"},
                    "is_staff": {"type": "boolean"},
                    "permissions": {"type": "array", "items": {"type": "string"}},
                },
            },
        ),
        401: OpenApiResponse(description="Unauthorized, authentication required"),
    },
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Retrieve details of the currently authenticated user.

    Returns user information including:
    - User ID
    - Username
    - Staff status
    - User permissions

    Args:
        request (Request): HTTP request from authenticated user

    Returns:
        Response: Current user details
    """
    return Response(
        {
            "id": request.user.id,
            "username": request.user.username,
            "is_staff": request.user.is_staff,
            "permissions": list(request.user.get_all_permissions()),
        }
    )


@extend_schema(
    description="User Logout Endpoint",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "refresh_token": {
                    "type": "string",
                    "description": "Refresh token to be blacklisted",
                }
            },
            "required": ["refresh_token"],
        }
    },
    responses={
        205: OpenApiResponse(description="Successfully logged out"),
        400: OpenApiResponse(description="Error during logout process"),
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout user by blacklisting the refresh token.

    Invalidates the provided refresh token, effectively logging out the user.

    Args:
        request (Request): HTTP request with refresh token

    Returns:
        Response: Logout status
    """
    try:
        refresh_token = request.data["refresh_token"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(status=status.HTTP_205_RESET_CONTENT)
    except Exception:
        return Response(status=status.HTTP_400_BAD_REQUEST)
