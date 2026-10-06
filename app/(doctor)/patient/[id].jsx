import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { glucoseStatus, calcGMI, fromNow } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

// Full mock dataset — same patients used across the app
const PATIENTS = {
  '1': {
    id: '1', name: 'Rahul Sharma', diabetesType: 'T1D', age: 28,
    gender: 'Male', phone: '+91 98110 22334', bloodGroup: 'B+',
    diagnosedYear: 2014, hba1c: 9.2,
    targetGlucoseLow: 70, targetGlucoseHigh: 180,
    doctorName: 'Dr. Akshit Sukhija',
    medications: [
      { name: 'Insulin Glargine (Lantus)', dose: '18 units', frequency: 'Once at bedtime' },
      { name: 'Insulin Lispro (Humalog)',  dose: '6–10 units', frequency: 'Before each meal' },
    ],
    readings: [
      { value: 320, timestamp: new Date(Date.now() - 15 * 60000).toISOString(),   mealTag: 'Post-meal' },
      { value: 280, timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),  mealTag: 'Pre-meal'  },
      { value: 310, timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),  mealTag: 'Fasting'   },
      { value: 295, timestamp: new Date(Date.now() - 10 * 3600000).toISOString(), mealTag: 'Post-meal' },
      { value: 265, timestamp: new Date(Date.now() - 14 * 3600000).toISOString(), mealTag: 'Pre-meal'  },
      { value: 340, timestamp: new Date(Date.now() - 22 * 3600000).toISOString(), mealTag: 'Bedtime'   },
    ],
    stats: { average: 248, timeInRange: 31, timeLow: 5, timeHigh: 64 },
    notes: 'Patient requires close monitoring. Persistent post-meal spikes. Consider basal adjustment.',
  },
  '2': {
    id: '2', name: 'Priya Mehta', diabetesType: 'T1D', age: 34,
    gender: 'Female', phone: '+91 99001 55678', bloodGroup: 'O+',
    diagnosedYear: 2009, hba1c: 7.1,
    targetGlucoseLow: 70, targetGlucoseHigh: 180,
    doctorName: 'Dr. Akshit Sukhija',
    medications: [
      { name: 'Insulin Detemir (Levemir)', dose: '14 units', frequency: 'Once at bedtime' },
      { name: 'Insulin Aspart (NovoRapid)', dose: '4–8 units', frequency: 'Before each meal' },
    ],
    readings: [
      { value: 58,  timestamp: new Date(Date.now() - 8 * 60000).toISOString(),   mealTag: 'Fasting'   },
      { value: 72,  timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),  mealTag: 'Pre-meal'  },
      { value: 142, timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),  mealTag: 'Post-meal' },
      { value: 88,  timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),  mealTag: 'Fasting'   },
      { value: 165, timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), mealTag: 'Post-meal' },
      { value: 61,  timestamp: new Date(Date.now() - 18 * 3600000).toISOString(), mealTag: 'Bedtime'   },
    ],
    stats: { average: 78, timeInRange: 60, timeLow: 22, timeHigh: 18 },
    notes: 'Frequent nocturnal hypoglycaemia. Reduce bedtime basal by 2 units. Educate on carb counting.',
  },
  '3': {
    id: '3', name: 'Ankit Verma', diabetesType: 'T2D', age: 52,
    gender: 'Male', phone: '+91 98760 11223', bloodGroup: 'A+',
    diagnosedYear: 2018, hba1c: 7.6,
    targetGlucoseLow: 80, targetGlucoseHigh: 200,
    doctorName: 'Dr. Akshit Sukhija',
    medications: [
      { name: 'Metformin 500mg', dose: '500 mg', frequency: 'Twice daily with meals' },
      { name: 'Glimepiride 1mg', dose: '1 mg',   frequency: 'Once before breakfast' },
    ],
    readings: [
      { value: 145, timestamp: new Date(Date.now() - 45 * 60000).toISOString(),  mealTag: 'Post-meal' },
      { value: 138, timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), mealTag: 'Pre-meal'  },
      { value: 162, timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), mealTag: 'Post-meal' },
      { value: 118, timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),mealTag: 'Fasting'   },
    ],
    stats: { average: 152, timeInRange: 72, timeLow: 4, timeHigh: 24 },
    notes: 'Good compliance. Review diet — reduce refined carbs. HbA1c improved from 8.2.',
  },
  '4': {
    id: '4', name: 'Sana Khan', diabetesType: 'T1D', age: 22,
    gender: 'Female', phone: '+91 97300 44556', bloodGroup: 'AB-',
    diagnosedYear: 2016, hba1c: 8.4,
    targetGlucoseLow: 70, targetGlucoseHigh: 180,
    doctorName: 'Dr. Akshit Sukhija',
    medications: [
      { name: 'Insulin Glargine (Lantus)', dose: '12 units', frequency: 'Once at bedtime' },
      { name: 'Insulin Lispro (Humalog)',  dose: '5–8 units', frequency: 'Before each meal' },
    ],
    readings: [
      { value: 240, timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),  mealTag: 'Post-meal' },
      { value: 195, timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),  mealTag: 'Pre-meal'  },
      { value: 220, timestamp: new Date(Date.now() - 9 * 3600000).toISOString(),  mealTag: 'Post-meal' },
      { value: 178, timestamp: new Date(Date.now() - 13 * 3600000).toISOString(), mealTag: 'Fasting'   },
    ],
    stats: { average: 204, timeInRange: 47, timeLow: 7, timeHigh: 46 },
    notes: 'College student — irregular meal timings. Counsel on lifestyle management.',
  },
  '5': {
    id: '5', name: 'Dev Patel', diabetesType: 'T2D', age: 61,
    gender: 'Male', phone: '+91 96600 77889', bloodGroup: 'O-',
    diagnosedYear: 2012, hba1c: 6.8,
    targetGlucoseLow: 80, targetGlucoseHigh: 200,
    doctorName: 'Dr. Akshit Sukhija',
    medications: [
      { name: 'Metformin 1000mg', dose: '1000 mg', frequency: 'Twice daily with meals' },
      { name: 'Sitagliptin 100mg', dose: '100 mg', frequency: 'Once daily' },
    ],
    readings: [
      { value: 112, timestamp: new Date(Date.now() - 30 * 60000).toISOString(),  mealTag: 'Post-meal' },
      { value: 98,  timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), mealTag: 'Fasting'   },
      { value: 135, timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), mealTag: 'Post-meal' },
    ],
    stats: { average: 120, timeInRange: 81, timeLow: 3, timeHigh: 16 },
    notes: 'Well-controlled. Continue current regimen. Next HbA1c in 3 months.',
  },
  '6': {
    id: '6', name: 'Neha Singh', diabetesType: 'T1D', age: 19,
    gender: 'Female', phone: '+91 93400 22110', bloodGroup: 'B-',
    diagnosedYear: 2020, hba1c: 6.5,
    targetGlucoseLow: 70, targetGlucoseHigh: 180,
    doctorName: 'Dr. Akshit Sukhija',
    medications: [
      { name: 'Insulin Degludec (Tresiba)', dose: '10 units', frequency: 'Once daily' },
      { name: 'Insulin Aspart (NovoRapid)', dose: '3–6 units', frequency: 'Before each meal' },
    ],
    readings: [
      { value: 89,  timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),  mealTag: 'Fasting'   },
      { value: 152, timestamp: new Date(Date.now() - 7 * 3600000).toISOString(),  mealTag: 'Post-meal' },
      { value: 105, timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), mealTag: 'Pre-meal'  },
    ],
    stats: { average: 97, timeInRange: 87, timeLow: 5, timeHigh: 8 },
    notes: 'Excellent control. Reinforce current habits. CGM use recommended.',
  },
  '7': {
    id: '7', name: 'Arun Kapoor', diabetesType: 'T2D', age: 57,
    gender: 'Male', phone: '+91 98220 33445', bloodGroup: 'A-',
    diagnosedYear: 2015, hba1c: 8.1,
    targetGlucoseLow: 80, targetGlucoseHigh: 200,
    doctorName: 'Dr. Akshit Sukhija',
    medications: [
      { name: 'Metformin 500mg',    dose: '500 mg', frequency: 'Twice daily with meals' },
      { name: 'Empagliflozin 10mg', dose: '10 mg',  frequency: 'Once in the morning'    },
      { name: 'Glimepiride 2mg',    dose: '2 mg',   frequency: 'Once before breakfast'   },
    ],
    readings: [
      { value: 195, timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),  mealTag: 'Post-meal' },
      { value: 168, timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),  mealTag: 'Pre-meal'  },
      { value: 210, timestamp: new Date(Date.now() - 9 * 3600000).toISOString(),  mealTag: 'Post-meal' },
      { value: 148, timestamp: new Date(Date.now() - 14 * 3600000).toISOString(), mealTag: 'Fasting'   },
    ],
    stats: { average: 170, timeInRange: 61, timeLow: 4, timeHigh: 35 },
    notes: 'Suboptimal control. Increase empagliflozin to 25mg. Follow-up in 4 weeks.',
  },
};

const AVATAR_COLORS = [Colors.teal, Colors.amber, Colors.info, Colors.critical, '#7C3AED', '#0891B2', '#BE185D'];

function TIRBar({ low, inRange, high }) {
  return (
    <View style={styles.tirBar}>
      <View style={[styles.tirSeg, { flex: low,     backgroundColor: Colors.low     }]} />
      <View style={[styles.tirSeg, { flex: inRange,  backgroundColor: Colors.inRange }]} />
      <View style={[styles.tirSeg, { flex: high,    backgroundColor: Colors.high    }]} />
    </View>
  );
}

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams();
  const router  = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const patient = PATIENTS[id];
  if (!patient) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="person-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.notFoundText}>Patient not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status     = glucoseStatus(patient.readings[0]?.value ?? 120, patient.targetGlucoseLow, patient.targetGlucoseHigh);
  const tirColor   = patient.stats.timeInRange >= 70 ? Colors.inRange : patient.stats.timeInRange >= 50 ? Colors.amber : Colors.critical;
  const avatarIdx  = parseInt(id) - 1;
  const avatarColor = AVATAR_COLORS[avatarIdx % AVATAR_COLORS.length];

  const TABS = ['overview', 'readings', 'medications'];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={[styles.avatar, { backgroundColor: avatarColor + '30' }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>{patient.name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <View style={styles.headerMeta}>
              <View style={[styles.typePill, { backgroundColor: Colors.teal + '30' }]}>
                <Text style={[styles.typePillText, { color: Colors.tealLight }]}>{patient.diabetesType}</Text>
              </View>
              <Text style={styles.headerMetaText}>Age {patient.age} · {patient.gender}</Text>
            </View>
          </View>
          {/* Live glucose */}
          <View style={[styles.liveGlucose, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.liveGlucoseVal, { color: status.color }]}>{patient.readings[0]?.value}</Text>
            <Text style={[styles.liveGlucoseUnit, { color: status.color }]}>mg/dL</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.tealLight} />
            <Text style={styles.actionBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="calendar-outline" size={18} color={Colors.tealLight} />
            <Text style={styles.actionBtnText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="call-outline" size={18} color={Colors.tealLight} />
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="document-text-outline" size={18} color={Colors.tealLight} />
            <Text style={styles.actionBtnText}>Report</Text>
          </TouchableOpacity>
        </View>

        {/* Sub-tabs */}
        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabBtnText, activeTab === t && styles.tabBtnTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            {/* Stats row */}
            <View style={[styles.statsCard, Shadow.sm]}>
              {[
                { label: 'Avg Glucose', value: `${patient.stats.average} mg/dL`, color: status.color },
                { label: 'GMI',         value: `${calcGMI(patient.stats.average)}%`, color: Colors.teal },
                { label: 'HbA1c',       value: `${patient.hba1c}%`,             color: Colors.navy },
              ].map(s => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* TIR card */}
            <View style={[styles.card, Shadow.sm]}>
              <Text style={styles.cardTitle}>Time In Range</Text>
              <TIRBar low={patient.stats.timeLow} inRange={patient.stats.timeInRange} high={patient.stats.timeHigh} />
              <View style={styles.tirLegend}>
                {[
                  { label: `Low  ${patient.stats.timeLow}%`,         color: Colors.low      },
                  { label: `In Range  ${patient.stats.timeInRange}%`, color: Colors.inRange  },
                  { label: `High  ${patient.stats.timeHigh}%`,        color: Colors.high     },
                ].map(l => (
                  <View key={l.label} style={styles.tirLegendItem}>
                    <View style={[styles.dot, { backgroundColor: l.color }]} />
                    <Text style={[styles.tirLegendText, { color: tirColor === Colors.inRange ? Colors.textSecondary : tirColor }]}>{l.label}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.tirBadge, { backgroundColor: tirColor + '18' }]}>
                <Ionicons
                  name={patient.stats.timeInRange >= 70 ? 'checkmark-circle' : 'alert-circle'}
                  size={14} color={tirColor}
                />
                <Text style={[styles.tirBadgeText, { color: tirColor }]}>
                  {patient.stats.timeInRange >= 70 ? 'TIR target met' : `TIR target: ≥${patient.diabetesType === 'T2D' ? 50 : 70}%`}
                </Text>
              </View>
            </View>

            {/* Patient info card */}
            <View style={[styles.card, Shadow.sm]}>
              <Text style={styles.cardTitle}>Patient Information</Text>
              {[
                { label: 'Blood Group',      value: patient.bloodGroup },
                { label: 'Phone',            value: patient.phone },
                { label: 'Diagnosed',        value: `${patient.diagnosedYear} (${new Date().getFullYear() - patient.diagnosedYear} yrs)` },
                { label: 'Target Range',     value: `${patient.targetGlucoseLow}–${patient.targetGlucoseHigh} mg/dL` },
                { label: 'Assigned Doctor',  value: patient.doctorName },
              ].map(row => (
                <View key={row.label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              ))}
            </View>

            {/* Doctor notes */}
            {patient.notes && (
              <View style={[styles.notesCard, Shadow.sm]}>
                <View style={styles.notesHeader}>
                  <Ionicons name="document-text" size={16} color={Colors.amber} />
                  <Text style={styles.notesTitle}>Doctor Notes</Text>
                </View>
                <Text style={styles.notesText}>{patient.notes}</Text>
              </View>
            )}
          </>
        )}

        {/* ── READINGS TAB ── */}
        {activeTab === 'readings' && (
          <>
            <Text style={styles.sectionTitle}>Recent Glucose Readings</Text>
            {patient.readings.map((r, i) => {
              const s = glucoseStatus(r.value, patient.targetGlucoseLow, patient.targetGlucoseHigh);
              return (
                <View key={i} style={[styles.readingRow, Shadow.sm]}>
                  <View style={[styles.readingIcon, { backgroundColor: s.color + '18' }]}>
                    <Ionicons name="pulse" size={18} color={s.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealTag}>{r.mealTag}</Text>
                    <Text style={styles.readingTime}>{fromNow(r.timestamp)}</Text>
                  </View>
                  <View style={[styles.readingBadge, { backgroundColor: s.color + '15' }]}>
                    <Text style={[styles.readingValue, { color: s.color }]}>{r.value}</Text>
                    <Text style={[styles.readingUnit, { color: s.color }]}>mg/dL</Text>
                  </View>
                  <View style={[styles.statusDotSmall, { backgroundColor: s.color }]} />
                </View>
              );
            })}
            <View style={styles.rangeNote}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.rangeNoteText}>Target: {patient.targetGlucoseLow}–{patient.targetGlucoseHigh} mg/dL</Text>
            </View>
          </>
        )}

        {/* ── MEDICATIONS TAB ── */}
        {activeTab === 'medications' && (
          <>
            <Text style={styles.sectionTitle}>Current Medications</Text>
            {patient.medications.map((med, i) => (
              <View key={i} style={[styles.medCard, Shadow.sm]}>
                <View style={styles.medIconWrap}>
                  <Ionicons name="medical" size={20} color={Colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <View style={styles.medDetails}>
                    <View style={styles.medDetail}>
                      <Ionicons name="flask-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.medDetailText}>{med.dose}</Text>
                    </View>
                    <View style={styles.medDetail}>
                      <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.medDetailText}>{med.frequency}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {/* Prescription action */}
            <TouchableOpacity style={styles.prescribeBtn}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.teal} />
              <Text style={styles.prescribeBtnText}>Add / Modify Prescription</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: Colors.bg },
  notFound:           { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.bg },
  notFoundText:       { fontSize: FontSize.base, color: Colors.textMuted },
  backLink:           { fontSize: FontSize.base, color: Colors.teal, fontWeight: '600' },

  // Header
  header:             { backgroundColor: Colors.navy, paddingTop: 52, paddingHorizontal: Spacing.xl, paddingBottom: 0 },
  backBtn:            { marginBottom: Spacing.md },
  headerContent:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  avatar:             { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText:         { fontSize: FontSize.xl, fontWeight: '800' },
  patientName:        { fontSize: FontSize.lg, fontWeight: '800', color: Colors.white },
  headerMeta:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  typePill:           { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.sm },
  typePillText:       { fontSize: FontSize.xs, fontWeight: '700' },
  headerMetaText:     { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)' },
  liveGlucose:        { alignItems: 'center', borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm },
  liveGlucoseVal:     { fontSize: FontSize.xl, fontWeight: '800' },
  liveGlucoseUnit:    { fontSize: 9, fontWeight: '600' },

  // Quick action buttons
  quickActions:       { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  actionBtn:          { alignItems: 'center', gap: 4 },
  actionBtnText:      { fontSize: FontSize.xs, color: Colors.tealLight, fontWeight: '600' },

  // Sub-tabs
  tabRow:             { flexDirection: 'row', marginTop: Spacing.sm },
  tabBtn:             { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive:       { borderBottomColor: Colors.teal },
  tabBtnText:         { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  tabBtnTextActive:   { color: Colors.teal },

  body:               { flex: 1 },

  // Stats
  statsCard:          { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md },
  statItem:           { alignItems: 'center' },
  statValue:          { fontSize: FontSize.lg, fontWeight: '800' },
  statLabel:          { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Generic card
  card:               { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  cardTitle:          { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },

  // TIR
  tirBar:             { flexDirection: 'row', height: 14, borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.sm },
  tirSeg:             { height: '100%' },
  tirLegend:          { flexDirection: 'row', gap: Spacing.lg, flexWrap: 'wrap', marginBottom: Spacing.sm },
  tirLegendItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:                { width: 8, height: 8, borderRadius: 4 },
  tirLegendText:      { fontSize: FontSize.xs, color: Colors.textSecondary },
  tirBadge:           { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 5, alignSelf: 'flex-start' },
  tirBadgeText:       { fontSize: FontSize.xs, fontWeight: '700' },

  // Patient info
  infoRow:            { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel:          { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue:          { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },

  // Notes
  notesCard:          { backgroundColor: Colors.amber + '10', borderRadius: Radius.lg, padding: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.amber, marginBottom: Spacing.md },
  notesHeader:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  notesTitle:         { fontSize: FontSize.sm, fontWeight: '700', color: Colors.amber },
  notesText:          { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  // Readings
  sectionTitle:       { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  readingRow:         { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  readingIcon:        { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  mealTag:            { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  readingTime:        { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  readingBadge:       { alignItems: 'center', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  readingValue:       { fontSize: FontSize.md, fontWeight: '800' },
  readingUnit:        { fontSize: 9, fontWeight: '600' },
  statusDotSmall:     { width: 8, height: 8, borderRadius: 4 },
  rangeNote:          { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm },
  rangeNoteText:      { fontSize: FontSize.xs, color: Colors.textMuted },

  // Medications
  medCard:            { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  medIconWrap:        { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.teal + '18', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  medName:            { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  medDetails:         { marginTop: 4, gap: 3 },
  medDetail:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  medDetailText:      { fontSize: FontSize.xs, color: Colors.textSecondary },
  prescribeBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1.5, borderColor: Colors.teal, borderRadius: Radius.md, paddingVertical: 13, marginTop: Spacing.sm },
  prescribeBtnText:   { fontSize: FontSize.base, color: Colors.teal, fontWeight: '700' },
});
