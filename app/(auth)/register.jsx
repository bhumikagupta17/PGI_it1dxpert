import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../constants/theme';

function Field({ label, value, onChangeText, ...props }) {
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient', hospitalId: '' });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.hospitalId) {
      return Alert.alert('Missing fields', 'Please fill all fields.');
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Account created', 'Please log in with your credentials.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    }, 800);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.navy }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Ionicons name="pulse" size={32} color={Colors.teal} />
          <Text style={styles.appName}>DiabetesCare</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.sub}>Join the DiabetesCare platform</Text>

          <Field label="Full Name" value={form.name} onChangeText={v => update('name', v)} placeholder="Dr. Priya Sharma" autoCapitalize="words" />
          <Field label="Email" value={form.email} onChangeText={v => update('email', v)} placeholder="email@pgi.edu.in" autoCapitalize="none" keyboardType="email-address" />
          <Field label="Password" value={form.password} onChangeText={v => update('password', v)} placeholder="Min 8 characters" secureTextEntry />
          <Field label="Hospital ID" value={form.hospitalId} onChangeText={v => update('hospitalId', v)} placeholder="PGI-001" autoCapitalize="characters" />

          <Text style={styles.label}>I am a</Text>
          <View style={styles.roleRow}>
            {['patient', 'doctor'].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
                onPress={() => update('role', r)}
              >
                <Ionicons
                  name={r === 'doctor' ? 'medical' : 'person'}
                  size={18}
                  color={form.role === r ? Colors.white : Colors.teal}
                />
                <Text style={[styles.roleTxt, form.role === r && styles.roleTxtActive]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={{ color: Colors.teal, fontWeight: '700' }}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:       { flexGrow: 1, padding: Spacing.xl },
  back:         { marginTop: Spacing.lg, marginBottom: Spacing.md },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.xl },
  appName:      { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  card:         { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl, ...Shadow.lg },
  title:        { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  sub:          { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.xl },
  label:        { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  input:        { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: FontSize.base, color: Colors.textPrimary, backgroundColor: Colors.bg },
  roleRow:      { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl, marginTop: Spacing.xs },
  roleBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.teal, borderRadius: Radius.md, paddingVertical: 12, justifyContent: 'center' },
  roleBtnActive:{ backgroundColor: Colors.teal },
  roleTxt:      { fontSize: FontSize.base, fontWeight: '600', color: Colors.teal },
  roleTxtActive:{ color: Colors.white },
  btn:          { backgroundColor: Colors.teal, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: Spacing.lg },
  btnText:      { fontSize: FontSize.base, fontWeight: '700', color: Colors.white },
  loginLink:    { alignItems: 'center' },
  loginLinkText:{ fontSize: FontSize.sm, color: Colors.textSecondary },
});