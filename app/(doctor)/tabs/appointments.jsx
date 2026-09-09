import { useState } from 'react';
import {
  View, Text, SectionList, StyleSheet,
  TouchableOpacity, RefreshControl, Modal, TextInput, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { appointmentsApi } from '../../../lib/api';
import { formatDate, formatTime } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

const STATUS_COLOR = {
  scheduled:  Colors.teal,
  completed:  Colors.inRange,
  cancelled:  Colors.critical,
  no_show:    Colors.amber,
};

function AppointmentCard({ appt, onCancel }) {
  const color = STATUS_COLOR[appt.status] ?? Colors.info;
  return (
    <View style={[styles.card, Shadow.sm]}>
      <View style={[styles.timeCol, { backgroundColor: color + '15' }]}>
        <Text style={[styles.timeText, { color }]}>{formatTime(appt.scheduledAt)}</Text>
        <Text style={styles.durationText}>{appt.duration}m</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.patientName}>{appt.patientName}</Text>
        <View style={styles.typeRow}>
          <Ionicons
            name={appt.type === 'teleconsult' ? 'videocam' : 'person'}
            size={12} color={Colors.textMuted}
          />
          <Text style={styles.typeTxt}>{appt.type === 'teleconsult' ? 'Teleconsult' : 'In-person'}</Text>
        </View>
        {appt.notes && <Text style={styles.notes}>{appt.notes}</Text>}
      </View>
      <View style={styles.rightCol}>
        <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.statusText, { color }]}>{appt.status}</Text>
        </View>
        {appt.status === 'scheduled' && (
          <TouchableOpacity onPress={() => onCancel(appt.id)}>
            <Ionicons name="close-circle-outline" size={20} color={Colors.critical} />
          </TouchableOpacity>
        )}
        {appt.type === 'teleconsult' && appt.meetLink && (
          <TouchableOpacity>
            <Ionicons name="videocam" size={20} color={Colors.teal} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function AppointmentsScreen() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patientId: '', scheduledAt: '', duration: '30', type: 'in_person', notes: '' });

  const { data: appointments, isRefetching, refetch } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => { const { data } = await appointmentsApi.getAll(); return data.data; },
    staleTime: 5 * 60 * 1000,
  });

  const cancelMut = useMutation({
    mutationFn: (id) => appointmentsApi.cancel(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const createMut = useMutation({
    mutationFn: (data) => appointmentsApi.create(data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['appointments'] }); setShowModal(false); },
  });

  // Group by date
  const grouped = {};
  (appointments ?? []).forEach(a => {
    const key = formatDate(a.scheduledAt);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });
  const sections = Object.entries(grouped).map(([title, data]) => ({ title, data }));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Schedule</Text>
          <Text style={styles.sub}>{appointments?.length ?? 0} appointments</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <AppointmentCard
            appt={item}
            onCancel={(id) => {
              Alert.alert('Cancel appointment?', 'This cannot be undone.', [
                { text: 'No' },
                { text: 'Cancel Appointment', style: 'destructive', onPress: () => cancelMut.mutate(id) },
              ]);
            }}
          />
        )}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={<Text style={styles.empty}>No appointments scheduled</Text>}
      />

      {/* New appointment modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Appointment</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {[
              { label: 'Patient ID', key: 'patientId', placeholder: 'patient-uuid' },
              { label: 'Date & Time (ISO)', key: 'scheduledAt', placeholder: '2026-09-10T10:00:00' },
              { label: 'Duration (minutes)', key: 'duration', placeholder: '30' },
              { label: 'Notes', key: 'notes', placeholder: 'Optional notes' },
            ].map(f => (
              <View key={f.key} style={{ marginBottom: Spacing.md }}>
                <Text style={styles.formLabel}>{f.label}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  value={form[f.key]}
                  onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                />
              </View>
            ))}
            <View style={styles.typeRow2}>
              {['in_person', 'teleconsult'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}
                  onPress={() => setForm(f => ({ ...f, type: t }))}
                >
                  <Text style={[styles.typeText, form.type === t && { color: Colors.white }]}>
                    {t === 'in_person' ? 'In-Person' : 'Teleconsult'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => createMut.mutate({ ...form, duration: parseInt(form.duration) })}
            >
              <Text style={styles.createBtnText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.bg },
  header:       { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:        { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  sub:          { fontSize: FontSize.sm, color: Colors.tealLight, marginTop: 4 },
  addBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },
  dateHeader:   { backgroundColor: Colors.bg, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs },
  dateText:     { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  card:         { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  timeCol:      { borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center', minWidth: 52 },
  timeText:     { fontSize: FontSize.sm, fontWeight: '700' },
  durationText: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  patientName:  { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  typeRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  typeTxt:      { fontSize: FontSize.xs, color: Colors.textMuted },
  notes:        { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  rightCol:     { alignItems: 'flex-end', gap: Spacing.xs },
  statusBadge:  { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:   { fontSize: FontSize.xs, fontWeight: '700', textTransform: 'capitalize' },
  empty:        { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle:   { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  formLabel:    { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  formInput:    { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 11, fontSize: FontSize.base, color: Colors.textPrimary, backgroundColor: Colors.bg },
  typeRow2:     { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  typeBtn:      { flex: 1, borderWidth: 1, borderColor: Colors.teal, borderRadius: Radius.md, paddingVertical: 11, alignItems: 'center' },
  typeBtnActive:{ backgroundColor: Colors.teal },
  typeText:     { fontSize: FontSize.sm, fontWeight: '600', color: Colors.teal },
  createBtn:    { backgroundColor: Colors.teal, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  createBtnText:{ fontSize: FontSize.base, fontWeight: '700', color: Colors.white },
});
