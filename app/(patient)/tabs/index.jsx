import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { glucoseApi } from '../../../lib/api';
import { glucoseStatus, calcGMI, formatTime, fromNow } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

function GlucoseGauge({ value, low = 70, high = 180 }) {
  const status = glucoseStatus(value, low, high);
  return (
    <View style={[styles.gauge, { borderColor: status.color }]}>
      <Text style={[styles.gaugeValue, { color: status.color }]}>{value ?? '—'}</Text>
      <Text style={styles.gaugeUnit}>mg/dL</Text>
      <View style={[styles.gaugeBadge, { backgroundColor: status.color + '20' }]}>
        <Text style={[styles.gaugeBadgeText, { color: status.color }]}>{status.label}</Text>
      </View>
    </View>
  );
}

function ReadingRow({ reading }) {
  const status = glucoseStatus(reading.value);
  return (
    <View style={styles.readingRow}>
      <View style={[styles.readingDot, { backgroundColor: status.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.readingVal}>{reading.value} mg/dL</Text>
        <Text style={styles.readingTime}>{formatTime(reading.timestamp)} · {reading.mealContext?.replace(/_/g, ' ')}</Text>
      </View>
      <Text style={[styles.readingStatus, { color: status.color }]}>{status.label}</Text>
    </View>
  );
}

export default function PatientHome() {
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: readings, isRefetching, refetch } = useQuery({
    queryKey: ['glucose', user?.id],
    queryFn: async () => { const { data } = await glucoseApi.getReadings(user.id); return data.data; },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: stats } = useQuery({
    queryKey: ['glucose-stats', user?.id, 14],
    queryFn: async () => { const { data } = await glucoseApi.getStats(user.id, 14); return data.data; },
    enabled: !!user?.id,
  });

  const latest = readings?.[0];
  const recent = readings?.slice(0, 6) ?? [];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>{user?.name ?? 'Patient'}</Text>
          <Text style={styles.date}>{new Date().toDateString()}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Current glucose */}
      <View style={styles.gaugeCard}>
        <Text style={styles.gaugeLabel}>Current Glucose</Text>
        {latest
          ? <GlucoseGauge value={latest.value} low={user?.targetGlucoseLow} high={user?.targetGlucoseHigh} />
          : <Text style={styles.noReading}>No reading yet today</Text>}
        {latest && <Text style={styles.lastUpdate}>Updated {fromNow(latest.timestamp)}</Text>}

        <TouchableOpacity style={styles.logBtn} onPress={() => router.push('/(patient)/tabs/log')}>
          <Ionicons name="add" size={18} color={Colors.white} />
          <Text style={styles.logBtnText}>Log Reading</Text>
        </TouchableOpacity>
      </View>

      {/* 14-day stats */}
      {stats && (
        <View style={styles.statsRow}>
          {[
            { label: '14d Avg',   value: `${stats.average} mg/dL`, color: Colors.textPrimary },
            { label: 'GMI',       value: `${calcGMI(stats.average)}%`, color: Colors.teal   },
            { label: 'TIR',       value: `${stats.timeInRange}%`,   color: Colors.inRange   },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, Shadow.sm]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* TIR bar */}
      {stats && (
        <View style={[styles.tirCard, Shadow.sm]}>
          <Text style={styles.tirTitle}>Time In Range (14 days)</Text>
          <View style={styles.tirBar}>
            <View style={[styles.tirSeg, { flex: stats.timeLow,     backgroundColor: Colors.low     }]} />
            <View style={[styles.tirSeg, { flex: stats.timeInRange,  backgroundColor: Colors.inRange }]} />
            <View style={[styles.tirSeg, { flex: stats.timeHigh,     backgroundColor: Colors.high    }]} />
          </View>
          <View style={styles.tirLegend}>
            <Text style={[styles.tirLbl, { color: Colors.low }]}>Low {stats.timeLow}%</Text>
            <Text style={[styles.tirLbl, { color: Colors.inRange }]}>In Range {stats.timeInRange}%</Text>
            <Text style={[styles.tirLbl, { color: Colors.high }]}>High {stats.timeHigh}%</Text>
          </View>
        </View>
      )}

      {/* Recent readings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Readings</Text>
          <TouchableOpacity onPress={() => router.push('/(patient)/tabs/trends')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {recent.map(r => <ReadingRow key={r.id} reading={r} />)}
        {recent.length === 0 && <Text style={styles.empty}>No readings logged yet</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.bg },
  header:        { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl, flexDirection: 'row', justifyContent: 'space-between' },
  greeting:      { fontSize: FontSize.sm, color: Colors.tealLight },
  name:          { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white, marginTop: 2 },
  date:          { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  notifBtn:      { marginTop: 4 },
  gaugeCard:     { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, marginTop: -Spacing.xl, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', ...Shadow.lg },
  gaugeLabel:    { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600', marginBottom: Spacing.lg },
  gauge:         { width: 140, height: 140, borderRadius: 70, borderWidth: 6, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  gaugeValue:    { fontSize: FontSize.hero, fontWeight: '800' },
  gaugeUnit:     { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: -4 },
  gaugeBadge:    { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full, marginTop: Spacing.sm },
  gaugeBadgeText:{ fontSize: FontSize.sm, fontWeight: '700' },
  lastUpdate:    { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.lg },
  noReading:     { fontSize: FontSize.base, color: Colors.textMuted, marginBottom: Spacing.xl },
  logBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.teal, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: 12 },
  logBtnText:    { fontSize: FontSize.base, fontWeight: '700', color: Colors.white },
  statsRow:      { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginTop: Spacing.lg, gap: Spacing.md },
  statCard:      { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  statValue:     { fontSize: FontSize.md, fontWeight: '700' },
  statLabel:     { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  tirCard:       { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: Radius.md, padding: Spacing.md },
  tirTitle:      { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, marginBottom: Spacing.sm },
  tirBar:        { flexDirection: 'row', height: 12, borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.sm },
  tirSeg:        { height: '100%' },
  tirLegend:     { flexDirection: 'row', justifyContent: 'space-between' },
  tirLbl:        { fontSize: FontSize.xs, fontWeight: '600' },
  section:       { marginHorizontal: Spacing.lg, marginTop: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  seeAll:        { fontSize: FontSize.sm, color: Colors.teal, fontWeight: '600' },
  readingRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md, ...Shadow.sm },
  readingDot:    { width: 10, height: 10, borderRadius: 5 },
  readingVal:    { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  readingTime:   { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  readingStatus: { fontSize: FontSize.xs, fontWeight: '700' },
  empty:         { textAlign: 'center', color: Colors.textMuted, paddingVertical: Spacing.xl },
});
