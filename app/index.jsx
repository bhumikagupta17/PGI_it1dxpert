import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/theme';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else if (user?.role === 'doctor') {
      router.replace('/(doctor)/tabs');
    } else {
      router.replace('/(patient)/tabs');
    }
  }, [isAuthenticated, isLoading, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.navy }}>
      <ActivityIndicator color={Colors.teal} size="large" />
    </View>
  );
}
