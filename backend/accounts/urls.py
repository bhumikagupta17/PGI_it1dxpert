from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('me/', views.me, name='me'),
    path('profile/', views.update_profile, name='update_profile'),
    path('logout/', views.logout, name='logout'),
]