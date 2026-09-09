import { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

// Mock data — replace with API calls
const MOCK_MEDS = [
  { id: '1', name: 'NovoRapid (Insulin Aspart)', dose: '4–8 units', frequency: 'Before meals', times: ['07:30', '12:30', '18:30'], active: true,  type: 'insulin' },
  { id: '2', name: 'Lantus (Insulin Glargine)',  dose: '20 units',  frequency: 'Once daily',   times: ['22:00'],                   active: true,  type: 'insulin' },
  { id: '3', name: 'Metformin',                  dose: '500 mg',    frequency: 'Twice daily',  times: ['08:00', '20:00'],          active: true,  type: 'tablet'  },
  { id: '4', name: 'Vitamin D3',                 dose: '60,000 IU', frequency: 'Weekly',       times: ['Sunday 09:00'],            active: false, type: 'tablet'  },
];

function MedCard({ med, onToggle }) {
  return (
    <View style={[styles.card, Shadow.sm, !med.active && { opacity: 0.5 }]}>
      <View style={[styles.typeIcon, { backgroundColor: med.type === 'insulin' ? Colors.teal + '20' : Colors.amber + '20' }]}>
        <Ionicons
          name={med.type === 'insulin' ? 'water-outline' : 'tablet-portrait-outline'}
          size={20}
          color={med.type === 'insulin' ? Colors.teal : Colors.amber}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.medName}>{med.name}</Text>
        <Text style={styles.medDose}>{med.dose} · {med.frequency}</Text>
        <View style={styles.timesRow}>
          {med.times.map(t => (
            <View key={t} style={styles.timePill}>
              <Ionicons name="time-outline" size={11} color={Colors.teal} />
              <Text style={styles.timeText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
      <TouchableOpacity onPress={() => onToggle(med.id)}>
        <Ionicons
          name={med.active ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={med.active ? Colors.inRange : Colors.border}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function MedicationsScreen() {
  const [meds, setMeds] = useState(MOCK_MEDS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', dose: '', frequency: '', times: '' });

  const toggle = (id) =>
    setMeds(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));

  const addMed = () => {
    if (!form.name || !form.dose) return Alert.alert('Fill name and dose');
    setMeds(prev => [...prev, {
      id: Date.now().toString(),
      name: form.name,
      dose: form.dose,
      frequency: form.frequency,
      times: form.times.split(',').map(t => t.trim()).filter(Boolean),
      active: true,
      type: 'tablet',
    }]);
    setForm({ name: '', dose: '', frequency: '', times: '' });
    setShowModal(false);
  };

  const activeMeds = meds.filter(m => m.active);
  const inactiveMeds = meds.filter(m => !m.active);

  const today = new Date();
  const nextDose = activeMeds
    .flatMap(m => m.times.map(t => ({ med: m.name, time: t })))
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Medications</Text>
          <Text style={styles.sub}>{activeMeds.length} active</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Next dose reminder */}
      {nextDose && (
        <View style={styles.nextDoseCard}>
          <Ionicons name="alarm-outline" size={20} color={Colors.amber} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nextDoseLabel}>Next dose</Text>
            <Text style={styles.nextDoseName}>{nextDose.med}</Text>
          </View>
          <Text style={styles.nextDoseTime}>{nextDose.time}</Text>
        </View>
      )}

      <FlatList
        data={[...activeMeds, ...inactiveMeds]}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <MedCard med={item} onToggle={toggle} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.sm }}
        ListHeaderComponent={<Text style={styles.sectionHeader}>ACTIVE & INACTIVE</Text>}
      />

      {/* Add medication modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medication</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {[
              { label: 'Medication name', key: 'name', placeholder: 'e.g. Metformin' },
              { label: 'Dose',            key: 'dose', placeholder: 'e.g. 500 mg' },
              { label: 'Frequency',       key: 'frequency', placeholder: 'e.g. Twice daily' },
              { label: 'Times (comma-separated)', key: 'times', placeholder: '08:00, 20:00' },
            ].map(f => (
              <View key={f.key} style={{ marginBottom: Spacing.md }}>
                <Text style={styles.formLabel}>{f.label}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  value={form[f.key]}
                  onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.addMedBtn} onPress={addMed}>
              <Text style={styles.addMedText}>Add Medication</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.bg },
  header:        { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:         { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  sub:           { fontSize: FontSize.sm, color: Colors.tealLight, marginTop: 4 },
  addBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },
  nextDoseCard:  { margin: Spacing.lg, backgroundColor: Colors.amber + '18', borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.amber + '40' },
  nextDoseLabel: { fontSize: FontSize.xs, color: Colors.amber, fontWeight: '600' },
  nextDoseName:  { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  nextDoseTime:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.amber },
  sectionHeader: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.sm },
  card:          { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  typeIcon:      { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  medName:       { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  medDose:       { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  timesRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  timePill:      { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.teal + '15', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  timeText:      { fontSize: FontSize.xs, color: Colors.teal, fontWeight: '600' },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle:    { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  formLabel:     { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  formInput:     { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 11, fontSize: FontSize.base, color: Colors.textPrimary, backgroundColor: Colors.bg },
  addMedBtn:     { backgroundColor: Colors.teal, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.sm },
  addMedText:    { fontSize: FontSize.base, fontWeight: '700', color: Colors.white },
});
