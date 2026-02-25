from rest_framework import serializers
from django.db import transaction
from django.contrib.auth import get_user_model
from .models import Customer, Business
import re

User = get_user_model()

PHONE_REGEX = re.compile(r'^\+?\d{8,15}$')

#Crear usuario del negocio
class SignupSerializer(serializers.ModelSerializer):
    #creamos los campos para que aparezcan el el JSON de entrada
    phone = serializers.CharField(write_only = True, required = True)
    password = serializers.CharField(write_only = True, required = True, min_length = 8)
    
    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name", "role", "password", "phone")
    
    #si el telefono no es valido tira error
    def validate_phone(self, value):
        if not PHONE_REGEX.match(value):
            raise serializers.ValidationError("Formato del telefono invalido")
        return value

    def create(self, validated_data):
        phone = validated_data.pop("phone")
        password = validated_data.pop("password")
        
        #si algo dentro del bloque with no se guarda en User y Business, retrocede con los cambios
        with transaction.atomic():
            user = User.objects.create(**validated_data)
            user.set_password(password)
            user.save()
            Business.objects.create(user = user, phone = phone)
        return user
    