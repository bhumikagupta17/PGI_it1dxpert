import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../constants/theme';

function SettingRow({ icon, iconColor, label, sub, onPress, right, danger }) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: (iconColor ?? Colors.teal) + '18' }]}>
        <Ionicons name={icon} size={18} color={iconColor ?? Colors.teal} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, danger && { color: Colors.critical }]}>{label}</Text>
        {sub && <Text style={styles.settingSub}>{sub}</Text>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />)}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [notifCritical, setNotifCritical]   = useState(true);
  const [notifWarning,  setNotifWarning]    = useState(true);
  const [notifMessages, setNotifMessages]   = useState(true);
  const [notifReports,  setNotifReports]    = useState(false);
  const [biometric,     setBiometric]       = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const initial = (user?.name ?? 'D').charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initial}</Text>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{user?.name ?? 'Doctor'}</Text>
          <Text style={styles.profileRole}>Endocrinologist</Text>
          <View style={styles.profileBadgeRow}>
            <View style={styles.profileBadge}>
              <Ionicons name="business" size={12} color={Colors.tealLight} />
              <Text style={styles.profileBadgeText}>PGI Chandigarh</Text>
            </View>
            <View style={styles.profileBadge}>
              <Ionicons name="mail" size={12} color={Colors.tealLight} />
              <Text style={styles.profileBadgeText}>{user?.email ?? ''}</Text>
            </View>
          </View>
        </View>

        {/* Stats strip */}
        <View style={[styles.statsStrip, Shadow.sm]}>
          {[
            { label: 'Patients',    value: '7',   icon: 'people'      },
            { label: 'Alerts Today', value: '4',  icon: 'warning'     },
            { label: 'Appts Today', value: '5',   icon: 'calendar'    },
          ].map(s => (
            <View key={s.label} style={styles.stripItem}>
              <Ionicons name={s.icon} size={18} color={Colors.teal} />
              <Text style={styles.stripValue}>{s.value}</Text>
              <Text style={styles.stripLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Account */}
        <SectionHeader title="Account" />
        <View style={[styles.section, Shadow.sm]}>
          <SettingRow
            icon="person-outline"
            label="Edit Profile"
            sub="Name, specialisation, contact"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="lock-closed-outline"
            label="Change Password"
            sub="Last changed 60 days ago"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="finger-print"
            iconColor={Colors.amber}
            label="Biometric Login"
            sub="Use fingerprint or face ID"
            right={
              <Switch
                value={biometric}
                onValueChange={setBiometric}
                trackColor={{ false: Colors.border, true: Colors.teal + '80' }}
                thumbColor={biometric ? Colors.teal : Colors.textMuted}
              />
            }
          />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={[styles.section, Shadow.sm]}>
          <SettingRow
            icon="warning"
            iconColor={Colors.critical}
            label="Critical Alerts"
            sub="Always notified for critical glucose levels"
            right={
              <Switch
                value={notifCritical}
                onValueChange={setNotifCritical}
                trackColor={{ false: Colors.border, true: Colors.teal + '80' }}
                thumbColor={notifCritical ? Colors.teal : Colors.textMuted}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="alert-circle"
            iconColor={Colors.warning}
            label="Warning Alerts"
            sub="Missed doses, elevated readings"
            right={
              <Switch
                value={notifWarning}
                onValueChange={setNotifWarning}
                trackColor={{ false: Colors.border, true: Colors.teal + '80' }}
                thumbColor={notifWarning ? Colors.teal : Colors.textMuted}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="chatbubble-ellipses"
            iconColor={Colors.info}
            label="Patient Messages"
            sub="New messages from patients"
            right={
              <Switch
                value={notifMessages}
                onValueChange={setNotifMessages}
                trackColor={{ false: Colors.border, true: Colors.teal + '80' }}
                thumbColor={notifMessages ? Colors.teal : Colors.textMuted}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="bar-chart"
            iconColor={Colors.navy}
            label="Weekly Reports"
            sub="Auto-generated glucose summaries"
            right={
              <Switch
                value={notifReports}
                onValueChange={setNotifReports}
                trackColor={{ false: Colors.border, true: Colors.teal + '80' }}
                thumbColor={notifReports ? Colors.teal : Colors.textMuted}
              />
            }
          />
        </View>

        {/* Hospital */}
        <SectionHeader title="Hospital" />
        <View style={[styles.section, Shadow.sm]}>
          <SettingRow
            icon="business-outline"
            label="PGI Chandigarh"
            sub={`Hospital ID: ${user?.hospitalId ?? 'PGI001'}`}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="people-outline"
            label="Care Team"
            sub="Manage nurses and co-consultants"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="share-outline"
            iconColor={Colors.amber}
            label="Share Report Link"
            sub="Invite patient to the app"
            onPress={() => {}}
          />
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={[styles.section, Shadow.sm]}>
          <SettingRow
            icon="information-circle-outline"
            label="App Version"
            sub="iT1DXpert v1.0.0 — PGI Edition"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="help-circle-outline"
            iconColor={Colors.info}
            label="Help & Support"
            onPress={() => {}}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.critical} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: Colors.bg },

  header:             { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn:            {},
  headerTitle:        { fontSize: FontSize.base, fontWeight: '700', color: Colors.white },

  profileCard:        { backgroundColor: Colors.navy, alignItems: 'center', paddingBottom: Spacing.xxl, paddingTop: Spacing.lg },
  avatarWrap:         { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)', marginBottom: Spacing.md },
  avatarText:         { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },
  editAvatarBtn:      { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.tealLight, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.navy },
  profileName:        { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  profileRole:        { fontSize: FontSize.sm, color: Colors.tealLight, marginTop: 2 },
  profileBadgeRow:    { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  profileBadge:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 5 },
  profileBadgeText:   { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },

  statsStrip:         { flexDirection: 'row', backgroundColor: Colors.white, marginHorizontal: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.lg, justifyContent: 'space-around', marginTop: -Spacing.lg, marginBottom: Spacing.xl },
  stripItem:          { alignItems: 'center', gap: 4 },
  stripValue:         { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  stripLabel:         { fontSize: FontSize.xs, color: Colors.textMuted },

  sectionHeader:      { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  section:            { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.md, overflow: 'hidden' },

  settingRow:         { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  settingIcon:        { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  settingLabel:       { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary },
  settingSub:         { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  divider:            { height: 1, backgroundColor: Colors.border, marginLeft: 52 + Spacing.md * 2 },

  logoutBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderWidth: 1.5, borderColor: Colors.critical + '60', borderRadius: Radius.md, paddingVertical: 14 },
  logoutText:         { fontSize: FontSize.base, fontWeight: '700', color: Colors.critical },
});
