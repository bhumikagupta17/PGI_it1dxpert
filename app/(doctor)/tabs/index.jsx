import { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useAlertStore } from '../../../store/alertStore';
import { connectSocket } from '../../../lib/socket';
import { fromNow } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

// Mock data for development
const MOCK_ALERTS = [
  { id: '1', patientName: 'Rahul Sharma', message: 'Glucose critically high: 320 mg/dL', severity: 'critical', timestamp: new Date(Date.now() - 8 * 60000).toISOString(), acknowledged: false },
  { id: '2', patientName: 'Priya Mehta', message: 'Glucose low: 58 mg/dL — take action', severity: 'critical', timestamp: new Date(Date.now() - 22 * 60000).toISOString(), acknowledged: false },
  { id: '3', patientName: 'Ankit Verma', message: 'Missed bedtime insulin dose', severity: 'warning', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), acknowledged: false },
  { id: '4', patientName: 'Sana Khan', message: 'Post-meal glucose elevated: 240 mg/dL', severity: 'warning', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), acknowledged: true },
];

const MOCK_PATIENTS = [
  { id: '1', name: 'Rahul Sharma', lastGlucose: 320, diabetesType: 'T1D' },
  { id: '2', name: 'Priya Mehta', lastGlucose: 58, diabetesType: 'T1D' },
  { id: '3', name: 'Ankit Verma', lastGlucose: 145, diabetesType: 'T2D' },
  { id: '4', name: 'Sana Khan', lastGlucose: 240, diabetesType: 'T1D' },
  { id: '5', name: 'Dev Patel', lastGlucose: 112, diabetesType: 'T2D' },
];

function StatCard({ icon, label, value, color, sub }) {
  return (
    <View style={[styles.statCard, Shadow.sm]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function AlertRow({ alert, onAck }) {
  const severityConfig = {
    critical: { color: Colors.critical, icon: 'warning',        bg: '#FEF2F2' },
    warning:  { color: Colors.warning,  icon: 'alert-circle',   bg: '#FFFBEB' },
    info:     { color: Colors.teal,     icon: 'information-circle', bg: '#F0FDFA' },
  };
  const cfg = severityConfig[alert.severity] || severityConfig.info;

  return (
    <View style={[styles.alertRow, { backgroundColor: cfg.bg, borderLeftColor: cfg.color }]}>
      <View style={[styles.alertIconWrap, { backgroundColor: cfg.color + '20' }]}>
        <Ionicons name={cfg.icon} size={18} color={cfg.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.alertPatient}>{alert.patientName}</Text>
        <Text style={styles.alertMsg}>{alert.message}</Text>
        <Text style={styles.alertTime}>{fromNow(alert.timestamp)}</Text>
      </View>
      {!alert.acknowledged && (
        <TouchableOpacity style={[styles.ackBtn, { backgroundColor: cfg.color }]} onPress={() => onAck(alert.id)}>
          <Text style={styles.ackText}>Ack</Text>
        </TouchableOpacity>
      )}
      {alert.acknowledged && (
        <Ionicons name="checkmark-circle" size={20} color={Colors.inRange} />
      )}
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const { alerts, setAlerts, acknowledge, unreadCount } = useAlertStore();
  const router = useRouter();

  useEffect(() => {
    if (user?.hospitalId) connectSocket(user.hospitalId);
    // Load mock alerts
    setAlerts(MOCK_ALERTS);
  }, [user]);

  const patients = MOCK_PATIENTS;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const inRangeCount  = patients.filter(p => p.lastGlucose >= 70 && p.lastGlucose <= 180).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.docName}>{user?.name ?? 'Doctor'}</Text>
            <Text style={styles.dept}>Endocrinology · PGI Chandigarh</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/(doctor)/profile')}>
            <Text style={styles.avatarText}>{(user?.name ?? 'D').charAt(0)}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.6)" />
          <Text style={styles.dateText}>{today}</Text>
        </View>
      </View>

      {/* Critical alert banner */}
      {criticalCount > 0 && (
        <TouchableOpacity style={styles.criticalBanner} onPress={() => router.push('/(doctor)/tabs/alerts')}>
          <View style={styles.criticalIconWrap}>
            <Ionicons name="warning" size={18} color={Colors.white} />
          </View>
          <Text style={styles.criticalBannerText}>
            {criticalCount} critical alert{criticalCount > 1 ? 's' : ''} require immediate attention
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* Stat cards */}
      <View style={styles.statsGrid}>
        <StatCard icon="people"           label="Total Patients"  value={patients.length}                       color={Colors.teal}     />
        <StatCard icon="warning"          label="Critical Alerts" value={criticalCount}                         color={Colors.critical} />
        <StatCard icon="checkmark-circle" label="In Range Today"  value={`${inRangeCount}/${patients.length}`}  color={Colors.inRange}  />
        <StatCard icon="calendar"         label="Today's Visits"  value="4"                                     color={Colors.amber}    />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <QuickAction icon="people-outline"    label="Patients"    color={Colors.teal}     onPress={() => router.push('/(doctor)/tabs/patients')}     />
          <QuickAction icon="pulse-outline"     label="Glucose"     color={Colors.inRange}  onPress={() => router.push('/(doctor)/tabs/glucose')}      />
          <QuickAction icon="calendar-outline"  label="Schedule"    color={Colors.amber}    onPress={() => router.push('/(doctor)/tabs/appointments')} />
          <QuickAction icon="bar-chart-outline" label="Reports"     color={Colors.navy}     onPress={() => router.push('/(doctor)/tabs/reports')}      />
        </View>
      </View>

      {/* Patient glucose summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Patient Status</Text>
          <TouchableOpacity onPress={() => router.push('/(doctor)/tabs/patients')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {patients.slice(0, 4).map(p => {
          const isHigh = p.lastGlucose > 180;
          const isLow  = p.lastGlucose < 70;
          const color  = isLow ? Colors.low : isHigh ? Colors.high : Colors.inRange;
          const status = isLow ? 'Low' : isHigh ? 'High' : 'In Range';
          return (
            <TouchableOpacity key={p.id} style={[styles.patientRow, Shadow.sm]} onPress={() => router.push({ pathname: '/(doctor)/patient/[id]', params: { id: p.id } })}>
              <View style={[styles.patientAvatar, { backgroundColor: color + '20' }]}>
                <Text style={[styles.patientAvatarText, { color }]}>{p.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{p.name}</Text>
                <Text style={styles.patientType}>{p.diabetesType}</Text>
              </View>
              <View style={[styles.glucosePill, { backgroundColor: color + '18' }]}>
                <Text style={[styles.glucoseVal, { color }]}>{p.lastGlucose}</Text>
                <Text style={[styles.glucoseStatus, { color }]}>{status}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Recent Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          <TouchableOpacity onPress={() => router.push('/(doctor)/tabs/alerts')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {alerts.slice(0, 3).map(a => (
          <AlertRow key={a.id} alert={a} onAck={acknowledge} />
        ))}
        {alerts.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={32} color={Colors.inRange} />
            <Text style={styles.emptyText}>No alerts right now 🎉</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: Colors.bg },

  // Header
  header:             { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  headerTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting:           { fontSize: FontSize.sm, color: Colors.tealLight },
  docName:            { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white, marginTop: 2 },
  dept:               { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  avatarBtn:          { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText:         { fontSize: FontSize.lg, fontWeight: '800', color: Colors.white },
  dateRow:            { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.md },
  dateText:           { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)' },

  // Critical banner
  criticalBanner:     { margin: Spacing.lg, marginBottom: 0, backgroundColor: Colors.critical, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  criticalIconWrap:   { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  criticalBannerText: { flex: 1, color: Colors.white, fontWeight: '600', fontSize: FontSize.sm },

  // Stats
  statsGrid:          { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.lg, gap: Spacing.md },
  statCard:           { flex: 1, minWidth: '44%', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg },
  statIconWrap:       { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  statValue:          { fontSize: FontSize.xxl, fontWeight: '800' },
  statLabel:          { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 3, fontWeight: '500' },
  statSub:            { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },

  // Section
  section:            { marginHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle:       { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  seeAll:             { fontSize: FontSize.sm, color: Colors.teal, fontWeight: '600' },

  // Quick actions
  actionsRow:         { flexDirection: 'row', gap: Spacing.sm },
  actionBtn:          { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 8, ...Shadow.sm },
  actionIcon:         { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionLabel:        { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },

  // Patient rows
  patientRow:         { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  patientAvatar:      { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  patientAvatarText:  { fontSize: FontSize.md, fontWeight: '800' },
  patientName:        { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  patientType:        { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  glucosePill:        { alignItems: 'flex-end', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.md },
  glucoseVal:         { fontSize: FontSize.md, fontWeight: '800' },
  glucoseStatus:      { fontSize: FontSize.xs, fontWeight: '600' },

  // Alerts
  alertRow:           { borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderLeftWidth: 3 },
  alertIconWrap:      { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  alertPatient:       { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  alertMsg:           { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  alertTime:          { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  ackBtn:             { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.sm },
  ackText:            { fontSize: FontSize.xs, fontWeight: '700', color: Colors.white },
  emptyCard:          { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm, ...Shadow.sm },
  emptyText:          { color: Colors.textMuted, fontSize: FontSize.sm },
});
