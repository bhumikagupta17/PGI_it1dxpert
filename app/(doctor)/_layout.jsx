import { Stack } from 'expo-router';

export default function DoctorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="tabs" />
      <Stack.Screen name="patient/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
