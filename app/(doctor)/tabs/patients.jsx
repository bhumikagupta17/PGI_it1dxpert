import { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TextInput, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { glucoseStatus, fromNow, initials } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

const MOCK_PATIENTS = [
  { id: '1', name: 'Rahul Sharma',  lastGlucose: 320, diabetesType: 'T1D', age: 28, lastReadingAt: new Date(Date.now() - 15 * 60000).toISOString(),  targetGlucoseLow: 70, targetGlucoseHigh: 180 },
  { id: '2', name: 'Priya Mehta',   lastGlucose: 58,  diabetesType: 'T1D', age: 34, lastReadingAt: new Date(Date.now() - 8 * 60000).toISOString(),   targetGlucoseLow: 70, targetGlucoseHigh: 180 },
  { id: '3', name: 'Ankit Verma',   lastGlucose: 145, diabetesType: 'T2D', age: 52, lastReadingAt: new Date(Date.now() - 45 * 60000).toISOString(),  targetGlucoseLow: 80, targetGlucoseHigh: 200 },
  { id: '4', name: 'Sana Khan',     lastGlucose: 240, diabetesType: 'T1D', age: 22, lastReadingAt: new Date(Date.now() - 2 * 3600000).toISOString(), targetGlucoseLow: 70, targetGlucoseHigh: 180 },
  { id: '5', name: 'Dev Patel',     lastGlucose: 112, diabetesType: 'T2D', age: 61, lastReadingAt: new Date(Date.now() - 30 * 60000).toISOString(),  targetGlucoseLow: 80, targetGlucoseHigh: 200 },
  { id: '6', name: 'Neha Singh',    lastGlucose: 89,  diabetesType: 'T1D', age: 19, lastReadingAt: new Date(Date.now() - 3 * 3600000).toISOString(), targetGlucoseLow: 70, targetGlucoseHigh: 180 },
  { id: '7', name: 'Arun Kapoor',   lastGlucose: 195, diabetesType: 'T2D', age: 57, lastReadingAt: new Date(Date.now() - 1 * 3600000).toISOString(), targetGlucoseLow: 80, targetGlucoseHigh: 200 },
];

const AVATAR_COLORS = [Colors.teal, Colors.amber, Colors.info, Colors.critical, '#7C3AED', '#0891B2', '#BE185D'];

function PatientCard({ patient, index, onPress }) {
  const status = glucoseStatus(patient.lastGlucose, patient.targetGlucoseLow, patient.targetGlucoseHigh);
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <TouchableOpacity style={[styles.card, Shadow.sm]} onPress={onPress} activeOpacity={0.85}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarColor + '20' }]}>
        <Text style={[styles.avatarText, { color: avatarColor }]}>{initials(patient.name)}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{patient.name}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.typePill, { backgroundColor: Colors.teal + '18' }]}>
            <Text style={[styles.typeText, { color: Colors.teal }]}>{patient.diabetesType}</Text>
          </View>
          <Text style={styles.ageText}>Age {patient.age}</Text>
        </View>
        <Text style={styles.lastSeen}>
          <Ionicons name="time-outline" size={10} color={Colors.textMuted} /> {fromNow(patient.lastReadingAt)}
        </Text>
      </View>

      {/* Glucose badge */}
      <View style={[styles.glucoseBadge, { backgroundColor: status.color + '15' }]}>
        <Text style={[styles.glucoseValue, { color: status.color }]}>{patient.lastGlucose}</Text>
        <Text style={[styles.glucoseUnit, { color: status.color }]}>mg/dL</Text>
        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
        <Text style={[styles.glucoseLabel, { color: status.color }]}>{status.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PatientsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const patients = MOCK_PATIENTS;

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (filter === 'critical') return matchSearch && (p.lastGlucose < 70 || p.lastGlucose > 180);
    if (filter === 'stable')   return matchSearch && p.lastGlucose >= 70 && p.lastGlucose <= 180;
    return matchSearch;
  });

  const criticalCount = patients.filter(p => p.lastGlucose < 70 || p.lastGlucose > 180).length;
  const stableCount   = patients.filter(p => p.lastGlucose >= 70 && p.lastGlucose <= 180).length;

  const FILTERS = [
    { key: 'all',      label: `All (${patients.length})` },
    { key: 'critical', label: `Critical (${criticalCount})` },
    { key: 'stable',   label: `Stable (${stableCount})` },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Patients</Text>
          <Text style={styles.subtitle}>{patients.length} registered · PGI Chandigarh</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="person-add" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginLeft: Spacing.md }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients…"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={{ paddingRight: Spacing.md }}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <PatientCard
            patient={item}
            index={index}
            onPress={() => router.push({ pathname: '/(doctor)/patient/[id]', params: { id: item.id } })}
          />
        )}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32, gap: Spacing.sm }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: Colors.bg },

  header:           { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:            { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  subtitle:         { fontSize: FontSize.xs, color: Colors.tealLight, marginTop: 3 },
  addBtn:           { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },

  searchRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, margin: Spacing.lg, marginBottom: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  searchInput:      { flex: 1, paddingVertical: 12, paddingHorizontal: Spacing.sm, fontSize: FontSize.base, color: Colors.textPrimary },

  filterRow:        { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.sm },
  filterBtn:        { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  filterBtnActive:  { backgroundColor: Colors.navy, borderColor: Colors.navy },
  filterText:       { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: Colors.white },

  card:             { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar:           { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarText:       { fontSize: FontSize.md, fontWeight: '800' },
  name:             { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  metaRow:          { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 3 },
  typePill:         { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.sm },
  typeText:         { fontSize: FontSize.xs, fontWeight: '700' },
  ageText:          { fontSize: FontSize.xs, color: Colors.textMuted },
  lastSeen:         { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 3 },

  glucoseBadge:     { alignItems: 'center', borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, minWidth: 66 },
  glucoseValue:     { fontSize: FontSize.lg, fontWeight: '800' },
  glucoseUnit:      { fontSize: 9, fontWeight: '600', marginTop: -2 },
  statusDot:        { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  glucoseLabel:     { fontSize: 9, fontWeight: '700', marginTop: 1 },

  emptyState:       { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText:        { fontSize: FontSize.base, color: Colors.textMuted },
});
