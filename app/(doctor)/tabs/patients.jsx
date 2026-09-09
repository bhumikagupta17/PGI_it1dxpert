import { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { patientApi } from '../../../lib/api';
import { glucoseStatus, fromNow, initials } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

function PatientCard({ patient, onPress }) {
  const status = glucoseStatus(patient.lastGlucose, patient.targetGlucoseLow, patient.targetGlucoseHigh);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: Colors.teal + '20' }]}>
        <Text style={styles.avatarText}>{initials(patient.name)}</Text>
      </View>
      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{patient.name}</Text>
        <Text style={styles.meta}>
          {patient.diabetesType} · Age {patient.age ?? '—'}
        </Text>
        <Text style={styles.lastSeen}>Last reading {fromNow(patient.lastReadingAt)}</Text>
      </View>
      {/* Glucose badge */}
      <View style={[styles.glucoseBadge, { backgroundColor: status.color + '20' }]}>
        <Text style={[styles.glucoseValue, { color: status.color }]}>
          {patient.lastGlucose ?? '—'}
        </Text>
        <Text style={[styles.glucoseUnit, { color: status.color }]}>mg/dL</Text>
        <Text style={[styles.glucoseLabel, { color: status.color }]}>{status.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PatientsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | critical | stable

  const { data: patients, isLoading, refetch } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => { const { data } = await patientApi.getAll(); return data.data; },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = (patients ?? []).filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (filter === 'critical') return matchSearch && (p.lastGlucose < 70 || p.lastGlucose > 180);
    if (filter === 'stable')   return matchSearch && p.lastGlucose >= 70 && p.lastGlucose <= 180;
    return matchSearch;
  });

  const FILTERS = ['all', 'critical', 'stable'];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <Text style={styles.count}>{patients?.length ?? 0} total</Text>
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
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.teal} size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PatientCard
              patient={item}
              onPress={() => router.push({ pathname: '/(doctor)/patient/[id]', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32, gap: Spacing.sm }}
          onRefresh={refetch}
          refreshing={false}
          ListEmptyComponent={
            <Text style={styles.empty}>No patients found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  header:         { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:          { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  count:          { fontSize: FontSize.sm, color: Colors.tealLight },
  searchRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, margin: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  searchInput:    { flex: 1, paddingVertical: 12, paddingHorizontal: Spacing.sm, fontSize: FontSize.base, color: Colors.textPrimary },
  filterRow:      { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.sm },
  filterBtn:      { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  filterBtnActive:{ backgroundColor: Colors.teal, borderColor: Colors.teal },
  filterText:     { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive:{ color: Colors.white },
  card:           { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, ...Shadow.sm },
  avatar:         { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText:     { fontSize: FontSize.md, fontWeight: '700', color: Colors.teal },
  name:           { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  meta:           { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  lastSeen:       { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  glucoseBadge:   { alignItems: 'center', borderRadius: Radius.md, padding: Spacing.sm, minWidth: 64 },
  glucoseValue:   { fontSize: FontSize.lg, fontWeight: '700' },
  glucoseUnit:    { fontSize: 9, fontWeight: '600', marginTop: -2 },
  glucoseLabel:   { fontSize: FontSize.xs, fontWeight: '600', marginTop: 2 },
  empty:          { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: FontSize.base },
});
