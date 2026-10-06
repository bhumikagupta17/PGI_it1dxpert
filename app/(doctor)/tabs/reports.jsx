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
  { id: '1', name: 'Rahul Sharma', diabetesType: 'T1D', age: 28 },
  { id: '2', name: 'Priya Mehta',  diabetesType: 'T1D', age: 34 },
  { id: '3', name: 'Ankit Verma',  diabetesType: 'T2D', age: 52 },
  { id: '4', name: 'Sana Khan',    diabetesType: 'T1D', age: 22 },
  { id: '5', name: 'Dev Patel',    diabetesType: 'T2D', age: 61 },
  { id: '6', name: 'Neha Singh',   diabetesType: 'T1D', age: 19 },
  { id: '7', name: 'Arun Kapoor',  diabetesType: 'T2D', age: 57 },
];

const MOCK_REPORTS = {
  '1': { average: 248, timeInRange: 31, timeLow: 5,  timeHigh: 64, readingsCount: 84,  trend: 'worsening' },
  '2': { average: 78,  timeInRange: 60, timeLow: 22, timeHigh: 18, readingsCount: 120, trend: 'improving' },
  '3': { average: 152, timeInRange: 72, timeLow: 4,  timeHigh: 24, readingsCount: 95,  trend: 'stable'    },
  '4': { average: 204, timeInRange: 47, timeLow: 7,  timeHigh: 46, readingsCount: 110, trend: 'worsening' },
  '5': { average: 120, timeInRange: 81, timeLow: 3,  timeHigh: 16, readingsCount: 88,  trend: 'stable'    },
  '6': { average: 97,  timeInRange: 87, timeLow: 5,  timeHigh: 8,  readingsCount: 102, trend: 'improving' },
  '7': { average: 170, timeInRange: 61, timeLow: 4,  timeHigh: 35, readingsCount: 79,  trend: 'stable'    },
};

const TREND_CFG = {
  improving: { icon: 'trending-up',   color: Colors.inRange, label: 'Improving' },
  stable:    { icon: 'remove',        color: Colors.amber,   label: 'Stable'    },
  worsening: { icon: 'trending-down', color: Colors.critical,label: 'Worsening' },
};

const AVATAR_COLORS = [Colors.teal, Colors.amber, Colors.info, Colors.critical, '#7C3AED', '#0891B2', '#BE185D'];

function TIRBar({ low, inRange, high, compact }) {
  return (
    <View>
      <View style={[styles.tirBar, compact && { height: 8 }]}>
        <View style={[styles.tirSeg, { flex: low,    backgroundColor: Colors.low     }]} />
        <View style={[styles.tirSeg, { flex: inRange, backgroundColor: Colors.inRange }]} />
        <View style={[styles.tirSeg, { flex: high,   backgroundColor: Colors.high    }]} />
      </View>
    </View>
  );
}

function StatRow({ label, value, color }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    </View>
  );
}

function PatientReport({ patient, period, index }) {
  const [expanded, setExpanded] = useState(false);
  const data = MOCK_REPORTS[patient.id];
  const tirColor   = data.timeInRange >= 70 ? Colors.inRange : data.timeInRange >= 50 ? Colors.amber : Colors.critical;
  const trendCfg   = TREND_CFG[data.trend] ?? TREND_CFG.stable;
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <View style={[styles.reportCard, Shadow.sm]}>
      <TouchableOpacity style={styles.reportHeader} onPress={() => setExpanded(v => !v)} activeOpacity={0.85}>
        {/* Avatar */}
        <View style={[styles.reportAvatar, { backgroundColor: avatarColor + '20' }]}>
          <Text style={[styles.reportAvatarText, { color: avatarColor }]}>{patient.name.charAt(0)}</Text>
        </View>

        {/* Name & type */}
        <View style={{ flex: 1 }}>
          <Text style={styles.reportPatient}>{patient.name}</Text>
          <View style={styles.reportMetaRow}>
            <View style={[styles.typePill, { backgroundColor: Colors.teal + '18' }]}>
              <Text style={[styles.typePillText, { color: Colors.teal }]}>{patient.diabetesType}</Text>
            </View>
            <Text style={styles.ageText}>Age {patient.age}</Text>
          </View>
        </View>

        {/* Summary stats */}
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <Text style={[styles.tirValueText, { color: tirColor }]}>{data.timeInRange}% TIR</Text>
          <View style={styles.trendRow}>
            <Ionicons name={trendCfg.icon} size={12} color={trendCfg.color} />
            <Text style={[styles.trendText, { color: trendCfg.color }]}>{trendCfg.label}</Text>
          </View>
        </View>

        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      {/* Mini TIR bar always visible */}
      <View style={styles.miniBar}>
        <TIRBar low={data.timeLow} inRange={data.timeInRange} high={data.timeHigh} compact />
      </View>

      {/* Expanded details */}
      {expanded && (
        <View style={styles.reportBody}>
          <View style={styles.tirBarFull}>
            <TIRBar low={data.timeLow} inRange={data.timeInRange} high={data.timeHigh} />
            <View style={styles.tirLegend}>
              {[
                { label: `Low  ${data.timeLow}%`,       color: Colors.low      },
                { label: `In Range  ${data.timeInRange}%`, color: Colors.inRange },
                { label: `High  ${data.timeHigh}%`,     color: Colors.high     },
              ].map(l => (
                <View key={l.label} style={styles.tirLegendItem}>
                  <View style={[styles.dot, { backgroundColor: l.color }]} />
                  <Text style={styles.tirLegendText}>{l.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <StatRow label="Average Glucose"  value={`${data.average} mg/dL`} />
          <StatRow label="GMI"              value={`${calcGMI(data.average)}%`} color={Colors.teal} />
          <StatRow label="Time In Range"    value={`${data.timeInRange}%`}   color={tirColor} />
          <StatRow label="Time Low (<70)"   value={`${data.timeLow}%`}       color={Colors.low} />
          <StatRow label="Time High (>180)" value={`${data.timeHigh}%`}      color={Colors.high} />
          <StatRow label="Total Readings"   value={data.readingsCount} />

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

  // Hospital aggregates
  const allData    = MOCK_PATIENTS.map(p => MOCK_REPORTS[p.id]);
  const avgTIR     = Math.round(allData.reduce((s, d) => s + d.timeInRange, 0) / allData.length);
  const avgGlucose = Math.round(allData.reduce((s, d) => s + d.average, 0) / allData.length);
  const improving  = allData.filter(d => d.trend === 'improving').length;
  const atRisk     = allData.filter(d => d.timeInRange < 50).length;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reports & Analytics</Text>
        <Text style={styles.sub}>Clinical glucose summaries · PGI Chandigarh</Text>
      </View>

      {/* Period picker */}
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

      {/* Summary strip */}
      <View style={[styles.summaryStrip, Shadow.md]}>
        {[
          { label: 'Patients',   value: MOCK_PATIENTS.length,        icon: 'people',     color: Colors.teal     },
          { label: 'Avg TIR',   value: `${avgTIR}%`,                icon: 'pie-chart',  color: Colors.inRange  },
          { label: 'Avg GMI',   value: `${calcGMI(avgGlucose)}%`,   icon: 'analytics',  color: Colors.amber    },
          { label: 'At Risk',   value: atRisk,                       icon: 'warning',    color: Colors.critical },
        ].map(s => (
          <View key={s.label} style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: s.color + '18' }]}>
              <Ionicons name={s.icon} size={18} color={s.color} />
            </View>
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* TIR target guideline */}
      <View style={styles.guideline}>
        <Ionicons name="information-circle" size={15} color={Colors.info} />
        <Text style={styles.guidelineText}>ADA target: ≥70% TIR (70–180 mg/dL) for most adults with T1D</Text>
      </View>

      {/* Per-patient accordion */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Patient Reports</Text>
          <View style={[styles.periodPill, { backgroundColor: Colors.navy + '12' }]}>
            <Text style={[styles.periodPillText, { color: Colors.navy }]}>{period} days</Text>
          </View>
        </View>
        {MOCK_PATIENTS.map((p, i) => (
          <PatientReport key={p.id} patient={p} period={period} index={i} />
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

  summaryStrip:     { flexDirection: 'row', backgroundColor: Colors.white, marginHorizontal: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.lg, justifyContent: 'space-around', marginBottom: Spacing.md },
  summaryItem:      { alignItems: 'center', gap: 4 },
  summaryIcon:      { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  summaryValue:     { fontSize: FontSize.lg, fontWeight: '800' },
  summaryLabel:     { fontSize: FontSize.xs, color: Colors.textMuted },

  guideline:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, backgroundColor: Colors.info + '10', borderRadius: Radius.md, padding: Spacing.sm + 2 },
  guidelineText:    { fontSize: FontSize.xs, color: Colors.info, flex: 1 },

  section:          { paddingHorizontal: Spacing.lg },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle:     { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  periodPill:       { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  periodPillText:   { fontSize: FontSize.xs, fontWeight: '700' },

  reportCard:       { backgroundColor: Colors.white, borderRadius: Radius.lg, marginBottom: Spacing.sm, overflow: 'hidden' },
  reportHeader:     { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  reportAvatar:     { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  reportAvatarText: { fontSize: FontSize.md, fontWeight: '800' },
  reportPatient:    { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  reportMetaRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 3 },
  typePill:         { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  typePillText:     { fontSize: 9, fontWeight: '700' },
  ageText:          { fontSize: FontSize.xs, color: Colors.textMuted },
  tirValueText:     { fontSize: FontSize.sm, fontWeight: '800' },
  trendRow:         { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendText:        { fontSize: FontSize.xs, fontWeight: '700' },

  miniBar:          { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  tirBar:           { flexDirection: 'row', height: 10, borderRadius: Radius.full, overflow: 'hidden' },
  tirSeg:           { height: '100%' },

  reportBody:       { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  tirBarFull:       { marginTop: Spacing.md, marginBottom: Spacing.md },
  tirLegend:        { flexDirection: 'row', marginTop: Spacing.sm, flexWrap: 'wrap', gap: Spacing.md },
  tirLegendItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:              { width: 8, height: 8, borderRadius: 4 },
  tirLegendText:    { fontSize: FontSize.xs, color: Colors.textSecondary },

  statRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statLabel:        { fontSize: FontSize.sm, color: Colors.textSecondary },
  statValue:        { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },

  exportBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md, paddingVertical: 9, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.teal, borderRadius: Radius.md, alignSelf: 'flex-start' },
  exportText:       { fontSize: FontSize.sm, color: Colors.teal, fontWeight: '700' },
});
