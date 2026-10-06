import { useState } from 'react';
import {
  View, Text, SectionList, StyleSheet,
  TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTime, formatDate } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

const now = new Date();
const today = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

function d(h, m, offsetDays = 0) {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString();
}

const MOCK_APPOINTMENTS = [
  { id: 'a1', patientName: 'Rahul Sharma',  scheduledAt: d(9,  0),  duration: 30, type: 'in_person',  status: 'scheduled',  notes: 'Glucose review — recurring high readings' },
  { id: 'a2', patientName: 'Priya Mehta',   scheduledAt: d(9,  45), duration: 20, type: 'teleconsult', status: 'scheduled',  notes: 'Hypoglycaemia follow-up', meetLink: 'https://meet.example.com/priya' },
  { id: 'a3', patientName: 'Ankit Verma',   scheduledAt: d(11, 0),  duration: 30, type: 'in_person',  status: 'scheduled',  notes: 'Quarterly T2D review' },
  { id: 'a4', patientName: 'Sana Khan',     scheduledAt: d(11, 45), duration: 20, type: 'teleconsult', status: 'completed',  notes: 'Post-meal spikes', meetLink: 'https://meet.example.com/sana' },
  { id: 'a5', patientName: 'Dev Patel',     scheduledAt: d(14, 0),  duration: 30, type: 'in_person',  status: 'scheduled',  notes: 'Medication adjustment' },
  { id: 'a6', patientName: 'Neha Singh',    scheduledAt: d(9,  0,  1), duration: 30, type: 'in_person',  status: 'scheduled',  notes: 'Annual review' },
  { id: 'a7', patientName: 'Arun Kapoor',   scheduledAt: d(10, 30, 1), duration: 20, type: 'teleconsult', status: 'scheduled',  notes: '', meetLink: 'https://meet.example.com/arun' },
  { id: 'a8', patientName: 'Rahul Sharma',  scheduledAt: d(14, 0,  1), duration: 30, type: 'in_person',  status: 'scheduled',  notes: 'Insulin titration' },
  { id: 'a9', patientName: 'Priya Mehta',   scheduledAt: d(9,  0, -1), duration: 30, type: 'in_person',  status: 'completed',  notes: 'Completed yesterday' },
  { id:'a10', patientName: 'Ankit Verma',   scheduledAt: d(11, 0, -1), duration: 20, type: 'teleconsult', status: 'no_show',    notes: 'Patient did not attend', meetLink: 'https://meet.example.com/ankit' },
];

const STATUS_CFG = {
  scheduled: { color: Colors.teal,     label: 'Scheduled' },
  completed: { color: Colors.inRange,  label: 'Completed' },
  cancelled: { color: Colors.critical, label: 'Cancelled' },
  no_show:   { color: Colors.amber,    label: 'No-show'   },
};

function AppointmentCard({ appt, onCancel }) {
  const cfg   = STATUS_CFG[appt.status] ?? STATUS_CFG.scheduled;
  const isTC  = appt.type === 'teleconsult';
  return (
    <View style={[styles.card, Shadow.sm]}>
      {/* Time column */}
      <View style={[styles.timeCol, { backgroundColor: cfg.color + '18' }]}>
        <Text style={[styles.timeText, { color: cfg.color }]}>{formatTime(appt.scheduledAt)}</Text>
        <Text style={styles.durationText}>{appt.duration}m</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text style={styles.patientName}>{appt.patientName}</Text>
        <View style={styles.typeRow}>
          <Ionicons name={isTC ? 'videocam' : 'person'} size={12} color={Colors.textMuted} />
          <Text style={styles.typeText}>{isTC ? 'Teleconsult' : 'In-person'}</Text>
        </View>
        {appt.notes !== '' && <Text style={styles.notes} numberOfLines={2}>{appt.notes}</Text>}
      </View>

      {/* Right actions */}
      <View style={styles.rightCol}>
        <View style={[styles.statusBadge, { backgroundColor: cfg.color + '15' }]}>
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        {appt.status === 'scheduled' && (
          <TouchableOpacity onPress={() => onCancel(appt.id)}>
            <Ionicons name="close-circle-outline" size={22} color={Colors.critical} />
          </TouchableOpacity>
        )}
        {isTC && appt.meetLink && appt.status === 'scheduled' && (
          <TouchableOpacity style={styles.joinBtn}>
            <Ionicons name="videocam" size={14} color={Colors.white} />
            <Text style={styles.joinText}>Join</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState({ patientName: '', date: '', time: '', duration: '30', type: 'in_person', notes: '' });

  const handleCancel = (id) => {
    Alert.alert('Cancel appointment?', 'This cannot be undone.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel Appointment', style: 'destructive', onPress: () =>
          setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
      },
    ]);
  };

  const handleCreate = () => {
    if (!form.patientName.trim() || !form.date || !form.time) {
      Alert.alert('Missing fields', 'Please fill in patient name, date and time.');
      return;
    }
    const iso = new Date(`${form.date}T${form.time}:00`).toISOString();
    const newAppt = {
      id: 'new-' + Date.now(),
      patientName: form.patientName.trim(),
      scheduledAt: iso,
      duration: parseInt(form.duration) || 30,
      type: form.type,
      status: 'scheduled',
      notes: form.notes,
      meetLink: form.type === 'teleconsult' ? 'https://meet.example.com/new' : undefined,
    };
    setAppointments(prev => [...prev, newAppt]);
    setForm({ patientName: '', date: '', time: '', duration: '30', type: 'in_person', notes: '' });
    setShowModal(false);
  };

  // Group by formatted date
  const grouped = {};
  appointments.forEach(a => {
    const key = formatDate(a.scheduledAt);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });
  const sections = Object.entries(grouped)
    .sort(([a], [b]) => new Date(appointments.find(x => formatDate(x.scheduledAt) === a)?.scheduledAt) -
                        new Date(appointments.find(x => formatDate(x.scheduledAt) === b)?.scheduledAt))
    .map(([title, data]) => ({ title, data: data.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)) }));

  const todayCount     = appointments.filter(a => a.status === 'scheduled' && formatDate(a.scheduledAt) === formatDate(new Date().toISOString())).length;
  const upcomingCount  = appointments.filter(a => a.status === 'scheduled').length;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Schedule</Text>
          <Text style={styles.subtitle}>{todayCount} today · {upcomingCount} upcoming</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Today banner */}
      <View style={styles.todayBanner}>
        <Ionicons name="calendar" size={16} color={Colors.teal} />
        <Text style={styles.todayText}>{today}</Text>
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
          <AppointmentCard appt={item} onCancel={handleCancel} />
        )}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
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
              { label: 'Patient Name', key: 'patientName', placeholder: 'e.g. Rahul Sharma', keyboard: 'default' },
              { label: 'Date (YYYY-MM-DD)', key: 'date', placeholder: '2026-09-16', keyboard: 'numeric' },
              { label: 'Time (HH:MM)', key: 'time', placeholder: '10:00', keyboard: 'numeric' },
              { label: 'Duration (minutes)', key: 'duration', placeholder: '30', keyboard: 'numeric' },
            ].map(f => (
              <View key={f.key} style={{ marginBottom: Spacing.md }}>
                <Text style={styles.formLabel}>{f.label}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={f.keyboard}
                  value={form[f.key]}
                  onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                />
              </View>
            ))}

            <Text style={styles.formLabel}>Type</Text>
            <View style={styles.typeToggleRow}>
              {['in_person', 'teleconsult'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeToggleBtn, form.type === t && styles.typeToggleBtnActive]}
                  onPress={() => setForm(f => ({ ...f, type: t }))}
                >
                  <Ionicons name={t === 'teleconsult' ? 'videocam' : 'person'} size={16} color={form.type === t ? Colors.white : Colors.teal} />
                  <Text style={[styles.typeToggleText, form.type === t && { color: Colors.white }]}>
                    {t === 'in_person' ? 'In-Person' : 'Teleconsult'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
              <Text style={styles.createBtnText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: Colors.bg },

  header:             { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:              { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  subtitle:           { fontSize: FontSize.xs, color: Colors.tealLight, marginTop: 3 },
  addBtn:             { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.teal, justifyContent: 'center', alignItems: 'center' },

  todayBanner:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.teal + '12', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  todayText:          { fontSize: FontSize.sm, color: Colors.teal, fontWeight: '600' },

  dateHeader:         { paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  dateText:           { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.7 },

  card:               { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  timeCol:            { borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, alignItems: 'center', minWidth: 58 },
  timeText:           { fontSize: FontSize.sm, fontWeight: '800' },
  durationText:       { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  patientName:        { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  typeRow:            { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  typeText:           { fontSize: FontSize.xs, color: Colors.textMuted },
  notes:              { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4, lineHeight: 16 },
  rightCol:           { alignItems: 'flex-end', gap: Spacing.xs },
  statusBadge:        { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:         { fontSize: FontSize.xs, fontWeight: '700' },
  joinBtn:            { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.teal, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  joinText:           { fontSize: FontSize.xs, color: Colors.white, fontWeight: '700' },

  empty:              { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: FontSize.base },

  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:          { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle:         { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  formLabel:          { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  formInput:          { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 11, fontSize: FontSize.base, color: Colors.textPrimary, backgroundColor: Colors.bg, marginBottom: Spacing.md },
  typeToggleRow:      { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  typeToggleBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1.5, borderColor: Colors.teal, borderRadius: Radius.md, paddingVertical: 11 },
  typeToggleBtnActive:{ backgroundColor: Colors.teal },
  typeToggleText:     { fontSize: FontSize.sm, fontWeight: '700', color: Colors.teal },
  createBtn:          { backgroundColor: Colors.teal, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  createBtnText:      { fontSize: FontSize.base, fontWeight: '700', color: Colors.white },
});
