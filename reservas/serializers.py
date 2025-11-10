from rest_framework import serializers
from django.db import transaction
from django.contrib.auth import get_user_model
from .models import Customer
import re

User = get_user_model()

PHONE_REGEX = re.compile(r'^\+?\d{8,15}$')

class SignupSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(write_only = True, required = True)
    password = serializers.CharField(write_only = True, required = True, min_length = 8)
    
    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name", "role", "password", "phone")
    
    def validate_phone(slef, value):
        if not PHONE_REGEX.match(value):
            raise serializers.ValidationError("Formato del telefono invalido")
        return value

    def create(self, validated_data):
        phone = validated_data.pop("phone")
        password = validated_data.pop("password")
        
        
        with transaction.atomic():
            user = User.objects.create(**validated_data)
            user.set_password(password)
            user.save()
            Customer.objects.create(user = user, phone = phone)
        return user
    