import { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useAlertStore } from '../../../store/alertStore';
import { connectSocket } from '../../../lib/socket';
import { patientApi, alertsApi } from '../../../lib/api';
import { fromNow, glucoseStatus } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

function StatCard({ icon, label, value, color, sub }) {
  return (
    <View style={[styles.statCard, Shadow.sm]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function AlertRow({ alert }) {
  const { acknowledge } = useAlertStore();
  const colors = { critical: Colors.critical, warning: Colors.warning, info: Colors.info };
  const color = colors[alert.severity] || Colors.info;
  return (
    <View style={[styles.alertRow, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.alertPatient}>{alert.patientName}</Text>
        <Text style={styles.alertMsg}>{alert.message}</Text>
        <Text style={styles.alertTime}>{fromNow(alert.timestamp)}</Text>
      </View>
      {!alert.acknowledged && (
        <TouchableOpacity
          style={[styles.ackBtn, { borderColor: color }]}
          onPress={() => acknowledge(alert.id)}
        >
          <Text style={[styles.ackText, { color }]}>Ack</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const { alerts, setAlerts, unreadCount } = useAlertStore();
  const router = useRouter();

  // Connect socket for real-time alerts
  useEffect(() => {
    if (user?.hospitalId) connectSocket(user.hospitalId);
  }, [user]);

  const { data: patients, refetch: refetchPatients, isRefetching } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => { const { data } = await patientApi.getAll(); return data.data; },
    staleTime: 5 * 60 * 1000,
  });

  const { data: alertsData, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await alertsApi.getAll({ limit: 10 });
      setAlerts(data.data);
      return data.data;
    },
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const activePatients = patients?.length ?? 0;
  const inRangeCount  = patients?.filter(p => {
    const g = p.lastGlucose;
    return g >= 70 && g <= 180;
  }).length ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetchPatients(); refetchAlerts(); }} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.docName}>{user?.name ?? 'Doctor'}</Text>
          <Text style={styles.dept}>{user?.department ?? 'Endocrinology · PGI'}</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn}>
          <Text style={styles.avatarText}>{(user?.name ?? 'D').charAt(0)}</Text>
        </TouchableOpacity>
      </View>

      {/* Critical alert banner */}
      {criticalCount > 0 && (
        <TouchableOpacity style={styles.criticalBanner} onPress={() => router.push('/(doctor)/tabs/alerts')}>
          <Ionicons name="warning" size={18} color={Colors.white} />
          <Text style={styles.criticalBannerText}>
            {criticalCount} critical alert{criticalCount > 1 ? 's' : ''} need attention
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* Stat cards */}
      <View style={styles.statsGrid}>
        <StatCard icon="people"          label="Total Patients"  value={activePatients}               color={Colors.teal}     />
        <StatCard icon="warning"         label="Unread Alerts"  value={unreadCount}                  color={Colors.critical} />
        <StatCard icon="checkmark-circle" label="In Range"       value={`${inRangeCount}/${activePatients}`} color={Colors.inRange}  />
        <StatCard icon="calendar"        label="Today's Visits" value="4"                            color={Colors.amber}    />
      </View>

      {/* Recent alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          <TouchableOpacity onPress={() => router.push('/(doctor)/tabs/alerts')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {alerts.slice(0, 5).map(a => <AlertRow key={a.id} alert={a} />)}
        {alerts.length === 0 && (
          <Text style={styles.emptyText}>No alerts right now 🎉</Text>
        )}
      </View>

      {/* Quick action buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: 'people-outline',   label: 'Patients',     route: '/(doctor)/tabs/patients'     },
            { icon: 'pulse-outline',    label: 'Glucose',      route: '/(doctor)/tabs/glucose'      },
            { icon: 'calendar-outline', label: 'Schedule',     route: '/(doctor)/tabs/appointments' },
            { icon: 'bar-chart-outline', label: 'Reports',     route: '/(doctor)/tabs/reports'      },
          ].map(a => (
            <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => router.push(a.route)}>
              <Ionicons name={a.icon} size={24} color={Colors.teal} />
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  header:         { backgroundColor: Colors.navy, padding: Spacing.xl, paddingTop: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting:       { fontSize: FontSize.sm, color: Colors.tealLight },
  docName:        { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white, marginTop: 2 },
  dept:           { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  avatarBtn:      { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },
  avatarText:     { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
  criticalBanner: { margin: Spacing.lg, backgroundColor: Colors.critical, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  criticalBannerText: { flex: 1, color: Colors.white, fontWeight: '600', fontSize: FontSize.sm },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.lg, gap: Spacing.md },
  statCard:       { flex: 1, minWidth: '45%', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg },
  statIcon:       { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  statValue:      { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  statLabel:      { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statSub:        { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  section:        { marginHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle:   { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  seeAll:         { fontSize: FontSize.sm, color: Colors.teal, fontWeight: '600' },
  alertRow:       { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', ...Shadow.sm },
  alertPatient:   { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  alertMsg:       { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  alertTime:      { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  ackBtn:         { borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  ackText:        { fontSize: FontSize.xs, fontWeight: '700' },
  emptyText:      { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.sm, paddingVertical: Spacing.xl },
  actionsGrid:    { flexDirection: 'row', gap: Spacing.md },
  actionBtn:      { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, ...Shadow.sm },
  actionLabel:    { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
});
