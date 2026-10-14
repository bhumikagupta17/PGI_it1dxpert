from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [('doctor', 'Doctor'), ('patient', 'Patient')]

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'role']

    def __str__(self):
        return f'{self.name} ({self.role})'


class DoctorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialization = models.CharField(max_length=100, default='Endocrinologist')
    hospital = models.CharField(max_length=255, blank=True)
    license_number = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f'Dr. {self.user.name}'


class PatientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    doctor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='patients')
    date_of_birth = models.DateField(null=True, blank=True)
    diabetes_type = models.CharField(max_length=10, default='T1D')
    diagnosis_date = models.DateField(null=True, blank=True)
    target_low = models.FloatField(default=70)
    target_high = models.FloatField(default=180)
    weight_kg = models.FloatField(null=True, blank=True)
    height_cm = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f'Patient: {self.user.name}'