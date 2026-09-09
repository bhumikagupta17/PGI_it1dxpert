import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // index.jsx will redirect based on role
      router.replace('/');
    } catch (err) {
      Alert.alert('Login failed', err?.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="pulse" size={36} color={Colors.teal} />
          </View>
          <Text style={styles.appName}>DiabetesCare</Text>
          <Text style={styles.subtitle}>iT1DXpert · PGI Chandigarh</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to your account</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="doctor@pgi.edu.in"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(v => !v)}>
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerText}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.navy },
  scroll:      { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  header:      { alignItems: 'center', marginBottom: Spacing.xxl },
  logoBox:     { width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(0,137,123,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  appName:     { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.white, letterSpacing: 0.5 },
  subtitle:    { fontSize: FontSize.sm, color: Colors.tealLight, marginTop: 4 },
  card:        { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl, ...Shadow.lg },
  cardTitle:   { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  cardSub:     { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.xl },
  label:       { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  input:       { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.lg, backgroundColor: Colors.bg },
  passRow:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.bg, marginBottom: Spacing.sm },
  eyeBtn:      { padding: Spacing.md },
  forgotBtn:   { alignSelf: 'flex-end', marginBottom: Spacing.xl },
  forgotText:  { fontSize: FontSize.sm, color: Colors.teal, fontWeight: '600' },
  loginBtn:    { backgroundColor: Colors.teal, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginBottom: Spacing.lg },
  loginBtnText:{ fontSize: FontSize.base, fontWeight: '700', color: Colors.white, letterSpacing: 0.3 },
  dividerRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  divider:     { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: Spacing.md, color: Colors.textMuted, fontSize: FontSize.sm },
  registerBtn: { borderWidth: 1.5, borderColor: Colors.teal, borderRadius: Radius.md, paddingVertical: 13, alignItems: 'center' },
  registerText:{ fontSize: FontSize.base, fontWeight: '600', color: Colors.teal },
});
