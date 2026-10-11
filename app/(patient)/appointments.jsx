import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../constants/theme';

// ── Mock data ─────────────────────────────────────────────────
const today = new Date();
const d = (offsetDays, h = 10, m = 0) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString();
};

const MOCK_APPOINTMENTS = [
  { id: '1', doctor: 'Dr. Akshit Sukhija', specialty: 'Endocrinology', date: d(3, 10, 30), location: 'OPD Block B, Room 14', type: 'Follow-up', status: 'confirmed', notes: 'Bring last 2 weeks glucose log' },
  { id: '2', doctor: 'Dr. Akshit Sukhija', specialty: 'Endocrinology', date: d(17, 11,  0), location: 'OPD Block B, Room 14', type: 'Quarterly Review', status: 'confirmed', notes: 'HbA1c test required before visit' },
  { id: '3', doctor: 'Dr. Priya Sharma',   specialty: 'Ophthalmology',  date: d(24,  9, 30), location: 'Eye Clinic, Ground Floor', type: 'Diabetic Eye Exam', status: 'pending', notes: '' },
  { id: '4', doctor: 'Dr. Akshit Sukhija', specialty: 'Endocrinology', date: d(-14, 10, 0), location: 'OPD Block B, Room 14', type: 'Follow-up', status: 'completed', notes: '' },
  { id: '5', doctor: 'Dr. Akshit Sukhija', specialty: 'Endocrinology', date: d(-45, 11, 0), location: 'OPD Block B, Room 14', type: 'Initial Consultation', status: 'completed', notes: '' },
];

// ── Helpers ───────────────────────────────────────────────────
const formatDate = (iso) => {
  const dt = new Date(iso);
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTime = (iso) => {
  const dt = new Date(iso);
  return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const daysUntil = (iso) => {
  const diff = new Date(iso) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const STATUS_COLOR = {
  confirmed: Colors.inRange,
  pending:   Colors.warning,
  completed: Colors.textMuted,
  cancelled: Colors.critical,
};

// ── Appointment card ──────────────────────────────────────────
function AppointmentCard({ appt, onPress }) {
  const isPast    = new Date(appt.date) < new Date();
  const days      = daysUntil(appt.date);
  const statusClr = STATUS_COLOR[appt.status] ?? Colors.textMuted;

  return (
    <TouchableOpacity style={[styles.card, Shadow.sm, isPast && { opacity: 0.65 }]} onPress={() => onPress(appt)}>
      {/* Left accent */}
      <View style={[styles.accent, { backgroundColor: statusClr }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.apptType}>{appt.type}</Text>
            <Text style={styles.apptDoctor}>{appt.doctor}</Text>
            <Text style={styles.apptSpec}>{appt.specialty}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusClr + '20' }]}>
            <Text style={[styles.statusText, { color: statusClr }]}>
              {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{formatDate(appt.date)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{formatTime(appt.date)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{appt.location}</Text>
          </View>
        </View>

        {!isPast && appt.status !== 'cancelled' && (
          <View style={styles.countdownRow}>
            <Ionicons name="alarm-outline" size={13} color={Colors.teal} />
            <Text style={styles.countdownText}>
              {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `In ${days} days`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Detail modal ──────────────────────────────────────────────
function DetailModal({ appt, onClose, onCancel }) {
  if (!appt) return null;
  const isPast = new Date(appt.date) < new Date();

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{appt.type}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {[
            { icon: 'person-outline',   label: 'Doctor',   value: appt.doctor },
            { icon: 'medical-outline',  label: 'Specialty', value: appt.specialty },
            { icon: 'calendar-outline', label: 'Date',     value: formatDate(appt.date) },
            { icon: 'time-outline',     label: 'Time',     value: formatTime(appt.date) },
            { icon: 'location-outline', label: 'Location', value: appt.location },
          ].map(row => (
            <View key={row.label} style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name={row.icon} size={16} color={Colors.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text style={styles.detailValue}>{row.value}</Text>
              </View>
            </View>
          ))}

          {appt.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{appt.notes}</Text>
            </View>
          ) : null}

          {!isPast && appt.status !== 'cancelled' && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { onCancel(appt.id); onClose(); }}
            >
              <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────
export default function AppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('upcoming');

  const upcoming = appointments.filter(a => new Date(a.date) >= new Date() && a.status !== 'cancelled');
  const past     = appointments.filter(a => new Date(a.date) <  new Date() || a.status === 'cancelled');

  const cancelAppt = (id) => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel?', [
      { text: 'No' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: () => setAppointments(prev =>
          prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a)
        ),
      },
    ]);
  };

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Appointments</Text>
          <Text style={styles.sub}>{upcoming.length} upcoming</Text>
        </View>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        {['upcoming', 'past'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {list.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No {tab} appointments</Text>
          </View>
        ) : (
          list
            .sort((a, b) => tab === 'upcoming'
              ? new Date(a.date) - new Date(b.date)
              : new Date(b.date) - new Date(a.date))
            .map(a => (
              <AppointmentCard key={a.id} appt={a} onPress={setSelected} />
            ))
        )}
      </ScrollView>

      <DetailModal
        appt={selected}
        onClose={() => setSelected(null)}
        onCancel={cancelAppt}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  header:         { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  back:           { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  title:          { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  sub:            { fontSize: FontSize.sm, color: Colors.tealLight, marginTop: 2 },
  tabRow:         { flexDirection: 'row', margin: Spacing.lg, marginBottom: 0, backgroundColor: Colors.white, borderRadius: Radius.md, padding: 4, ...Shadow.sm },
  tabBtn:         { flex: 1, paddingVertical: 8, borderRadius: Radius.sm, alignItems: 'center' },
  tabBtnActive:   { backgroundColor: Colors.teal },
  tabText:        { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive:  { color: Colors.white },
  list:           { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 40 },
  card:           { backgroundColor: Colors.white, borderRadius: Radius.md, flexDirection: 'row', overflow: 'hidden' },
  accent:         { width: 4 },
  cardBody:       { flex: 1, padding: Spacing.md },
  cardTop:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  apptType:       { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  apptDoctor:     { fontSize: FontSize.sm, color: Colors.teal, fontWeight: '600', marginTop: 2 },
  apptSpec:       { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statusText:     { fontSize: FontSize.xs, fontWeight: '700' },
  cardMeta:       { gap: 4 },
  metaRow:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:       { fontSize: FontSize.xs, color: Colors.textSecondary },
  countdownRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm },
  countdownText:  { fontSize: FontSize.xs, color: Colors.teal, fontWeight: '700' },
  empty:          { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText:      { fontSize: FontSize.base, color: Colors.textMuted },
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: 40 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle:     { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  detailRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  detailIcon:     { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.teal + '15', justifyContent: 'center', alignItems: 'center' },
  detailLabel:    { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
  detailValue:    { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '500', marginTop: 1 },
  notesBox:       { backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  notesLabel:     { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, marginBottom: 4 },
  notesText:      { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  cancelBtn:      { borderWidth: 1.5, borderColor: Colors.critical, borderRadius: Radius.md, paddingVertical: 13, alignItems: 'center', marginTop: Spacing.sm },
  cancelBtnText:  { fontSize: FontSize.base, fontWeight: '700', color: Colors.critical },
});