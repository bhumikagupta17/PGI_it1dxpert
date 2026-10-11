import { Stack } from 'expo-router';

export default function DoctorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="tabs" />
      <Stack.Screen name="patient/[id]" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}