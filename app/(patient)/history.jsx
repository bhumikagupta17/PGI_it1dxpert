import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

// ── Mock data ─────────────────────────────────────────────────
const now = Date.now();
const min = 60_000;
const hr  = 3_600_000;

const ALL_READINGS = [
  { id: '1',  value: 112, timestamp: new Date(now - 1 * hr).toISOString(),  note: 'Before breakfast' },
  { id: '2',  value: 178, timestamp: new Date(now - 3 * hr).toISOString(),  note: 'After lunch' },
  { id: '3',  value: 95,  timestamp: new Date(now - 6 * hr).toISOString(),  note: '' },
  { id: '4',  value: 220, timestamp: new Date(now - 9 * hr).toISOString(),  note: 'After dinner' },
  { id: '5',  value: 68,  timestamp: new Date(now - 12 * hr).toISOString(), note: 'Feeling low' },
  { id: '6',  value: 134, timestamp: new Date(now - 15 * hr).toISOString(), note: '' },
  { id: '7',  value: 101, timestamp: new Date(now - 20 * hr).toISOString(), note: 'Morning' },
  { id: '8',  value: 155, timestamp: new Date(now - 26 * hr).toISOString(), note: 'Post meal' },
  { id: '9',  value: 88,  timestamp: new Date(now - 30 * hr).toISOString(), note: '' },
  { id: '10', value: 199, timestamp: new Date(now - 36 * hr).toISOString(), note: 'Skipped insulin' },
  { id: '11', value: 72,  timestamp: new Date(now - 42 * hr).toISOString(), note: '' },
  { id: '12', value: 118, timestamp: new Date(now - 48 * hr).toISOString(), note: 'Morning' },
  { id: '13', value: 145, timestamp: new Date(now - 54 * hr).toISOString(), note: 'After snack' },
  { id: '14', value: 62,  timestamp: new Date(now - 60 * hr).toISOString(), note: 'Before bed' },
  { id: '15', value: 130, timestamp: new Date(now - 66 * hr).toISOString(), note: '' },
  { id: '16', value: 167, timestamp: new Date(now - 72 * hr).toISOString(), note: 'Post lunch' },
  { id: '17', value: 109, timestamp: new Date(now - 80 * hr).toISOString(), note: '' },
  { id: '18', value: 240, timestamp: new Date(now - 90 * hr).toISOString(), note: 'High — stress' },
  { id: '19', value: 93,  timestamp: new Date(now - 100 * hr).toISOString(), note: '' },
  { id: '20', value: 121, timestamp: new Date(now - 110 * hr).toISOString(), note: 'Morning' },
];

const PERIODS = [
  { key: '1d', label: 'Today',  hours: 24 },
  { key: '7d', label: '7 Days', hours: 168 },
  { key: '30d', label: '30 Days', hours: 720 },
];

// ── Helpers ───────────────────────────────────────────────────
const glucoseStatus = (v) => {
  if (v < 70)  return { label: 'Low',      color: Colors.critical };
  if (v <= 180) return { label: 'In Range', color: Colors.inRange  };
  return              { label: 'High',     color: Colors.warning  };
};

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const calcStats = (readings) => {
  if (!readings.length) return { avg: 0, high: 0, low: 0, inRange: 0 };
  const vals = readings.map(r => r.value);
  const avg  = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  const high = Math.max(...vals);
  const low  = Math.min(...vals);
  const inRange = Math.round(
    (vals.filter(v => v >= 70 && v <= 180).length / vals.length) * 100
  );
  return { avg, high, low, inRange };
};

// ── Mini sparkline (SVG-free, bar based) ──────────────────────
const Sparkline = ({ readings }) => {
  if (readings.length < 2) return null;
  const vals   = readings.map(r => r.value).reverse(); // oldest → newest
  const minV   = Math.min(...vals);
  const maxV   = Math.max(...vals);
  const range  = maxV - minV || 1;
  const W      = 280;
  const H      = 48;
  const barW   = Math.max(3, Math.floor(W / vals.length) - 1);

  return (
    <View style={styles.sparkWrap}>
      {vals.map((v, i) => {
        const pct    = (v - minV) / range;
        const barH   = Math.max(4, Math.round(pct * (H - 8)) + 4);
        const status = glucoseStatus(v);
        return (
          <View
            key={i}
            style={[styles.bar, { width: barW, height: barH, backgroundColor: status.color }]}
          />
        );
      })}
    </View>
  );
};

// ── Reading row ───────────────────────────────────────────────
const ReadingRow = ({ item }) => {
  const { label, color } = glucoseStatus(item.value);
  return (
    <View style={styles.row}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <View style={styles.rowLeft}>
        <Text style={styles.rowTime}>{formatTime(item.timestamp)}</Text>
        {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, { color }]}>{item.value}</Text>
        <Text style={styles.rowUnit}>mg/dL</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: color + '22' }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────
export default function HistoryScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(false);

  const cutoff = Date.now() - (PERIODS.find(p => p.key === period)?.hours ?? 168) * 3_600_000;
  const readings = ALL_READINGS.filter(r => new Date(r.timestamp).getTime() >= cutoff);
  const stats    = calcStats(readings);

  const handlePeriod = (key) => {
    if (key === period) return;
    setLoading(true);
    setTimeout(() => { setPeriod(key); setLoading(false); }, 400);
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Glucose History</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Period filter */}
        <View style={styles.pillRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.pill, period === p.key && styles.pillActive]}
              onPress={() => handlePeriod(p.key)}
            >
              <Text style={[styles.pillText, period === p.key && styles.pillTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.teal} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Sparkline */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Trend</Text>
              {readings.length >= 2
                ? <Sparkline readings={readings} />
                : <Text style={styles.empty}>Not enough data</Text>}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.inRange }]} />
                  <Text style={styles.legendText}>In Range</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                  <Text style={styles.legendText}>High</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.critical }]} />
                  <Text style={styles.legendText}>Low</Text>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { label: 'Average',    value: stats.avg,     unit: 'mg/dL' },
                { label: 'Highest',    value: stats.high,    unit: 'mg/dL' },
                { label: 'Lowest',     value: stats.low,     unit: 'mg/dL' },
                { label: 'In Range',   value: stats.inRange, unit: '%'     },
              ].map(s => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={styles.statValue}>{readings.length ? s.value : '—'}</Text>
                  <Text style={styles.statUnit}>{s.unit}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Readings list */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Readings ({readings.length})
              </Text>
              {readings.length === 0 ? (
                <Text style={styles.empty}>No readings in this period</Text>
              ) : (
                readings.map(r => <ReadingRow key={r.id} item={r} />)
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.sm,
                 backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textPrimary },
  body:        { padding: Spacing.md, paddingBottom: 40 },

  pillRow:     { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  pill:        { flex: 1, paddingVertical: 8, borderRadius: Radius.md,
                 backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
                 alignItems: 'center' },
  pillActive:  { backgroundColor: Colors.teal, borderColor: Colors.teal },
  pillText:    { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  pillTextActive: { color: Colors.white },

  card:        { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md,
                 marginBottom: Spacing.md, ...Shadow.sm },
  cardTitle:   { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary,
                 marginBottom: Spacing.sm },

  sparkWrap:   { flexDirection: 'row', alignItems: 'flex-end', height: 48, gap: 2,
                 marginBottom: Spacing.sm },
  bar:         { borderRadius: 2 },

  legend:      { flexDirection: 'row', gap: Spacing.md, marginTop: 4 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendText:  { fontSize: FontSize.xs, color: Colors.textSecondary },

  statsRow:    { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard:    { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.md,
                 padding: Spacing.sm, alignItems: 'center', ...Shadow.sm },
  statValue:   { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  statUnit:    { fontSize: FontSize.xs, color: Colors.textMuted },
  statLabel:   { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  row:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
                 borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  rowLeft:     { flex: 1 },
  rowTime:     { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  rowNote:     { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  rowRight:    { alignItems: 'flex-end', marginRight: 4 },
  rowValue:    { fontSize: FontSize.md, fontWeight: '700' },
  rowUnit:     { fontSize: FontSize.xs, color: Colors.textMuted },
  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  badgeText:   { fontSize: FontSize.xs, fontWeight: '600' },
  empty:       { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center',
                 paddingVertical: Spacing.md },
});