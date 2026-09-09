import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { patientApi, reportsApi } from '../../../lib/api';
import { calcGMI } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

const PERIODS = [7, 14, 30, 90];

function StatRow({ label, value, color }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    </View>
  );
}

function PatientReport({ patient, period }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report', patient.id, period],
    queryFn: async () => { const { data } = await reportsApi.generate(patient.id, period); return data.data; },
    staleTime: 10 * 60 * 1000,
    enabled: !!patient.id,
  });

  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.reportCard, Shadow.sm]}>
      <TouchableOpacity style={styles.reportHeader} onPress={() => setExpanded(v => !v)}>
        <View>
          <Text style={styles.reportPatient}>{patient.name}</Text>
          <Text style={styles.reportMeta}>{patient.diabetesType}</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.teal} />
        ) : data ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.tirValue}>{data.timeInRange ?? '—'}% TIR</Text>
            <Text style={styles.gmiValue}>GMI {calcGMI(data.average ?? 0)}%</Text>
          </View>
        ) : null}
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      {expanded && data && (
        <View style={styles.reportBody}>
          <View style={styles.tirBarWrap}>
            <View style={styles.tirBar}>
              <View style={[styles.tirSeg, { flex: data.timeLow    ?? 8,  backgroundColor: Colors.low     }]} />
              <View style={[styles.tirSeg, { flex: data.timeInRange ?? 70, backgroundColor: Colors.inRange }]} />
              <View style={[styles.tirSeg, { flex: data.timeHigh   ?? 22, backgroundColor: Colors.high    }]} />
            </View>
          </View>
          <StatRow label="Average Glucose"  value={`${data.average ?? '—'} mg/dL`} />
          <StatRow label="GMI"              value={`${calcGMI(data.average ?? 0)}%`} color={Colors.teal} />
          <StatRow label="Time In Range"    value={`${data.timeInRange ?? '—'}%`}   color={Colors.inRange} />
          <StatRow label="Time Low (<70)"   value={`${data.timeLow ?? '—'}%`}       color={Colors.low} />
          <StatRow label="Time High (>180)" value={`${data.timeHigh ?? '—'}%`}      color={Colors.high} />
          <StatRow label="Total Readings"   value={data.readingsCount ?? '—'} />

          <TouchableOpacity style={styles.exportBtn}>
            <Ionicons name="download-outline" size={16} color={Colors.teal} />
            <Text style={styles.exportText}>Export PDF Report</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ReportsScreen() {
  const [period, setPeriod] = useState(14);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => { const { data } = await patientApi.getAll(); return data.data; },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports & Analytics</Text>
        <Text style={styles.sub}>Clinical glucose summaries per patient</Text>
      </View>

      {/* Period picker */}
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p} days</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary strip */}
      <View style={[styles.summaryStrip, Shadow.sm]}>
        {[
          { label: 'Patients',   value: patients?.length ?? '—', icon: 'people' },
          { label: 'Avg TIR',   value: '68%',                   icon: 'pie-chart' },
          { label: 'Avg GMI',   value: '6.9%',                  icon: 'analytics' },
        ].map(s => (
          <View key={s.label} style={styles.summaryItem}>
            <Ionicons name={s.icon} size={20} color={Colors.teal} />
            <Text style={styles.summaryValue}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Per-patient accordion */}
      <View style={{ paddingHorizontal: Spacing.lg }}>
        <Text style={styles.sectionTitle}>Patient Reports</Text>
        {isLoading ? (
          <ActivityIndicator color={Colors.teal} style={{ marginTop: 20 }} />
        ) : (
          patients?.map(p => <PatientReport key={p.id} patient={p} period={period} />)
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
  periodRow:      { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.sm },
  periodBtn:      { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  periodBtnActive:{ backgroundColor: Colors.teal, borderColor: Colors.teal },
  periodText:     { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  periodTextActive:{ color: Colors.white },
  summaryStrip:   { flexDirection: 'row', backgroundColor: Colors.white, marginHorizontal: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.lg, justifyContent: 'space-around', marginBottom: Spacing.xl },
  summaryItem:    { alignItems: 'center', gap: 4 },
  summaryValue:   { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  summaryLabel:   { fontSize: FontSize.xs, color: Colors.textMuted },
  sectionTitle:   { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  reportCard:     { backgroundColor: Colors.white, borderRadius: Radius.md, marginBottom: Spacing.md, overflow: 'hidden' },
  reportHeader:   { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  reportPatient:  { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  reportMeta:     { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  tirValue:       { fontSize: FontSize.sm, fontWeight: '700', color: Colors.inRange },
  gmiValue:       { fontSize: FontSize.xs, color: Colors.teal, marginTop: 2 },
  reportBody:     { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  tirBarWrap:     { marginVertical: Spacing.md },
  tirBar:         { flexDirection: 'row', height: 10, borderRadius: Radius.full, overflow: 'hidden' },
  tirSeg:         { height: '100%' },
  statRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statLabel:      { fontSize: FontSize.sm, color: Colors.textSecondary },
  statValue:      { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  exportBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.teal, borderRadius: Radius.md, alignSelf: 'flex-start' },
  exportText:     { fontSize: FontSize.sm, color: Colors.teal, fontWeight: '600' },
});
