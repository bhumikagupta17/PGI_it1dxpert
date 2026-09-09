import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/authStore';
import { useAddGlucoseReading } from '../../../hooks/useGlucose';
import { glucoseApi } from '../../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { glucoseStatus } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

const MEAL_CONTEXTS = [
  { key: 'fasting',      label: 'Fasting',       icon: 'moon-outline'      },
  { key: 'before_meal',  label: 'Before Meal',   icon: 'restaurant-outline' },
  { key: 'after_meal',   label: 'After Meal',    icon: 'checkmark-circle-outline' },
  { key: 'bedtime',      label: 'Bedtime',        icon: 'bed-outline'       },
  { key: 'night',        label: 'Night',          icon: 'partly-sunny-outline' },
];

const SOURCES = ['manual', 'glucometer', 'CGM'];

export default function LogScreen() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  // Glucose log state
  const [glucoseVal, setGlucoseVal]     = useState('');
  const [mealCtx,    setMealCtx]        = useState('before_meal');
  const [source,     setSource]         = useState('manual');
  const [notes,      setNotes]          = useState('');

  // Meal log state
  const [mealDesc,   setMealDesc]       = useState('');
  const [carbs,      setCarbs]          = useState('');

  // Insulin state
  const [insulinType,  setInsulinType]  = useState('rapid');
  const [insulinUnits, setInsulinUnits] = useState('');

  const [activeTab, setActiveTab] = useState('glucose'); // glucose | meal | insulin

  const addGlucoseMut = useAddGlucoseReading();

  const addMealMut = useMutation({
    mutationFn: (data) => glucoseApi.addReading({ ...data, type: 'meal' }), // simplified
    onSuccess: () => { setMealDesc(''); setCarbs(''); Alert.alert('Meal logged!'); },
  });

  const addInsulinMut = useMutation({
    mutationFn: (data) => glucoseApi.addReading({ ...data, type: 'insulin' }), // simplified
    onSuccess: () => { setInsulinUnits(''); Alert.alert('Insulin logged!'); },
  });

  const parsed = parseFloat(glucoseVal);
  const status = !isNaN(parsed) ? glucoseStatus(parsed) : null;

  const handleGlucoseLog = () => {
    if (isNaN(parsed) || parsed < 20 || parsed > 600) {
      return Alert.alert('Invalid value', 'Enter a glucose value between 20 and 600 mg/dL.');
    }
    addGlucoseMut.mutate(
      { patientId: user.id, value: parsed, mealContext: mealCtx, source, notes, timestamp: new Date().toISOString() },
      { onSuccess: () => { setGlucoseVal(''); setNotes(''); Alert.alert('✓ Glucose logged'); } }
    );
  };

  const TABS = ['glucose', 'meal', 'insulin'];

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Log Entry</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Glucose tab ── */}
      {activeTab === 'glucose' && (
        <View style={[styles.card, Shadow.md]}>
          <Text style={styles.cardTitle}>Log Glucose Reading</Text>

          {/* Big number input */}
          <View style={styles.glucoseInputWrap}>
            <TextInput
              style={[styles.glucoseInput, status && { color: status.color }]}
              placeholder="---"
              placeholderTextColor={Colors.border}
              keyboardType="numeric"
              value={glucoseVal}
              onChangeText={setGlucoseVal}
              maxLength={3}
            />
            <Text style={styles.glucoseUnit}>mg/dL</Text>
          </View>
          {status && (
            <View style={[styles.statusRow, { backgroundColor: status.color + '15' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          )}

          {/* Meal context */}
          <Text style={styles.label}>When did you measure?</Text>
          <View style={styles.contextGrid}>
            {MEAL_CONTEXTS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.contextBtn, mealCtx === m.key && styles.contextBtnActive]}
                onPress={() => setMealCtx(m.key)}
              >
                <Ionicons name={m.icon} size={18} color={mealCtx === m.key ? Colors.white : Colors.teal} />
                <Text style={[styles.contextText, mealCtx === m.key && { color: Colors.white }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Source */}
          <Text style={styles.label}>Source</Text>
          <View style={styles.sourceRow}>
            {SOURCES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.sourceBtn, source === s && styles.sourceBtnActive]}
                onPress={() => setSource(s)}
              >
                <Text style={[styles.sourceText, source === s && { color: Colors.white }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add a note…"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleGlucoseLog} disabled={addGlucoseMut.isPending}>
            {addGlucoseMut.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Log Glucose</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Meal tab ── */}
      {activeTab === 'meal' && (
        <View style={[styles.card, Shadow.md]}>
          <Text style={styles.cardTitle}>Log Meal</Text>
          <Text style={styles.label}>What did you eat?</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Dal rice with salad…"
            placeholderTextColor={Colors.textMuted}
            value={mealDesc}
            onChangeText={setMealDesc}
            multiline
          />
          <Text style={styles.label}>Carbs (grams, optional)</Text>
          <TextInput
            style={styles.formInput}
            placeholder="45"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={carbs}
            onChangeText={setCarbs}
          />
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => {
              if (!mealDesc.trim()) return Alert.alert('Enter meal description');
              addMealMut.mutate({ patientId: user.id, description: mealDesc, carbs: parseFloat(carbs) || undefined, timestamp: new Date().toISOString() });
            }}
          >
            <Text style={styles.submitText}>Log Meal</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Insulin tab ── */}
      {activeTab === 'insulin' && (
        <View style={[styles.card, Shadow.md]}>
          <Text style={styles.cardTitle}>Log Insulin Dose</Text>
          <Text style={styles.label}>Type</Text>
          <View style={styles.sourceRow}>
            {['rapid', 'long', 'mixed'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.sourceBtn, insulinType === t && styles.sourceBtnActive]}
                onPress={() => setInsulinType(t)}
              >
                <Text style={[styles.sourceText, insulinType === t && { color: Colors.white }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Units</Text>
          <TextInput
            style={styles.formInput}
            placeholder="e.g. 4"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={insulinUnits}
            onChangeText={setInsulinUnits}
          />
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => {
              const u = parseFloat(insulinUnits);
              if (isNaN(u) || u <= 0) return Alert.alert('Enter valid units');
              addInsulinMut.mutate({ patientId: user.id, type: insulinType, units: u, timestamp: new Date().toISOString() });
            }}
          >
            <Text style={styles.submitText}>Log Insulin</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: Colors.bg },
  header:          { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  title:           { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  tabRow:          { flexDirection: 'row', margin: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.md, padding: 4, borderWidth: 1, borderColor: Colors.border },
  tabBtn:          { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm - 2 },
  tabBtnActive:    { backgroundColor: Colors.teal },
  tabText:         { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive:   { color: Colors.white },
  card:            { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl },
  cardTitle:       { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xl },
  glucoseInputWrap:{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: Spacing.md },
  glucoseInput:    { fontSize: 72, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', minWidth: 120 },
  glucoseUnit:     { fontSize: FontSize.md, color: Colors.textMuted, marginLeft: 6 },
  statusRow:       { alignSelf: 'center', paddingHorizontal: Spacing.xl, paddingVertical: 6, borderRadius: Radius.full, marginBottom: Spacing.xl },
  statusText:      { fontSize: FontSize.base, fontWeight: '700' },
  label:           { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  contextGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  contextBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.teal, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  contextBtnActive:{ backgroundColor: Colors.teal },
  contextText:     { fontSize: FontSize.xs, fontWeight: '600', color: Colors.teal },
  sourceRow:       { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  sourceBtn:       { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  sourceBtnActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  sourceText:      { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  notesInput:      { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, minHeight: 80, textAlignVertical: 'top', backgroundColor: Colors.bg, marginBottom: Spacing.md },
  formInput:       { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: FontSize.base, color: Colors.textPrimary, backgroundColor: Colors.bg, marginBottom: Spacing.md },
  submitBtn:       { backgroundColor: Colors.teal, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.lg },
  submitText:      { fontSize: FontSize.base, fontWeight: '700', color: Colors.white },
});
