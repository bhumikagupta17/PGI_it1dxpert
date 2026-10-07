import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { calcGMI } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

const { width } = Dimensions.get('window');
const CHART_W = width - Spacing.lg * 2 - Spacing.xl * 2;
const CHART_H = 160;
const PERIODS = [7, 14, 30, 90];

// ── Mock readings (90 days worth) ─────────────────────────────
const now = Date.now();
const hr  = 3_600_000;
const DAY = 24 * hr;

const ALL_READINGS = [
  { id: '1',  value: 112, timestamp: new Date(now - 1  * hr).toISOString() },
  { id: '2',  value: 178, timestamp: new Date(now - 4  * hr).toISOString() },
  { id: '3',  value: 95,  timestamp: new Date(now - 8  * hr).toISOString() },
  { id: '4',  value: 220, timestamp: new Date(now - 12 * hr).toISOString() },
  { id: '5',  value: 68,  timestamp: new Date(now - 16 * hr).toISOString() },
  { id: '6',  value: 134, timestamp: new Date(now - 20 * hr).toISOString() },
  { id: '7',  value: 101, timestamp: new Date(now - 1  * DAY).toISOString() },
  { id: '8',  value: 155, timestamp: new Date(now - 1.5* DAY).toISOString() },
  { id: '9',  value: 88,  timestamp: new Date(now - 2  * DAY).toISOString() },
  { id: '10', value: 199, timestamp: new Date(now - 2.5* DAY).toISOString() },
  { id: '11', value: 72,  timestamp: new Date(now - 3  * DAY).toISOString() },
  { id: '12', value: 118, timestamp: new Date(now - 3.5* DAY).toISOString() },
  { id: '13', value: 145, timestamp: new Date(now - 4  * DAY).toISOString() },
  { id: '14', value: 62,  timestamp: new Date(now - 4.5* DAY).toISOString() },
  { id: '15', value: 130, timestamp: new Date(now - 5  * DAY).toISOString() },
  { id: '16', value: 167, timestamp: new Date(now - 5.5* DAY).toISOString() },
  { id: '17', value: 109, timestamp: new Date(now - 6  * DAY).toISOString() },
  { id: '18', value: 240, timestamp: new Date(now - 7  * DAY).toISOString() },
  { id: '19', value: 93,  timestamp: new Date(now - 10 * DAY).toISOString() },
  { id: '20', value: 121, timestamp: new Date(now - 14 * DAY).toISOString() },
  { id: '21', value: 158, timestamp: new Date(now - 20 * DAY).toISOString() },
  { id: '22', value: 77,  timestamp: new Date(now - 25 * DAY).toISOString() },
  { id: '23', value: 205, timestamp: new Date(now - 30 * DAY).toISOString() },
  { id: '24', value: 114, timestamp: new Date(now - 45 * DAY).toISOString() },
  { id: '25', value: 89,  timestamp: new Date(now - 60 * DAY).toISOString() },
  { id: '26', value: 176, timestamp: new Date(now - 75 * DAY).toISOString() },
  { id: '27', value: 133, timestamp: new Date(now - 89 * DAY).toISOString() },
];

// ── Helpers ───────────────────────────────────────────────────
const calcStats = (readings, low = 70, high = 180) => {
  if (!readings.length) return null;
  const vals     = readings.map(r => r.value);
  const average  = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  const inRange  = vals.filter(v => v >= low && v <= high).length;
  const lowCount = vals.filter(v => v < low).length;
  const hiCount  = vals.filter(v => v > high).length;
  return {
    average,
    timeInRange:  Math.round((inRange  / vals.length) * 100),
    timeLow:      Math.round((lowCount / vals.length) * 100),
    timeHigh:     Math.round((hiCount  / vals.length) * 100),
    readingsCount: vals.length,
  };
};

// ── Chart ─────────────────────────────────────────────────────
function LineChart({ data, low = 70, high = 180 }) {
  if (!data?.length) {
    return <Text style={styles.noData}>No data for this period</Text>;
  }
  const MIN = 40, MAX = 300, RANGE = MAX - MIN;
  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * CHART_W,
    y: CHART_H - ((d.value - MIN) / RANGE) * CHART_H,
    v: d.value,
  }));
  const lowY  = CHART_H - ((low  - MIN) / RANGE) * CHART_H;
  const highY = CHART_H - ((high - MIN) / RANGE) * CHART_H;

  const dotColor = (v) => {
    if (v < low)  return Colors.critical;
    if (v > high) return Colors.warning;
    return Colors.inRange;
  };

  return (
    <View style={{ width: CHART_W, height: CHART_H + 20, position: 'relative' }}>
      {/* Target range band */}
      <View style={{
        position: 'absolute', left: 0, right: 0,
        top: highY, height: lowY - highY,
        backgroundColor: Colors.inRange + '18',
      }} />
      {/* Boundary lines */}
      <View style={[styles.dashLine, { top: highY }]} />
      <View style={[styles.dashLine, { top: lowY  }]} />

      {/* Line segments between points */}
      {pts.map((p, i) => {
        if (i === 0) return null;
        const prev = pts[i - 1];
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle  = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={`line-${i}`}
            style={{
              position: 'absolute',
              left: prev.x,
              top: prev.y,
              width: length,
              height: 2,
              backgroundColor: Colors.teal,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: '0 0',
            }}
          />
        );
      })}

      {/* Dots on top of lines */}
      {pts.map((p, i) => (
        <View key={`dot-${i}`} style={{
          position: 'absolute',
          left: p.x - 4, top: p.y - 4,
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: dotColor(p.v),
          borderWidth: 1.5,
          borderColor: Colors.white,
        }} />
      ))}

      {/* Axis labels */}
      <Text style={[styles.axisLabel, { top: highY - 14 }]}>{high}</Text>
      <Text style={[styles.axisLabel, { top: lowY  - 14 }]}>{low}</Text>
    </View>
  );
}

// ── Pattern card ──────────────────────────────────────────────
function PatternCard({ icon, title, desc, color }) {
  return (
    <View style={[styles.patternCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={styles.patternIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.patternTitle}>{title}</Text>
        <Text style={styles.patternDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────
export default function TrendsScreen() {
  const { user }   = useAuthStore();
  const [period, setPeriod] = useState(14);

  const low  = user?.targetGlucoseLow  ?? 70;
  const high = user?.targetGlucoseHigh ?? 180;

  const cutoff  = Date.now() - period * DAY;
  const readings = ALL_READINGS
    .filter(r => new Date(r.timestamp).getTime() >= cutoff)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const stats = calcStats(readings, low, high);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
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
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p}d
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <View style={[styles.chartCard, Shadow.md]}>
        <Text style={styles.chartTitle}>Glucose Readings · {period} days</Text>
        <LineChart data={readings} low={low} high={high} />
        <View style={styles.chartLegend}>
          {[
            { label: 'Low',      color: Colors.critical },
            { label: 'In Range', color: Colors.inRange  },
            { label: 'High',     color: Colors.warning  },
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
            { label: 'Avg Glucose',    value: `${stats.average} mg/dL`,      color: Colors.textPrimary },
            { label: 'GMI',            value: `${calcGMI(stats.average)}%`,  color: Colors.teal        },
            { label: 'Time In Range',  value: `${stats.timeInRange}%`,       color: Colors.inRange     },
            { label: 'Time Low',       value: `${stats.timeLow}%`,           color: Colors.critical    },
            { label: 'Time High',      value: `${stats.timeHigh}%`,          color: Colors.warning     },
            { label: 'Readings',       value: `${stats.readingsCount}`,      color: Colors.textPrimary },
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
          <Text style={styles.tirTitle}>Time In Range breakdown</Text>
          <View style={styles.tirBar}>
            <View style={[styles.tirSeg, { flex: stats.timeLow,    backgroundColor: Colors.critical }]} />
            <View style={[styles.tirSeg, { flex: stats.timeInRange, backgroundColor: Colors.inRange  }]} />
            <View style={[styles.tirSeg, { flex: stats.timeHigh,   backgroundColor: Colors.warning   }]} />
          </View>
          <View style={styles.tirLegend}>
            <Text style={[styles.tirLbl, { color: Colors.critical }]}>Low {stats.timeLow}%</Text>
            <Text style={[styles.tirLbl, { color: Colors.inRange  }]}>In Range {stats.timeInRange}%</Text>
            <Text style={[styles.tirLbl, { color: Colors.warning  }]}>High {stats.timeHigh}%</Text>
          </View>
        </View>
      )}

      {/* Patterns */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patterns Detected</Text>
        <PatternCard
          icon="🌅" title="Morning highs"
          desc="Glucose often rises between 6–9 AM (dawn phenomenon)"
          color={Colors.warning}
        />
        <PatternCard
          icon="🍽️" title="Post-meal spike"
          desc="Values exceed 180 mg/dL ~2h after dinner on most days"
          color={Colors.warning}
        />
        <PatternCard
          icon="✅" title="Good overnight control"
          desc="70% of nights you stay in range — keep it up!"
          color={Colors.inRange}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: Colors.bg },
  header:          { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  title:           { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  sub:             { fontSize: FontSize.sm, color: Colors.tealLight, marginTop: 4 },
  periodRow:       { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.sm },
  periodBtn:       { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  periodBtnActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  periodText:      { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  periodTextActive:{ color: Colors.white },
  chartCard:       { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg },
  chartTitle:      { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.lg },
  noData:          { color: Colors.textMuted, textAlign: 'center', paddingVertical: 40 },
  dashLine:        { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: Colors.border },
  axisLabel:       { position: 'absolute', left: 0, fontSize: FontSize.xs, color: Colors.textMuted },
  chartLegend:     { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl, marginTop: Spacing.md },
  legendItem:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:       { width: 8, height: 8, borderRadius: 4 },
  legendText:      { fontSize: FontSize.xs, color: Colors.textSecondary },
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.lg },
  statCard:        { flex: 1, minWidth: '44%', backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md },
  statValue:       { fontSize: FontSize.lg, fontWeight: '700' },
  statLabel:       { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  tirCard:         { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  tirTitle:        { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, marginBottom: Spacing.sm },
  tirBar:          { flexDirection: 'row', height: 12, borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.sm },
  tirSeg:          { height: '100%' },
  tirLegend:       { flexDirection: 'row', justifyContent: 'space-between' },
  tirLbl:          { fontSize: FontSize.xs, fontWeight: '600' },
  section:         { paddingHorizontal: Spacing.lg },
  sectionTitle:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  patternCard:     { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  patternIcon:     { fontSize: 22 },
  patternTitle:    { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  patternDesc:     { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 3 },
});