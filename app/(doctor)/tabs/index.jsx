import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useAlertStore } from '../../../store/alertStore';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';
import { fromNow, initials } from '../../../lib/utils';

const MOCK_ALERTS = [
  { id: '1', patientId: '1', patientName: 'Rahul Sharma', severity: 'critical', type: 'high_glucose',   message: 'Glucose critically high: 320 mg/dL',      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),    acknowledged: false },
  { id: '2', patientId: '2', patientName: 'Priya Mehta',  severity: 'critical', type: 'low_glucose',    message: 'Glucose critically low: 58 mg/dL',        timestamp: new Date(Date.now() - 8 * 60000).toISOString(),     acknowledged: false },
  { id: '3', patientId: '3', patientName: 'Ankit Verma',  severity: 'warning',  type: 'missed_dose',    message: 'Missed insulin dose — 2 h overdue',       timestamp: new Date(Date.now() - 90 * 60000).toISOString(),    acknowledged: true  },
  { id: '4', patientId: '4', patientName: 'Sana Khan',    severity: 'warning',  type: 'high_glucose',   message: 'Glucose elevated: 240 mg/dL after dinner', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),   acknowledged: true  },
];

const MOCK_PATIENTS = [
  { id: '1', name: 'Rahul Sharma',  age: 28, lastReading: 320, lastReadingTime: new Date(Date.now() - 15 * 60000).toISOString(),      status: 'critical', trend: 'up'     },
  { id: '2', name: 'Priya Mehta',   age: 34, lastReading: 58,  lastReadingTime: new Date(Date.now() - 8 * 60000).toISOString(),       status: 'critical', trend: 'down'   },
  { id: '3', name: 'Ankit Verma',   age: 52, lastReading: 145, lastReadingTime: new Date(Date.now() - 45 * 60000).toISOString(),      status: 'normal',   trend: 'stable' },
  { id: '4', name: 'Sana Khan',     age: 22, lastReading: 240, lastReadingTime: new Date(Date.now() - 2 * 3600000).toISOString(),     status: 'warning',  trend: 'up'     },
  { id: '5', name: 'Dev Patel',     age: 61, lastReading: 112, lastReadingTime: new Date(Date.now() - 30 * 60000).toISOString(),      status: 'normal',   trend: 'stable' },
  { id: '6', name: 'Neha Singh',    age: 19, lastReading: 89,  lastReadingTime: new Date(Date.now() - 3 * 3600000).toISOString(),     status: 'normal',   trend: 'stable' },
  { id: '7', name: 'Arun Kapoor',   age: 57, lastReading: 195, lastReadingTime: new Date(Date.now() - 1 * 3600000).toISOString(),     status: 'warning',  trend: 'up'     },
];

const statusColor = (s) => ({
  critical: Colors.critical,
  warning: Colors.warning ?? Colors.amber,
  normal: Colors.inRange,
}[s] ?? Colors.textMuted);

const trendIcon = (t) => ({
  up: 'trending-up',
  down: 'trending-down',
  stable: 'remove',
}[t] ?? 'remove');

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const { alerts, setAlerts, unreadCount } = useAlertStore();
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState(MOCK_PATIENTS);

  useEffect(() => {
    setAlerts(MOCK_ALERTS);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setAlerts(MOCK_ALERTS);
      setPatients(MOCK_PATIENTS);
      setRefreshing(false);
    }, 1000);
  }, []);

  const critical = patients.filter((p) => p.status === 'critical').length;
  const warning = patients.filter((p) => p.status === 'warning').length;
  const stable = patients.filter((p) => p.status === 'normal').length;
  const unread = unreadCount;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.name}>{user?.name ?? 'Doctor'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(doctor)/profile')} style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.name ?? 'Dr')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stat cards */}
        <View style={styles.statRow}>
          <StatCard value={patients.length} label="Total Patients" color={Colors.teal} />
          <StatCard value={critical} label="Critical" color={Colors.critical} />
          <StatCard value={warning} label="Warning" color={Colors.warning ?? Colors.amber} />
          <StatCard value={stable} label="Stable" color={Colors.inRange} />
        </View>

        {/* Patient status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Patient Status</Text>
            <TouchableOpacity onPress={() => router.push('/(doctor)/tabs/patients')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {patients.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.patientCard}
              onPress={() => router.push({ pathname: '/(doctor)/patient/[id]', params: { id: p.id } })}
            >
              <View style={[styles.patientAvatar, { backgroundColor: statusColor(p.status) + '22' }]}>
                <Text style={[styles.patientAvatarText, { color: statusColor(p.status) }]}>
                  {initials(p.name)}
                </Text>
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{p.name}</Text>
                <Text style={styles.patientSub}>Age {p.age} · {fromNow(p.lastReadingTime)}</Text>
              </View>
              <View style={styles.patientRight}>
                <Text style={[styles.patientReading, { color: statusColor(p.status) }]}>
                  {p.lastReading}
                </Text>
                <Text style={styles.patientUnit}>mg/dL</Text>
              </View>
              <Ionicons name={trendIcon(p.trend)} size={18} color={statusColor(p.status)} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            <TouchableOpacity onPress={() => router.push('/(doctor)/tabs/alerts')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {MOCK_ALERTS.slice(0, 3).map((a) => (
            <View key={a.id} style={[styles.alertCard, !a.read && styles.alertUnread]}>
              <Ionicons
                name={a.type === 'critical' ? 'warning' : 'alert-circle'}
                size={20}
                color={a.type === 'critical' ? Colors.critical : Colors.warning ?? Colors.amber}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.alertName}>{a.patientName}</Text>
                <Text style={styles.alertMsg}>{a.message}</Text>
              </View>
              <Text style={styles.alertTime}>{fromNow(a.timestamp)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ value, label, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.navy,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { color: Colors.tealLight ?? Colors.teal, fontSize: FontSize.sm },
  name: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '700', marginTop: 2 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.teal,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
  scroll: { padding: Spacing.md, paddingBottom: 40 },

  statRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: Radius.md, padding: Spacing.sm,
    alignItems: 'center', borderTopWidth: 3,
    ...Shadow.sm,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: '800' },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },

  section: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  seeAll: { fontSize: FontSize.sm, color: Colors.teal, fontWeight: '600' },

  patientCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.sm, ...Shadow.sm,
  },
  patientAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  patientAvatarText: { fontWeight: '700', fontSize: FontSize.md },
  patientInfo: { flex: 1 },
  patientName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  patientSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  patientRight: { alignItems: 'flex-end' },
  patientReading: { fontSize: FontSize.lg, fontWeight: '700' },
  patientUnit: { fontSize: 10, color: Colors.textMuted },

  alertCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.sm, ...Shadow.sm,
  },
  alertUnread: { borderLeftWidth: 3, borderLeftColor: Colors.critical },
  alertName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  alertMsg: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  alertTime: { fontSize: 10, color: Colors.textMuted, marginLeft: 8 },
});