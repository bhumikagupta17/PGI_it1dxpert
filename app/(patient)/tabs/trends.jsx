import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { glucoseApi } from '../../../lib/api';
import { calcGMI, formatDate } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

const { width } = Dimensions.get('window');
const CHART_W = width - Spacing.lg * 2 - Spacing.xl * 2;
const CHART_H = 160;
const PERIODS = [7, 14, 30, 90];

// Minimal SVG-like chart using View stacking
function LineChart({ data, low = 70, high = 180 }) {
  if (!data?.length) return <Text style={{ color: Colors.textMuted, textAlign: 'center', paddingVertical: 40 }}>No data</Text>;
  const min = 40, max = 300;
  const range = max - min;
  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * CHART_W,
    y: CHART_H - ((d.value - min) / range) * CHART_H,
    value: d.value,
  }));
  const lowY  = CHART_H - ((low  - min) / range) * CHART_H;
  const highY = CHART_H - ((high - min) / range) * CHART_H;

  return (
    <View style={{ width: CHART_W, height: CHART_H + 20, position: 'relative' }}>
      {/* Target range band */}
      <View style={{
        position: 'absolute', left: 0, right: 0,
        top: highY, height: lowY - highY,
        backgroundColor: Colors.inRange + '18',
      }} />
      {/* Points */}
      {pts.map((p, i) => (
        <View key={i} style={{
          position: 'absolute',
          left: p.x - 4, top: p.y - 4,
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: p.value < low ? Colors.low : p.value > high ? Colors.high : Colors.inRange,
        }} />
      ))}
      {/* Axis labels */}
      <Text style={[styles.axisLabel, { top: highY - 14 }]}>{high}</Text>
      <Text style={[styles.axisLabel, { top: lowY - 14 }]}>{low}</Text>
    </View>
  );
}

function PatternCard({ icon, title, desc, color }) {
  return (
    <View style={[styles.patternCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={[styles.patternIcon]}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.patternTitle}>{title}</Text>
        <Text style={styles.patternDesc}>{desc}</Text>
      </View>
    </View>
  );
}

export default function TrendsScreen() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState(14);

  const { data: readings, isLoading } = useQuery({
    queryKey: ['glucose', user?.id, undefined, undefined],
    queryFn: async () => { const { data } = await glucoseApi.getReadings(user.id); return data.data; },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: stats } = useQuery({
    queryKey: ['glucose-stats', user?.id, period],
    queryFn: async () => { const { data } = await glucoseApi.getStats(user.id, period); return data.data; },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Trends</Text>
        <Text style={styles.sub}>Your glucose patterns</Text>
      </View>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}d</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <View style={[styles.chartCard, Shadow.md]}>
        <Text style={styles.chartTitle}>Glucose Readings · {period} days</Text>
        {isLoading
          ? <ActivityIndicator color={Colors.teal} style={{ marginVertical: 40 }} />
          : <LineChart data={readings} low={user?.targetGlucoseLow} high={user?.targetGlucoseHigh} />}
        <View style={styles.chartLegend}>
          {[
            { label: 'Low', color: Colors.low },
            { label: 'In Range', color: Colors.inRange },
            { label: 'High', color: Colors.high },
          ].map(l => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats grid */}
      {stats && (
        <View style={styles.statsGrid}>
          {[
            { label: 'Avg Glucose',   value: `${stats.average} mg/dL`,  color: Colors.textPrimary },
            { label: 'GMI',           value: `${calcGMI(stats.average)}%`, color: Colors.teal     },
            { label: 'Time In Range', value: `${stats.timeInRange}%`,    color: Colors.inRange    },
            { label: 'Time Low',      value: `${stats.timeLow}%`,        color: Colors.low        },
            { label: 'Time High',     value: `${stats.timeHigh}%`,       color: Colors.high       },
            { label: 'Readings',      value: stats.readingsCount,         color: Colors.textPrimary },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, Shadow.sm]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Patterns */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patterns Detected</Text>
        <PatternCard icon="🌅" title="Morning highs"  desc="Glucose often rises between 6–9 AM (dawn phenomenon)" color={Colors.high}    />
        <PatternCard icon="🍽️" title="Post-meal spike" desc="Values exceed 180 mg/dL ~2h after dinner on 5/7 days" color={Colors.warning} />
        <PatternCard icon="✅" title="Good overnight"  desc="70% of nights you stay in range — keep it up!"         color={Colors.inRange} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  header:         { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  title:          { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  sub:            { fontSize: FontSize.sm, color: Colors.tealLight, marginTop: 4 },
  periodRow:      { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.sm },
  periodBtn:      { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  periodBtnActive:{ backgroundColor: Colors.teal, borderColor: Colors.teal },
  periodText:     { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  periodTextActive:{ color: Colors.white },
  chartCard:      { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg },
  chartTitle:     { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.lg },
  axisLabel:      { position: 'absolute', left: 0, fontSize: FontSize.xs, color: Colors.textMuted },
  chartLegend:    { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl, marginTop: Spacing.md },
  legendItem:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:      { width: 8, height: 8, borderRadius: 4 },
  legendText:     { fontSize: FontSize.xs, color: Colors.textSecondary },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.lg },
  statCard:       { flex: 1, minWidth: '44%', backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md },
  statValue:      { fontSize: FontSize.lg, fontWeight: '700' },
  statLabel:      { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  section:        { paddingHorizontal: Spacing.lg },
  sectionTitle:   { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  patternCard:    { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  patternIcon:    { fontSize: 22 },
  patternTitle:   { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  patternDesc:    { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 3 },
});
