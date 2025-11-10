from django.shortcuts import render
from rest_framework import generics
from .serializers import SignupSerializer
from rest_framework.permissions import AllowAny


# Create your views here.

class SignupCreateView(generics.CreateAPIView):
    serializer_class = SignupSerializer
    permission_classes = [AllowAny]
    authentication_classes = []