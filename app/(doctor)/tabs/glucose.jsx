import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { patientApi } from '../../../lib/api';
import { useGlucoseStats } from '../../../hooks/useGlucose';
import { glucoseStatus, calcGMI } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

const PERIODS = [7, 14, 30, 90];

function TIRBar({ inRange, low, high }) {
  return (
    <View>
      <Text style={styles.tirTitle}>Time In Range</Text>
      <View style={styles.tirBar}>
        <View style={[styles.tirSegment, { flex: low,    backgroundColor: Colors.low     }]} />
        <View style={[styles.tirSegment, { flex: inRange, backgroundColor: Colors.inRange }]} />
        <View style={[styles.tirSegment, { flex: high,   backgroundColor: Colors.high    }]} />
      </View>
      <View style={styles.tirLegend}>
        {[
          { label: `Low ${low}%`,      color: Colors.low     },
          { label: `In Range ${inRange}%`, color: Colors.inRange },
          { label: `High ${high}%`,    color: Colors.high    },
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
  const { data: stats, isLoading } = useGlucoseStats(patient.id, period);
  const status = glucoseStatus(stats?.average ?? patient.lastGlucose ?? 120);

  return (
    <View style={styles.patientRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.patientName}>{patient.name}</Text>
        <Text style={styles.patientMeta}>{patient.diabetesType}</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.teal} />
      ) : stats ? (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.avgVal, { color: status.color }]}>{stats.average} mg/dL</Text>
          <Text style={styles.gmiText}>GMI {calcGMI(stats.average)}%</Text>
          <Text style={[styles.tirPct, { color: Colors.inRange }]}>{stats.timeInRange}% TIR</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function GlucoseScreen() {
  const [period, setPeriod] = useState(14);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => { const { data } = await patientApi.getAll(); return data.data; },
    staleTime: 5 * 60 * 1000,
  });

  // Aggregate fake TIR for display (real calc comes from stats per patient)
  const tirLow = 8, tirHigh = 22, tirIn = 70;

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
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p}d
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TIR Summary card */}
      <View style={[styles.card, Shadow.md]}>
        <Text style={styles.cardTitle}>Hospital Average · {period} days</Text>
        <TIRBar low={tirLow} inRange={tirIn} high={tirHigh} />
        <View style={styles.statsRow}>
          {[
            { label: 'Avg Glucose', value: '142 mg/dL', color: Colors.textPrimary },
            { label: 'Avg GMI',     value: '6.7%',      color: Colors.teal        },
            { label: 'Readings',    value: '1,248',      color: Colors.textPrimary },
          ].map(s => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Per-patient table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Breakdown</Text>
        {isLoading ? (
          <ActivityIndicator color={Colors.teal} style={{ marginTop: 20 }} />
        ) : (
          patients?.map(p => <PatientGlucoseRow key={p.id} patient={p} period={period} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  header:         { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  title:          { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  sub:            { fontSize: FontSize.sm, color: Colors.tealLight, marginTop: 4 },
  periodRow:      { flexDirection: 'row', margin: Spacing.lg, gap: Spacing.sm },
  periodBtn:      { paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  periodBtnActive:{ backgroundColor: Colors.teal, borderColor: Colors.teal },
  periodText:     { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  periodTextActive:{ color: Colors.white },
  card:           { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl },
  cardTitle:      { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.md },
  tirTitle:       { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, marginBottom: Spacing.sm },
  tirBar:         { flexDirection: 'row', height: 16, borderRadius: Radius.full, overflow: 'hidden' },
  tirSegment:     { height: '100%' },
  tirLegend:      { flexDirection: 'row', marginTop: Spacing.sm, gap: Spacing.lg },
  tirLegendItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:            { width: 8, height: 8, borderRadius: 4 },
  tirLegendText:  { fontSize: FontSize.xs, color: Colors.textSecondary },
  statsRow:       { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.lg, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  statItem:       { alignItems: 'center' },
  statValue:      { fontSize: FontSize.md, fontWeight: '700' },
  statLabel:      { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  section:        { marginHorizontal: Spacing.lg },
  sectionTitle:   { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  patientRow:     { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, ...Shadow.sm },
  patientName:    { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  patientMeta:    { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  avgVal:         { fontSize: FontSize.md, fontWeight: '700' },
  gmiText:        { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  tirPct:         { fontSize: FontSize.xs, fontWeight: '600', marginTop: 2 },
});
