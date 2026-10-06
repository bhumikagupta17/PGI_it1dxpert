import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calcGMI } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

const PERIODS = [7, 14, 30, 90];

const MOCK_PATIENTS = [
  { id: '1', name: 'Rahul Sharma', diabetesType: 'T1D' },
  { id: '2', name: 'Priya Mehta',  diabetesType: 'T1D' },
  { id: '3', name: 'Ankit Verma',  diabetesType: 'T2D' },
  { id: '4', name: 'Sana Khan',    diabetesType: 'T1D' },
  { id: '5', name: 'Dev Patel',    diabetesType: 'T2D' },
  { id: '6', name: 'Neha Singh',   diabetesType: 'T1D' },
  { id: '7', name: 'Arun Kapoor',  diabetesType: 'T2D' },
];

// Mock stats keyed by patient id then period
const MOCK_STATS = {
  '1': { 7: { average: 245, timeInRange: 32, timeLow: 5,  timeHigh: 63 },
         14: { average: 260, timeInRange: 28, timeLow: 4,  timeHigh: 68 },
         30: { average: 238, timeInRange: 35, timeLow: 6,  timeHigh: 59 },
         90: { average: 250, timeInRange: 31, timeLow: 5,  timeHigh: 64 } },
  '2': { 7: { average: 72,  timeInRange: 55, timeLow: 28, timeHigh: 17 },
         14: { average: 78,  timeInRange: 60, timeLow: 22, timeHigh: 18 },
         30: { average: 80,  timeInRange: 63, timeLow: 19, timeHigh: 18 },
         90: { average: 82,  timeInRange: 65, timeLow: 18, timeHigh: 17 } },
  '3': { 7: { average: 152, timeInRange: 71, timeLow: 4,  timeHigh: 25 },
         14: { average: 148, timeInRange: 73, timeLow: 3,  timeHigh: 24 },
         30: { average: 155, timeInRange: 69, timeLow: 4,  timeHigh: 27 },
         90: { average: 160, timeInRange: 66, timeLow: 5,  timeHigh: 29 } },
  '4': { 7: { average: 198, timeInRange: 50, timeLow: 8,  timeHigh: 42 },
         14: { average: 210, timeInRange: 46, timeLow: 7,  timeHigh: 47 },
         30: { average: 195, timeInRange: 52, timeLow: 9,  timeHigh: 39 },
         90: { average: 202, timeInRange: 48, timeLow: 8,  timeHigh: 44 } },
  '5': { 7: { average: 118, timeInRange: 82, timeLow: 3,  timeHigh: 15 },
         14: { average: 122, timeInRange: 80, timeLow: 2,  timeHigh: 18 },
         30: { average: 120, timeInRange: 81, timeLow: 3,  timeHigh: 16 },
         90: { average: 125, timeInRange: 79, timeLow: 3,  timeHigh: 18 } },
  '6': { 7: { average: 95,  timeInRange: 88, timeLow: 4,  timeHigh: 8  },
         14: { average: 98,  timeInRange: 86, timeLow: 5,  timeHigh: 9  },
         30: { average: 100, timeInRange: 85, timeLow: 5,  timeHigh: 10 },
         90: { average: 102, timeInRange: 84, timeLow: 6,  timeHigh: 10 } },
  '7': { 7: { average: 168, timeInRange: 62, timeLow: 3,  timeHigh: 35 },
         14: { average: 172, timeInRange: 60, timeLow: 4,  timeHigh: 36 },
         30: { average: 175, timeInRange: 58, timeLow: 4,  timeHigh: 38 },
         90: { average: 178, timeInRange: 56, timeLow: 5,  timeHigh: 39 } },
};

function TIRBar({ inRange, low, high }) {
  const total = (inRange + low + high) || 100;
  return (
    <View>
      <Text style={styles.tirTitle}>Time In Range (TIR)</Text>
      <View style={styles.tirBar}>
        <View style={[styles.tirSegment, { flex: low,    backgroundColor: Colors.low     }]} />
        <View style={[styles.tirSegment, { flex: inRange, backgroundColor: Colors.inRange }]} />
        <View style={[styles.tirSegment, { flex: high,   backgroundColor: Colors.high    }]} />
      </View>
      <View style={styles.tirLegend}>
        {[
          { label: `Low  ${low}%`,       color: Colors.low      },
          { label: `In Range  ${inRange}%`, color: Colors.inRange },
          { label: `High  ${high}%`,     color: Colors.high     },
        ].map(l => (
          <View key={l.label} style={styles.tirLegendItem}>
            <View style={[styles.dot, { backgroundColor: l.color }]} />
            <Text style={styles.tirLegendText}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PatientGlucoseRow({ patient, period }) {
  const stats = MOCK_STATS[patient.id]?.[period] ?? { average: 140, timeInRange: 70, timeLow: 5, timeHigh: 25 };
  const avgColor = stats.average < 70 ? Colors.low : stats.average > 180 ? Colors.high : Colors.inRange;
  const tirColor = stats.timeInRange >= 70 ? Colors.inRange : stats.timeInRange >= 50 ? Colors.amber : Colors.critical;

  return (
    <View style={[styles.patientRow, Shadow.sm]}>
      <View style={styles.rowLeft}>
        <Text style={styles.patientName}>{patient.name}</Text>
        <View style={[styles.typePill, { backgroundColor: Colors.teal + '18' }]}>
          <Text style={[styles.typeText, { color: Colors.teal }]}>{patient.diabetesType}</Text>
        </View>
      </View>

      <View style={styles.rowStats}>
        <View style={styles.statBlock}>
          <Text style={[styles.statVal, { color: avgColor }]}>{stats.average}</Text>
          <Text style={styles.statLbl}>Avg mg/dL</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statVal, { color: tirColor }]}>{stats.timeInRange}%</Text>
          <Text style={styles.statLbl}>TIR</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statVal, { color: Colors.teal }]}>{calcGMI(stats.average)}%</Text>
          <Text style={styles.statLbl}>GMI</Text>
        </View>
      </View>
    </View>
  );
}

export default function GlucoseScreen() {
  const [period, setPeriod] = useState(14);

  // Aggregate hospital average
  const allStats = MOCK_PATIENTS.map(p => MOCK_STATS[p.id]?.[period] ?? { average: 140, timeInRange: 70, timeLow: 5, timeHigh: 25 });
  const avgGlucose  = Math.round(allStats.reduce((s, x) => s + x.average, 0) / allStats.length);
  const avgTIR      = Math.round(allStats.reduce((s, x) => s + x.timeInRange, 0) / allStats.length);
  const avgLow      = Math.round(allStats.reduce((s, x) => s + x.timeLow, 0) / allStats.length);
  const avgHigh     = Math.round(allStats.reduce((s, x) => s + x.timeHigh, 0) / allStats.length);
  const totalReadings = allStats.length * (period === 7 ? 84 : period === 14 ? 168 : period === 30 ? 360 : 1080);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Glucose Overview</Text>
        <Text style={styles.sub}>All patients · {period}-day window</Text>
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

      {/* Hospital summary card */}
      <View style={[styles.summaryCard, Shadow.md]}>
        <Text style={styles.cardLabel}>Hospital Average · {period} days</Text>

        <TIRBar low={avgLow} inRange={avgTIR} high={avgHigh} />

        <View style={styles.statsRow}>
          {[
            { label: 'Avg Glucose', value: `${avgGlucose} mg/dL`, color: Colors.textPrimary },
            { label: 'Avg GMI',     value: `${calcGMI(avgGlucose)}%`, color: Colors.teal        },
            { label: 'Readings',    value: totalReadings.toLocaleString(), color: Colors.textPrimary },
          ].map(s => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statItemValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statItemLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* TIR target reminder */}
      <View style={styles.targetBanner}>
        <Ionicons name="information-circle" size={16} color={Colors.info} />
        <Text style={styles.targetText}>TIR target: ≥70% for T1D · ≥50% for T2D</Text>
      </View>

      {/* Per-patient breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Breakdown</Text>
        {MOCK_PATIENTS.map(p => (
          <PatientGlucoseRow key={p.id} patient={p} period={period} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: Colors.bg },

  header:           { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  title:            { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  sub:              { fontSize: FontSize.xs, color: Colors.tealLight, marginTop: 4 },

  periodRow:        { flexDirection: 'row', margin: Spacing.lg, gap: Spacing.sm },
  periodBtn:        { flex: 1, paddingVertical: 9, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  periodBtnActive:  { backgroundColor: Colors.teal, borderColor: Colors.teal },
  periodText:       { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700' },
  periodTextActive: { color: Colors.white },

  summaryCard:      { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  cardLabel:        { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  tirTitle:         { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm },
  tirBar:           { flexDirection: 'row', height: 14, borderRadius: Radius.full, overflow: 'hidden' },
  tirSegment:       { height: '100%' },
  tirLegend:        { flexDirection: 'row', marginTop: Spacing.sm, gap: Spacing.lg },
  tirLegendItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:              { width: 8, height: 8, borderRadius: 4 },
  tirLegendText:    { fontSize: FontSize.xs, color: Colors.textSecondary },
  statsRow:         { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.lg, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  statItem:         { alignItems: 'center' },
  statItemValue:    { fontSize: FontSize.md, fontWeight: '800' },
  statItemLabel:    { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  targetBanner:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, backgroundColor: Colors.info + '12', borderRadius: Radius.md, padding: Spacing.sm + 2 },
  targetText:       { fontSize: FontSize.xs, color: Colors.info, fontWeight: '500' },

  section:          { marginHorizontal: Spacing.lg },
  sectionTitle:     { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },

  patientRow:       { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  rowLeft:          { flex: 1, gap: 4 },
  patientName:      { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  typePill:         { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.sm },
  typeText:         { fontSize: FontSize.xs, fontWeight: '700' },

  rowStats:         { flexDirection: 'row', gap: Spacing.md },
  statBlock:        { alignItems: 'center' },
  statVal:          { fontSize: FontSize.sm, fontWeight: '800' },
  statLbl:          { fontSize: 9, color: Colors.textMuted, marginTop: 1 },
});
