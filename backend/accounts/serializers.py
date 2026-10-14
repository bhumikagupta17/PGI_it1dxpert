from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, DoctorProfile, PatientProfile


class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ['specialization', 'hospital', 'license_number']


class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = ['diabetes_type', 'target_low', 'target_high',
                  'date_of_birth', 'diagnosis_date', 'weight_kg', 'height_cm']


class UserSerializer(serializers.ModelSerializer):
    doctor_profile = DoctorProfileSerializer(read_only=True)
    patient_profile = PatientProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'phone',
                  'avatar', 'created_at', 'doctor_profile', 'patient_profile']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=['doctor', 'patient'])

    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'role', 'phone']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            role=validated_data['role'],
            phone=validated_data.get('phone', ''),
        )
        # Auto-create role profile
        if user.role == 'doctor':
            DoctorProfile.objects.create(user=user)
        else:
            PatientProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled')
        data['user'] = user
        return data