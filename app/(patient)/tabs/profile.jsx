import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { initials } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

function MenuItem({ icon, label, value, onPress, color, destructive }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: (color ?? Colors.teal) + '18' }]}>
        <Ionicons name={icon} size={18} color={color ?? Colors.teal} />
      </View>
      <Text style={[styles.menuLabel, destructive && { color: Colors.critical }]}>{label}</Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () =>
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } },
    ]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Avatar section */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.name ?? 'P')}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Patient'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.typeBadge]}>
          <Text style={styles.typeText}>{user?.diabetesType ?? 'T1D'}</Text>
        </View>
      </View>

      {/* Health info */}
      <View style={styles.infoCard}>
        {[
          { label: 'Target Low',  value: `${user?.targetGlucoseLow  ?? 70} mg/dL`  },
          { label: 'Target High', value: `${user?.targetGlucoseHigh ?? 180} mg/dL` },
          { label: 'Doctor',      value: user?.doctorName ?? '—'                    },
          { label: 'Hospital ID', value: user?.hospitalId ?? '—'                    },
        ].map(row => (
          <View key={row.label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>ACCOUNT</Text>
        <MenuItem icon="person-outline"     label="Edit Profile"        onPress={() => {}} />
        <MenuItem icon="lock-closed-outline" label="Change Password"     onPress={() => {}} />
        <MenuItem icon="notifications-outline" label="Notifications"    onPress={() => {}} />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>HEALTH</Text>
        <MenuItem icon="fitness-outline"    label="Glucose Targets"     value={`${user?.targetGlucoseLow ?? 70}–${user?.targetGlucoseHigh ?? 180}`} onPress={() => {}} />
        <MenuItem icon="medical-outline"    label="Insulin Regimen"     onPress={() => {}} />
        <MenuItem icon="document-text-outline" label="Export My Data"  onPress={() => {}} />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>SUPPORT</Text>
        <MenuItem icon="help-circle-outline" label="Help & FAQ"         onPress={() => {}} />
        <MenuItem icon="chatbubble-outline"  label="Contact Doctor"     onPress={() => router.push('/(patient)/chat')} />
        <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => {}} />
      </View>

      <View style={styles.menuSection}>
        <MenuItem
          icon="log-out-outline"
          label="Log Out"
          onPress={handleLogout}
          color={Colors.critical}
          destructive
        />
      </View>

      <Text style={styles.version}>DiabetesCare v1.0.0 · iT1DXpert · PGI Chandigarh</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: Colors.bg },
  header:            { backgroundColor: Colors.navy, paddingTop: 56, paddingBottom: Spacing.xxl, alignItems: 'center' },
  avatar:            { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  avatarText:        { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },
  name:              { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  email:             { fontSize: FontSize.sm, color: Colors.tealLight, marginTop: 4 },
  typeBadge:         { marginTop: Spacing.sm, backgroundColor: Colors.teal + '30', paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full },
  typeText:          { fontSize: FontSize.sm, color: Colors.tealLight, fontWeight: '700' },
  infoCard:          { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, marginTop: -Spacing.lg, borderRadius: Radius.lg, ...Shadow.md, overflow: 'hidden' },
  infoRow:           { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel:         { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue:         { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  menuSection:       { marginTop: Spacing.xl, marginHorizontal: Spacing.lg },
  menuSectionTitle:  { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.sm },
  menuItem:          { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  menuIcon:          { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel:         { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '500' },
  menuValue:         { fontSize: FontSize.sm, color: Colors.textMuted },
  version:           { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xl },
});
