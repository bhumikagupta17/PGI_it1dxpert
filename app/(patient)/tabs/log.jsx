import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { glucoseStatus } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

const MEAL_CONTEXTS = [
  { key: 'fasting',     label: 'Fasting',     icon: 'moon-outline'             },
  { key: 'before_meal', label: 'Before Meal', icon: 'restaurant-outline'       },
  { key: 'after_meal',  label: 'After Meal',  icon: 'checkmark-circle-outline' },
  { key: 'bedtime',     label: 'Bedtime',     icon: 'bed-outline'              },
  { key: 'night',       label: 'Night',       icon: 'partly-sunny-outline'     },
];

const SOURCES = ['Manual', 'Glucometer', 'CGM'];

const ACTIVITY_TYPES = [
  { key: 'walk',     label: 'Walk',     icon: 'walk-outline'       },
  { key: 'run',      label: 'Run',      icon: 'fitness-outline'    },
  { key: 'cycle',    label: 'Cycle',    icon: 'bicycle-outline'    },
  { key: 'yoga',     label: 'Yoga',     icon: 'body-outline'       },
  { key: 'gym',      label: 'Gym',      icon: 'barbell-outline'    },
  { key: 'swim',     label: 'Swim',     icon: 'water-outline'      },
  { key: 'other',    label: 'Other',    icon: 'ellipsis-horizontal-outline' },
];

const INTENSITIES = ['Light', 'Moderate', 'Intense'];

const TABS = ['Glucose', 'Meal', 'Insulin', 'Activity'];

// ── Reusable field components (must be outside parent to prevent keyboard dismiss) ──
function Label({ text }) {
  return <Text style={styles.label}>{text}</Text>;
}

function FormInput({ ...props }) {
  return (
    <TextInput
      style={styles.formInput}
      placeholderTextColor={Colors.textMuted}
      {...props}
    />
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function LogScreen() {
  const [activeTab, setActiveTab] = useState('Glucose');
  const [loading, setLoading]     = useState(false);

  // Glucose
  const [glucoseVal, setGlucoseVal] = useState('');
  const [mealCtx,    setMealCtx]    = useState('before_meal');
  const [source,     setSource]     = useState('Manual');
  const [notes,      setNotes]      = useState('');

  // Meal
  const [mealDesc, setMealDesc] = useState('');
  const [carbs,    setCarbs]    = useState('');

  // Insulin
  const [insulinType,  setInsulinType]  = useState('Rapid');
  const [insulinUnits, setInsulinUnits] = useState('');

  // Activity
  const [activityType,     setActivityType]     = useState('walk');
  const [activityDuration, setActivityDuration] = useState('');
  const [intensity,        setIntensity]        = useState('Moderate');
  const [activityNotes,    setActivityNotes]    = useState('');

  const parsed = parseFloat(glucoseVal);
  const status = !isNaN(parsed) ? glucoseStatus(parsed) : null;

  const simulate = (onSuccess) => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess(); }, 600);
  };

  const handleGlucoseLog = () => {
    if (isNaN(parsed) || parsed < 20 || parsed > 600)
      return Alert.alert('Invalid value', 'Enter a glucose value between 20 and 600 mg/dL.');
    simulate(() => {
      setGlucoseVal(''); setNotes('');
      Alert.alert('✓ Logged', `${parsed} mg/dL saved.`);
    });
  };

  const handleMealLog = () => {
    if (!mealDesc.trim()) return Alert.alert('Missing field', 'Please describe your meal.');
    simulate(() => {
      setMealDesc(''); setCarbs('');
      Alert.alert('✓ Logged', 'Meal recorded.');
    });
  };

  const handleInsulinLog = () => {
    const u = parseFloat(insulinUnits);
    if (isNaN(u) || u <= 0) return Alert.alert('Invalid units', 'Enter a valid dose.');
    simulate(() => {
      setInsulinUnits('');
      Alert.alert('✓ Logged', `${u} units of ${insulinType.toLowerCase()}-acting insulin recorded.`);
    });
  };

  const handleActivityLog = () => {
    const mins = parseFloat(activityDuration);
    if (isNaN(mins) || mins <= 0) return Alert.alert('Invalid duration', 'Enter duration in minutes.');
    simulate(() => {
      setActivityDuration(''); setActivityNotes('');
      Alert.alert('✓ Logged', `${mins} min ${activityType} recorded.`);
    });
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Log Entry</Text>
        <Text style={styles.sub}>Record glucose, meals, insulin & activity</Text>
      </View>

      {/* Tab switcher */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Glucose ── */}
      {activeTab === 'Glucose' && (
        <View style={[styles.card, Shadow.md]}>
          <Text style={styles.cardTitle}>Log Glucose Reading</Text>

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
            <View style={[styles.statusBadge, { backgroundColor: status.color + '18' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          )}

          <Label text="When did you measure?" />
          <View style={styles.contextGrid}>
            {MEAL_CONTEXTS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.contextBtn, mealCtx === m.key && styles.contextBtnActive]}
                onPress={() => setMealCtx(m.key)}
              >
                <Ionicons name={m.icon} size={16} color={mealCtx === m.key ? Colors.white : Colors.teal} />
                <Text style={[styles.contextText, mealCtx === m.key && { color: Colors.white }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label text="Source" />
          <View style={styles.chipRow}>
            {SOURCES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, source === s && styles.chipActive]}
                onPress={() => setSource(s)}
              >
                <Text style={[styles.chipText, source === s && { color: Colors.white }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label text="Notes (optional)" />
          <TextInput
            style={styles.notesInput}
            placeholder="Add a note…"
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleGlucoseLog} disabled={loading}>
            <Text style={styles.submitText}>{loading ? 'Saving…' : 'Log Glucose'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Meal ── */}
      {activeTab === 'Meal' && (
        <View style={[styles.card, Shadow.md]}>
          <Text style={styles.cardTitle}>Log Meal</Text>
          <Label text="What did you eat?" />
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Dal rice with salad…"
            placeholderTextColor={Colors.textMuted}
            value={mealDesc}
            onChangeText={setMealDesc}
            multiline
          />
          <Label text="Carbs (grams, optional)" />
          <FormInput
            placeholder="45"
            keyboardType="numeric"
            value={carbs}
            onChangeText={setCarbs}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleMealLog} disabled={loading}>
            <Text style={styles.submitText}>{loading ? 'Saving…' : 'Log Meal'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Insulin ── */}
      {activeTab === 'Insulin' && (
        <View style={[styles.card, Shadow.md]}>
          <Text style={styles.cardTitle}>Log Insulin Dose</Text>
          <Label text="Type" />
          <View style={styles.chipRow}>
            {['Rapid', 'Long', 'Mixed'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, insulinType === t && styles.chipActive]}
                onPress={() => setInsulinType(t)}
              >
                <Text style={[styles.chipText, insulinType === t && { color: Colors.white }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Label text="Units" />
          <FormInput
            placeholder="e.g. 4"
            keyboardType="numeric"
            value={insulinUnits}
            onChangeText={setInsulinUnits}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleInsulinLog} disabled={loading}>
            <Text style={styles.submitText}>{loading ? 'Saving…' : 'Log Insulin'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Activity ── */}
      {activeTab === 'Activity' && (
        <View style={[styles.card, Shadow.md]}>
          <Text style={styles.cardTitle}>Log Activity</Text>

          <Label text="Activity type" />
          <View style={styles.activityGrid}>
            {ACTIVITY_TYPES.map(a => (
              <TouchableOpacity
                key={a.key}
                style={[styles.activityBtn, activityType === a.key && styles.activityBtnActive]}
                onPress={() => setActivityType(a.key)}
              >
                <Ionicons name={a.icon} size={22} color={activityType === a.key ? Colors.white : Colors.teal} />
                <Text style={[styles.activityLabel, activityType === a.key && { color: Colors.white }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label text="Duration (minutes)" />
          <FormInput
            placeholder="e.g. 30"
            keyboardType="numeric"
            value={activityDuration}
            onChangeText={setActivityDuration}
          />

          <Label text="Intensity" />
          <View style={styles.chipRow}>
            {INTENSITIES.map(i => (
              <TouchableOpacity
                key={i}
                style={[styles.chip, intensity === i && styles.chipActive]}
                onPress={() => setIntensity(i)}
              >
                <Text style={[styles.chipText, intensity === i && { color: Colors.white }]}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label text="Notes (optional)" />
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Morning jog in the park…"
            placeholderTextColor={Colors.textMuted}
            value={activityNotes}
            onChangeText={setActivityNotes}
            multiline
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleActivityLog} disabled={loading}>
            <Text style={styles.submitText}>{loading ? 'Saving…' : 'Log Activity'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: Colors.bg },
  header:           { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  title:            { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  sub:              { fontSize: FontSize.xs, color: Colors.tealLight, marginTop: 4 },

  tabScroll:        { flexGrow: 0 },
  tabRow:           { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  tabBtn:           { paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  tabBtnActive:     { backgroundColor: Colors.teal, borderColor: Colors.teal },
  tabText:          { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive:    { color: Colors.white },

  card:             { marginHorizontal: Spacing.lg, marginTop: Spacing.sm, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl },
  cardTitle:        { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },

  glucoseInputWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: Spacing.md },
  glucoseInput:     { fontSize: 72, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', minWidth: 120 },
  glucoseUnit:      { fontSize: FontSize.md, color: Colors.textMuted, marginLeft: 6 },
  statusBadge:      { alignSelf: 'center', paddingHorizontal: Spacing.xl, paddingVertical: 6, borderRadius: Radius.full, marginBottom: Spacing.lg },
  statusText:       { fontSize: FontSize.base, fontWeight: '700' },

  label:            { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  contextGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  contextBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.teal, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  contextBtnActive: { backgroundColor: Colors.teal },
  contextText:      { fontSize: FontSize.xs, fontWeight: '600', color: Colors.teal },

  chipRow:          { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  chip:             { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  chipActive:       { backgroundColor: Colors.teal, borderColor: Colors.teal },
  chipText:         { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },

  notesInput:       { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary, minHeight: 80, textAlignVertical: 'top', backgroundColor: Colors.bg, marginBottom: Spacing.sm },
  formInput:        { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: FontSize.base, color: Colors.textPrimary, backgroundColor: Colors.bg, marginBottom: Spacing.sm },

  activityGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  activityBtn:      { width: '30%', alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.teal, gap: 4 },
  activityBtnActive:{ backgroundColor: Colors.teal },
  activityLabel:    { fontSize: FontSize.xs, fontWeight: '600', color: Colors.teal },

  submitBtn:        { backgroundColor: Colors.teal, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.lg },
  submitText:       { fontSize: FontSize.base, fontWeight: '700', color: Colors.white },
});